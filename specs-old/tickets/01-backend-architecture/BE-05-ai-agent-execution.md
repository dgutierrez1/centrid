# BE-05: AI Agent Execution Edge Function

**Status**: `pending`  
**Estimate**: 6 hours  
**Priority**: Critical  
**Dependencies**: BE-02, BE-03

## Description

Implement Edge Function to execute AI agents (Create, Edit, Research) using Claude Sonnet with context from full-text search results.

## Tasks

- [ ] Set up Anthropic API integration
- [ ] Implement agent routing logic
- [ ] Build context from search results
- [ ] Create system prompts for each agent
- [ ] Handle streaming responses
- [ ] Store results in database
- [ ] Track token usage
- [ ] Error handling and retries

## Tech Spec

### Agent Execution

```typescript
// supabase/functions/execute-ai-agent/index.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

async function executeAgent(request: AgentRequest) {
  // 1. Search for relevant documents
  const { data: searchResults } = await supabase.rpc("search_documents", {
    user_id_param: request.userId,
    query_text: request.content,
    result_limit: 5,
  });

  // 2. Build context
  const context = searchResults
    .map((doc) => `[${doc.filename}]\n${doc.content_text}`)
    .join("\n\n");

  // 3. Execute with Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: getSystemPrompt(request.agentType),
    messages: [
      {
        role: "user",
        content: `Context:\n${context}\n\nRequest: ${request.content}`,
      },
    ],
  });

  // 4. Store result
  await supabase
    .from("agent_requests")
    .update({
      status: "completed",
      result: response.content[0].text,
      tokens_used: response.usage.total_tokens,
    })
    .eq("id", request.id);

  return response.content[0].text;
}

function getSystemPrompt(agentType: string): string {
  const prompts = {
    create: "You are a content creation agent...",
    edit: "You are a content editing agent...",
    research: "You are a research agent...",
  };
  return prompts[agentType];
}
```

## Acceptance Criteria

- [ ] Claude API integration working
- [ ] All 3 agent types functional
- [ ] Context properly retrieved from search
- [ ] Results stored in database
- [ ] Token usage tracked accurately
- [ ] Errors handled with retries
- [ ] Response time <10 seconds

## Notes

- Use Claude Sonnet (claude-sonnet-4-20250514)
- Limit context to ~6000 tokens
- Implement exponential backoff for retries
- Monitor API costs

