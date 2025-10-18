// Centrid AI Filesystem - AI Agent Execution Edge Function
// Version: 3.1 - Supabase Plus MVP Architecture

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AgentRequest {
  requestId: string;
  userId: string;
  agentType: "create" | "edit" | "research";
  content: string;
  contextDocuments?: string[];
  sessionId?: string;
  preferences?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

interface AIModelConfig {
  model: string;
  apiKey: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const agentRequest: AgentRequest = await req.json();

    if (
      !agentRequest.requestId ||
      !agentRequest.userId ||
      !agentRequest.agentType ||
      !agentRequest.content
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: requestId, userId, agentType, content",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update agent request status to processing
    await supabase
      .from("agent_requests")
      .update({
        status: "processing",
        progress: 0.1,
      })
      .eq("id", agentRequest.requestId);

    try {
      // Get user context and usage limits
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("plan, usage_count")
        .eq("id", agentRequest.userId)
        .single();

      // Check usage limits
      const canExecute = await checkUsageLimits(
        supabase,
        agentRequest.userId,
        userProfile?.plan || "free"
      );
      if (!canExecute) {
        throw new Error("Usage limit exceeded for current plan");
      }

      // Update progress
      await updateProgress(supabase, agentRequest.requestId, 0.2);

      // Build context from documents
      const context = await buildContext(
        supabase,
        agentRequest.userId,
        agentRequest.contextDocuments
      );

      // Update progress
      await updateProgress(supabase, agentRequest.requestId, 0.3);

      // Select appropriate AI model based on agent type and user preferences
      const modelConfig = selectModel(
        agentRequest.agentType,
        agentRequest.preferences
      );

      // Update progress
      await updateProgress(supabase, agentRequest.requestId, 0.4);

      // Execute AI agent
      const aiResponse = await executeAIModel(
        modelConfig,
        agentRequest,
        context
      );

      // Update progress
      await updateProgress(supabase, agentRequest.requestId, 0.8);

      // Process and validate response
      const processedResponse = await processAIResponse(
        aiResponse,
        agentRequest.agentType
      );

      // Update agent request with results
      const { error: updateError } = await supabase
        .from("agent_requests")
        .update({
          status: "completed",
          progress: 1.0,
          results: processedResponse,
          model_used: modelConfig.model,
          tokens_used: aiResponse.usage?.total_tokens || 0,
          cost_usd: calculateCost(
            modelConfig.model,
            aiResponse.usage?.total_tokens || 0
          ),
        })
        .eq("id", agentRequest.requestId);

      if (updateError) {
        throw new Error(
          `Failed to update agent request: ${updateError.message}`
        );
      }

      // Log usage event
      await supabase.from("usage_events").insert({
        user_id: agentRequest.userId,
        event_type: "ai_request",
        tokens_used: aiResponse.usage?.total_tokens || 0,
        cost_usd: calculateCost(
          modelConfig.model,
          aiResponse.usage?.total_tokens || 0
        ),
        model_used: modelConfig.model,
        request_id: agentRequest.requestId,
        metadata: {
          agent_type: agentRequest.agentType,
          context_documents: agentRequest.contextDocuments?.length || 0,
          session_id: agentRequest.sessionId,
        },
      });

      // Update session if provided
      if (agentRequest.sessionId) {
        await updateSession(
          supabase,
          agentRequest.sessionId,
          agentRequest.requestId
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          requestId: agentRequest.requestId,
          status: "completed",
          results: processedResponse,
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          model: modelConfig.model,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (processingError) {
      // Update agent request status to failed
      await supabase
        .from("agent_requests")
        .update({
          status: "failed",
          error_message: processingError.message,
        })
        .eq("id", agentRequest.requestId);

      throw processingError;
    }
  } catch (error) {
    console.error("AI Agent execution error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper functions

async function checkUsageLimits(
  supabase: any,
  userId: string,
  plan: string
): Promise<boolean> {
  const { data: usageData } = await supabase
    .from("usage_events")
    .select("count")
    .eq("user_id", userId)
    .eq("event_type", "ai_request")
    .gte("created_at", new Date(new Date().setDate(1)).toISOString()); // This month

  const currentUsage = usageData?.length || 0;
  const limits = { free: 100, pro: 1000, enterprise: 10000 };

  return currentUsage < (limits[plan as keyof typeof limits] || 100);
}

async function updateProgress(
  supabase: any,
  requestId: string,
  progress: number
): Promise<void> {
  await supabase
    .from("agent_requests")
    .update({ progress })
    .eq("id", requestId);
}

async function buildContext(
  supabase: any,
  userId: string,
  contextDocuments?: string[]
): Promise<string> {
  if (!contextDocuments || contextDocuments.length === 0) {
    return "";
  }

  // Get relevant document chunks
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select(
      `
      content,
      section_title,
      documents!inner(
        user_id,
        filename
      )
    `
    )
    .in("document_id", contextDocuments)
    .eq("documents.user_id", userId)
    .order("chunk_index")
    .limit(20); // Limit to prevent token overflow

  if (!chunks || chunks.length === 0) {
    return "";
  }

  // Build context string
  let context = "Relevant context from your documents:\n\n";
  chunks.forEach((chunk: any) => {
    context += `### ${chunk.documents.filename}`;
    if (chunk.section_title) {
      context += ` - ${chunk.section_title}`;
    }
    context += `\n${chunk.content}\n\n`;
  });

  return context;
}

function selectModel(agentType: string, preferences?: any): AIModelConfig {
  const defaultConfigs = {
    create: {
      model: "gpt-4o",
      apiKey: Deno.env.get("OPENAI_API_KEY")!,
      endpoint: "https://api.openai.com/v1/chat/completions",
      maxTokens: 2000,
      temperature: 0.7,
    },
    edit: {
      model: "gpt-4o-mini",
      apiKey: Deno.env.get("OPENAI_API_KEY")!,
      endpoint: "https://api.openai.com/v1/chat/completions",
      maxTokens: 1500,
      temperature: 0.3,
    },
    research: {
      model: "claude-3-sonnet-20240229",
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
      endpoint: "https://api.anthropic.com/v1/messages",
      maxTokens: 3000,
      temperature: 0.1,
    },
  };

  const config =
    defaultConfigs[agentType as keyof typeof defaultConfigs] ||
    defaultConfigs.create;

  // Apply user preferences
  if (preferences) {
    config.model = preferences.model || config.model;
    config.temperature = preferences.temperature || config.temperature;
    config.maxTokens = preferences.maxTokens || config.maxTokens;
  }

  return config;
}

async function executeAIModel(
  config: AIModelConfig,
  request: AgentRequest,
  context: string
): Promise<any> {
  const systemPrompt = getSystemPrompt(request.agentType);
  const userMessage = context
    ? `${context}\n\nUser request: ${request.content}`
    : request.content;

  if (config.model.startsWith("claude")) {
    // Anthropic Claude API
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    return await response.json();
  } else {
    // OpenAI API
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    return await response.json();
  }
}

function getSystemPrompt(agentType: string): string {
  const prompts = {
    create:
      "You are a helpful AI assistant that helps users create high-quality documents, articles, and content. Be creative, structured, and provide well-organized output.",
    edit: "You are a professional editor that helps improve existing content. Focus on clarity, grammar, structure, and readability while maintaining the original intent.",
    research:
      "You are a research assistant that helps users analyze information, find insights, and synthesize knowledge from their documents. Be thorough, analytical, and cite sources when possible.",
  };

  return prompts[agentType as keyof typeof prompts] || prompts.create;
}

async function processAIResponse(
  response: any,
  agentType: string
): Promise<any> {
  // Extract content based on API response format
  let content = "";
  if (response.choices && response.choices[0]) {
    content = response.choices[0].message?.content || "";
  } else if (response.content && response.content[0]) {
    content = response.content[0].text || "";
  }

  return {
    content,
    agentType,
    processedAt: new Date().toISOString(),
    preview: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
    wordCount: content.split(/\s+/).length,
    status: "ready_for_review",
  };
}

function calculateCost(model: string, tokens: number): number {
  // Simplified cost calculation (USD per 1K tokens)
  const costs = {
    "gpt-4o": 0.03,
    "gpt-4o-mini": 0.0015,
    "claude-3-sonnet-20240229": 0.015,
  };

  const costPer1K = costs[model as keyof typeof costs] || 0.02;
  return (tokens / 1000) * costPer1K;
}

async function updateSession(
  supabase: any,
  sessionId: string,
  requestId: string
): Promise<void> {
  // Update session with new request
  const { data: session } = await supabase
    .from("agent_sessions")
    .select("request_chain")
    .eq("id", sessionId)
    .single();

  if (session) {
    const updatedChain = [...(session.request_chain || []), requestId];
    await supabase
      .from("agent_sessions")
      .update({
        request_chain: updatedChain,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }
}

/* To deploy this function, run:
 * supabase functions deploy execute-ai-agent --no-verify-jwt
 */
