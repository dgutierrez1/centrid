---
title: Service-Oriented Execution Pattern
summary: Break complex execution logic into focused service classes with single responsibilities
---

<!-- After editing this file, run: npm run sync-docs -->

# Service-Oriented Execution Pattern

**What**: Decompose complex execution workflows into orchestrated service classes, each handling a single concern (message lifecycle, conversation loading, tool execution, iteration logic).

**Why**: Large execution methods (600+ lines) with nested conditionals become unmaintainable - hard to read, test, debug, and extend. Service orchestration separates concerns and enables clean composition.

**How**:

```typescript
// Before: 600-line method with everything mixed together
static async *executeWithStreaming() {
  // Message creation logic mixed with...
  // Conversation building mixed with...
  // Tool handling mixed with...
  // Claude API calls mixed with...
  // Loop control mixed with...
}

// After: Clean orchestration of focused services
static async *executeWithStreaming() {
  const messageOrchestrator = new MessageOrchestrator();
  const conversationLoader = new ConversationLoader();
  const toolHandler = new ToolExecutionHandler();
  const loop = new ExecutionLoop();

  const responseMessage = await messageOrchestrator.getOrCreateResponseMessage();
  const state = await conversationLoader.loadConversation();

  while (loop.shouldContinue(state)) {
    const result = yield* loop.runIteration(state, config);

    if (result.toolCalls.length > 0) {
      const toolResult = await toolHandler.handleToolCall();
      // Handle tool result and continue/pause
    }
  }
}
```

**Rules**:
- ✅ DO: Create separate service classes for distinct concerns (message lifecycle, state loading, tool execution, iteration)
- ✅ DO: Keep main orchestration method under 250 lines with clear flow
- ✅ DO: Keep individual service methods under 50 lines
- ✅ DO: Use descriptive service names that reflect their single responsibility
- ❌ DON'T: Mix concerns in a single service (e.g., message creation + tool execution)
- ❌ DON'T: Create services with more than 5-7 public methods
- ❌ DON'T: Share mutable state between services - pass data explicitly

**Used in**:
- `apps/api/src/services/agentExecution.ts` - Main orchestration (refactored from 600+ to 240 lines)
- `apps/api/src/services/messageOrchestrator.ts` - Message lifecycle management (idempotent create/update)
- `apps/api/src/services/conversationLoader.ts` - State reconstruction from database (resume detection)
- `apps/api/src/services/toolExecutionHandler.ts` - Tool execution with approval workflow
- `apps/api/src/services/executionLoop.ts` - Clean iteration logic with Claude API
