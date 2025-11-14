/**
 * Consolidation Service
 * Business logic for branch consolidation operations
 */

import { agentRequestRepository } from "../repositories/agentRequest.ts";
import { agentExecutionEventRepository } from "../repositories/agentExecutionEvent.ts";
import { fileRepository } from "../repositories/file.ts";
import { threadRepository } from "../repositories/thread.ts";
import { messageRepository } from "../repositories/message.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("ConsolidationService");

export interface ConsolidateBranchesInput {
  threadId: string;
  childBranchIds: string[];
  targetFolder: string;
  fileName: string;
}

export class ConsolidationService {
  /**
   * Start consolidation request
   * Creates agent_request and triggers async execution
   */
  static async startConsolidation(
    input: ConsolidateBranchesInput,
    userId: string
  ): Promise<{
    requestId: string;
    fileId: string;
    status: "pending";
  }> {
    logger.info("Starting consolidation", { input, userId });

    // Create agent request
    const request = await agentRequestRepository.create({
      userId,
      threadId: input.threadId,
      triggeringMessageId: "", // No triggering message for consolidation
      agentType: "consolidation",
      content: JSON.stringify(input),
    });

    logger.info("Consolidation request created", { requestId: request.id });

    // Generate file ID upfront (permanent ID pattern)
    const fileId = crypto.randomUUID();

    // Trigger async execution (fire and forget)
    this.executeConsolidation(request.id, fileId, input, userId).catch(
      (error) => {
        logger.error("Consolidation execution failed", {
          requestId: request.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    );

    return {
      requestId: request.id,
      fileId,
      status: "pending",
    };
  }

  /**
   * Execute consolidation and write events to agent_execution_events
   * Frontend subscribes to these events via realtime
   */
  private static async executeConsolidation(
    requestId: string,
    fileId: string,
    input: ConsolidateBranchesInput,
    userId: string
  ): Promise<void> {
    try {
      logger.info("Executing consolidation", { requestId, input });

      // Update request status
      await agentRequestRepository.update(requestId, {
        status: "in_progress",
        progress: 0.1,
      });

      // ========================================================================
      // Step 1: Validate thread ownership
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_progress", {
        stage: "Validating thread ownership",
        progress: 0.2,
      });

      const thread = await threadRepository.findById(input.threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      if (thread.ownerUserId !== userId) {
        throw new Error("Unauthorized: Thread does not belong to user");
      }

      // ========================================================================
      // Step 2: Fetch child branches
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_progress", {
        stage: "Fetching child branches",
        progress: 0.3,
      });

      // Verify child branches exist
      const childThreads = await Promise.all(
        input.childBranchIds.map((id) => threadRepository.findById(id))
      );

      const missingBranches = childThreads.filter((t) => !t);
      if (missingBranches.length > 0) {
        throw new Error(
          `Child branches not found: ${missingBranches.length} missing`
        );
      }

      // ========================================================================
      // Step 3: Collect messages from all branches
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_progress", {
        stage: "Collecting messages from branches",
        progress: 0.4,
      });

      const branchMessages = await Promise.all(
        input.childBranchIds.map(async (branchId) => {
          const messages = await messageRepository.findByThreadId(branchId);
          return {
            branchId,
            branchTitle:
              childThreads.find((t) => t?.id === branchId)?.branchTitle ||
              "Untitled",
            messages,
          };
        })
      );

      // ========================================================================
      // Step 4: Generate consolidated content
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_progress", {
        stage: "Generating consolidated content",
        progress: 0.6,
      });

      // Simple consolidation: concatenate all assistant messages with branch headers
      let consolidatedContent = "# Consolidated Response\n\n";
      consolidatedContent += `_Generated from ${input.childBranchIds.length} branches_\n\n`;
      consolidatedContent += "---\n\n";

      const provenance: Record<string, string> = {};

      for (const branch of branchMessages) {
        consolidatedContent += `## ${branch.branchTitle}\n\n`;
        provenance[branch.branchId] = branch.branchTitle;

        // Extract assistant messages
        const assistantMessages = branch.messages.filter(
          (m) => m.role === "assistant"
        );

        for (const message of assistantMessages) {
          consolidatedContent += message.content + "\n\n";
        }

        consolidatedContent += "---\n\n";
      }

      // ========================================================================
      // Step 5: Create file
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_progress", {
        stage: "Creating file",
        progress: 0.8,
      });

      const filePath = `${input.targetFolder}/${input.fileName}`.replace(
        /\/+/g,
        "/"
      );

      await fileRepository.create({
        id: fileId, // Use permanent ID
        path: filePath,
        content: consolidatedContent,
        ownerUserId: userId,
        provenance: {
          createdInThreadId: input.threadId,
          contextSummary: `Consolidated from ${input.childBranchIds.length} branches`,
        },
      });

      logger.info("File created", { fileId, path: filePath });

      // ========================================================================
      // Step 6: Send content event with provenance
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_content", {
        content: consolidatedContent,
        provenance,
      });

      // ========================================================================
      // Step 7: Mark complete
      // ========================================================================
      await this.writeEvent(requestId, "consolidation_complete", {
        fileId,
        status: "completed",
      });

      await agentRequestRepository.update(requestId, {
        status: "completed",
        progress: 1.0,
        completedAt: new Date().toISOString(),
        results: {
          fileId,
          filePath,
        },
      });

      logger.info("Consolidation complete", { requestId, fileId });
    } catch (error) {
      logger.error("Consolidation failed", {
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Write error event
      await this.writeEvent(requestId, "consolidation_error", {
        message:
          error instanceof Error ? error.message : "Consolidation failed",
        details: error instanceof Error ? error.stack : undefined,
      });

      // Update request status
      await agentRequestRepository.update(requestId, {
        status: "failed",
        progress: 1.0,
        completedAt: new Date().toISOString(),
        results: {
          error:
            error instanceof Error ? error.message : "Consolidation failed",
        },
      });
    }
  }

  /**
   * Write event to agent_execution_events table
   * Frontend subscribes via Supabase realtime
   */
  private static async writeEvent(
    requestId: string,
    type: string,
    data: any
  ): Promise<void> {
    try {
      await agentExecutionEventRepository.create({
        requestId,
        type,
        data,
      });
      logger.info("Event written", { requestId, type });
    } catch (error) {
      logger.error("Failed to write event", {
        requestId,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - continue execution even if event write fails
    }
  }
}

export const consolidationService = ConsolidationService;
