import { eq, and } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { agentToolCalls } from '../db/schema.ts';
import type { InsertAgentToolCall } from '../db/types.ts';

export class AgentToolCallRepository {
  /**
   * Create a new tool call
   */
  async create(input: Pick<InsertAgentToolCall, 'triggeringMessageId' | 'responseMessageId' | 'threadId' | 'ownerUserId' | 'toolName' | 'toolInput'> & { requestId?: string | null }) {
    const { db, cleanup } = await getDB();
    try {
      const [toolCall] = await db
        .insert(agentToolCalls)
        .values({
          triggeringMessageId: input.triggeringMessageId,
          responseMessageId: input.responseMessageId,
          threadId: input.threadId,
          ownerUserId: input.ownerUserId,
          toolName: input.toolName,
          toolInput: input.toolInput,
          requestId: input.requestId || null,
          approvalStatus: 'pending',
          timestamp: new Date().toISOString(),
        })
        .returning();
      return toolCall;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find tool call by ID
   */
  async findById(toolCallId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [toolCall] = await db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.id, toolCallId))
        .limit(1);
      return toolCall || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Update tool call status
   */
  async updateStatus(
    toolCallId: string,
    status: 'approved' | 'rejected' | 'timeout',
    output?: Record<string, any>
  ) {
    const { db, cleanup } = await getDB();
    try {
      const [toolCall] = await db
        .update(agentToolCalls)
        .set({
          approvalStatus: status,
          toolOutput: output || null,
        })
        .where(eq(agentToolCalls.id, toolCallId))
        .returning();
      return toolCall;
    } finally {
      await cleanup();
    }
  }

  /**
   * Reject tool with revision tracking
   */
  async rejectWithRevisionTracking(
    toolCallId: string,
    reason?: string
  ): Promise<{ toolCall: any; maxRevisionsReached: boolean }> {
    const { db, cleanup } = await getDB();
    try {
      const toolCall = await this.findById(toolCallId);
      if (!toolCall) {
        throw new Error('Tool call not found');
      }

      const newRevisionCount = (toolCall.revisionCount || 0) + 1;
      const maxRevisionsReached = newRevisionCount >= 3;

      const historyEntry = {
        attempt: newRevisionCount,
        toolInput: toolCall.toolInput,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || 'User rejected',
      };

      const revisionHistory = (toolCall.revisionHistory as any[]) || [];
      revisionHistory.push(historyEntry);

      const [updated] = await db
        .update(agentToolCalls)
        .set({
          approvalStatus: 'rejected',
          revisionCount: newRevisionCount,
          rejectionReason: reason || 'User rejected',
          revisionHistory: revisionHistory,
          toolOutput: { reason: reason || 'User rejected' },
        })
        .where(eq(agentToolCalls.id, toolCallId))
        .returning();

      return { toolCall: updated, maxRevisionsReached };
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all tool calls by request ID
   */
  async findByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.requestId, requestId))
        .orderBy(agentToolCalls.timestamp);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find pending tool calls by request ID
   */
  async findPendingByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentToolCalls)
        .where(
          and(
            eq(agentToolCalls.requestId, requestId),
            eq(agentToolCalls.approvalStatus, 'pending')
          )
        )
        .orderBy(agentToolCalls.timestamp);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find pending tool calls for a thread
   */
  async findPendingByThreadId(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentToolCalls)
        .where(
          and(
            eq(agentToolCalls.threadId, threadId),
            eq(agentToolCalls.approvalStatus, 'pending')
          )
        )
        .orderBy(agentToolCalls.timestamp);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all tool calls for a response message
   */
  async findByResponseMessageId(responseMessageId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.responseMessageId, responseMessageId))
        .orderBy(agentToolCalls.timestamp);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all tool calls for a thread
   */
  async findByThreadId(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.threadId, threadId))
        .orderBy(agentToolCalls.timestamp);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find latest tool call by request (for resume logic)
   * Returns the most recent tool call for a request, used when resuming after approval
   */
  async findLatestByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [toolCall] = await db
        .select()
        .from(agentToolCalls)
        .where(eq(agentToolCalls.requestId, requestId))
        .orderBy(agentToolCalls.timestamp)
        .limit(1);
      return toolCall || null;
    } finally {
      await cleanup();
    }
  }
}

export const agentToolCallRepository = new AgentToolCallRepository();
