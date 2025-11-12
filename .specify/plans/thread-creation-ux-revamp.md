# Thread Creation UX Revamp - Phase 2 Plan

**Status**: Planning
**Created**: 2025-10-31
**Owner**: Product/Engineering
**Estimated Effort**: 4-6 hours

---

## Executive Summary

Replace modal-based thread creation with an **empty-state → type → create** flow. Users navigate to an empty thread, start typing, and the thread is created automatically with the first message. Removes friction, improves discoverability, and aligns with modern chat UX patterns.

---

## Problem Statement

### Current UX Issues
1. **Modal friction**: Users must click "New Thread", fill out a form with a title, then close modal before chatting
2. **Premature naming**: Forcing users to name a thread before knowing what they'll discuss creates cognitive overhead
3. **Placeholder confusion**: Threads sometimes display "Untitled Thread" or technical field names instead of meaningful titles
4. **Branching UX**: Branch creation uses same modal pattern, doesn't leverage parent conversation context

### User Pain Points
- "I don't know what to call this thread yet"
- "Why do I have to name it before I start?"
- "Where did my thread go after I renamed it?"

---

## Current Flow Analysis

### Thread Creation (Root)
```
User clicks "New Thread"
  → Modal opens with title input
  → User enters title
  → Click "Create"
  → Modal closes
  → Navigate to /workspace/{id}
  → Empty thread loads
  → User starts typing
```

**Problems**: 4 clicks, cognitive overhead, interrupts flow

### Branch Creation
```
User clicks branch icon on parent thread
  → Modal opens with parent context
  → User enters title
  → Click "Create"
  → Modal closes
  → Navigate to /workspace/{branchId}
  → Empty thread loads
  → User starts typing
```

**Problems**: Same as root + missed opportunity to suggest branch topics

---

## Proposed New Flow

### New Thread Creation (Root)
```
User clicks "New Thread"
  → Navigate to /workspace (no ID)
  → Show empty state: "Start a conversation..."
  → User types first message
  → On send: Create thread with auto-generated title
  → Navigate to /workspace/{id}
  → Message appears in thread
```

**Benefits**: 1 click to start, no cognitive overhead, natural chat flow

### Branch Creation
```
User clicks branch icon on thread {parentId}
  → Navigate to /workspace?parent={parentId} (no thread ID yet)
  → Show empty state: "Branching from: {parentTitle}"
  → Optional: Show 3-5 AI-suggested branch topics as chips
  → User types message (or clicks suggestion)
  → On send: Create branch with parentId link + auto-title
  → Navigate to /workspace/{branchId}
  → Message appears in new branch
```

**Benefits**: Natural branching flow, contextual suggestions, less friction

---

## Technical Design

### 1. Routing Changes

**New Routes**:
- `/workspace` - Empty state (no thread)
- `/workspace?parent={id}` - Branch empty state (parent context)
- `/workspace/{id}` - Active thread (existing)

**Route Behavior**:
```typescript
// pages/workspace/index.tsx
export default function WorkspacePage() {
  const router = useRouter();
  const parentId = router.query.parent as string | undefined;

  return <WorkspaceContainer parentId={parentId} threadId={undefined} />;
}

// pages/workspace/[docId].tsx (unchanged)
export default function WorkspaceDetailPage() {
  const router = useRouter();
  const threadId = router.query.docId as string;

  return <WorkspaceContainer threadId={threadId} />;
}
```

### 2. Empty State Detection

**WorkspaceContainer Logic**:
```typescript
const isEmpty = !threadId; // No thread ID = empty state
const isBranching = isEmpty && !!parentId; // Has parent = branching

if (isEmpty && !isBranching) {
  // Show root empty state
} else if (isBranching) {
  // Show branch empty state with parent context
} else {
  // Show active thread (existing behavior)
}
```

### 3. Auto-Title Generation

**Option A: First N characters** (Simple, fast)
```typescript
// When creating thread on first message
const autoTitle = messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '');
```

**Option B: AI-generated title** (Better, slower)
```typescript
// Backend: POST /threads with first message
async function createThreadWithMessage(userId, message, parentId?) {
  // 1. Create thread with temp title
  const thread = await createThread(userId, 'Generating title...', parentId);

  // 2. Create first message
  await createMessage(thread.id, message);

  // 3. Generate concise title with AI (async, non-blocking)
  const title = await generateThreadTitle(message); // GPT-4o-mini, 10 tokens

  // 4. Update thread title
  await updateThread(thread.id, { title });

  return thread;
}
```

**Recommendation**: Start with **Option A**, upgrade to **Option B** later if needed.

### 4. Component Changes

**ThreadView Empty State**:
```tsx
// packages/ui/src/features/ai-agent-system/ThreadView.tsx
function ThreadView({ isEmpty, isBranching, parentTitle, ... }) {
  if (isEmpty) {
    return (
      <EmptyThreadState
        isBranching={isBranching}
        parentTitle={parentTitle}
        onSuggestedTopicClick={onSuggestedTopicClick} // Optional Phase 3
      />
    );
  }

  // Existing message list UI
  return <MessageList messages={messages} ... />;
}
```

**EmptyThreadState Component** (NEW):
```tsx
// packages/ui/src/features/ai-agent-system/EmptyThreadState.tsx
interface EmptyThreadStateProps {
  isBranching: boolean;
  parentTitle?: string;
  suggestedTopics?: string[]; // Phase 3
  onSuggestedTopicClick?: (topic: string) => void;
}

export function EmptyThreadState({
  isBranching,
  parentTitle,
  suggestedTopics,
  onSuggestedTopicClick,
}: EmptyThreadStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {isBranching && parentTitle && (
        <div className="mb-4 text-sm text-gray-500">
          Branching from: <span className="font-medium">{parentTitle}</span>
        </div>
      )}

      <div className="text-2xl mb-2">💬</div>
      <h2 className="text-xl font-semibold mb-2">
        {isBranching ? 'Start a new branch' : 'Start a conversation'}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        Type your first message below to create a new {isBranching ? 'branch' : 'thread'}
      </p>

      {/* Phase 3: Suggested Topics */}
      {suggestedTopics && suggestedTopics.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Suggested topics:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map(topic => (
              <button
                key={topic}
                onClick={() => onSuggestedTopicClick?.(topic)}
                className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. Message Send Logic Update

**useSendMessage Hook**:
```typescript
// apps/web/src/lib/hooks/useSendMessage.ts
export function useSendMessage(threadId: string | undefined, parentId?: string) {
  const sendMessage = async (content: string) => {
    let actualThreadId = threadId;

    // If no thread ID, create thread first
    if (!actualThreadId) {
      const newThread = await createThreadWithFirstMessage(content, parentId);
      actualThreadId = newThread.id;

      // Navigate to new thread
      router.push(`/workspace/${actualThreadId}`);

      // State updates handled by useLoadThread via navigation
      return;
    }

    // Existing message send logic
    // ...
  };

  return { sendMessage, ... };
}
```

**New Backend Endpoint**:
```typescript
// apps/api/src/functions/api/routes/threads.ts
/**
 * POST /api/threads/create-with-message
 * Atomic: Create thread + first message in one transaction
 */
app.post('/create-with-message', async (c) => {
  const { message, parentId } = await c.req.json();
  const userId = c.get('userId');

  // Auto-generate title from message
  const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');

  // Transaction: create thread + message
  const thread = await ThreadService.createThreadWithMessage({
    userId,
    title,
    message,
    parentId,
  });

  return c.json({ data: thread }, 201);
});
```

### 6. Cleanup: Remove Modal

**Files to DELETE**:
- `apps/web/src/components/ai-agent/CreateBranchModalContainer.tsx`
- `packages/ui/src/features/ai-agent-system/CreateBranchModal.tsx`

**Files to UPDATE** (remove modal references):
- `apps/web/src/components/ai-agent/WorkspaceContainer.tsx`
  - Remove `isCreateModalOpen` state
  - Remove `handleCreateThread` (navigate to `/workspace` instead)
  - Remove `handleThreadCreateBranch` (navigate to `/workspace?parent={id}` instead)

---

## Phase 3: AI Branch Suggestions (Optional)

### Feature Description
When branching, show 3-5 AI-generated topic suggestions based on parent conversation.

### Implementation
```typescript
// New service: apps/api/src/services/branchSuggestionService.ts
export async function generateBranchSuggestions(threadId: string): Promise<string[]> {
  // 1. Load thread messages
  const messages = await MessageRepository.findByThreadId(threadId);

  // 2. Call AI to suggest branch topics
  const prompt = `Based on this conversation, suggest 3-5 interesting topics to branch into:

  ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

  Return as JSON array: ["Topic 1", "Topic 2", ...]`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(response.content[0].text);
}

// New endpoint: apps/api/src/functions/api/routes/threads.ts
app.get('/:id/branch-suggestions', async (c) => {
  const threadId = c.params.id;
  const suggestions = await BranchSuggestionService.generate(threadId);
  return c.json({ data: suggestions });
});
```

**Frontend Hook**:
```typescript
// apps/web/src/lib/hooks/useBranchSuggestions.ts
export function useBranchSuggestions(parentId: string | undefined) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!parentId) return;

    api.get(`/threads/${parentId}/branch-suggestions`)
      .then(response => setSuggestions(response.data))
      .catch(err => console.error('Failed to load suggestions:', err));
  }, [parentId]);

  return { suggestions };
}
```

---

## Migration Strategy

### Backward Compatibility
- Existing threads unchanged
- Old modal flow removed (breaking change, but no data impact)
- Users must adapt to new flow (minimal training)

### Rollout Plan
1. **Phase 1**: Bug fixes (DONE)
2. **Phase 2**: Deploy new UX flow
3. **Monitor**: Track thread creation metrics (success rate, time-to-first-message)
4. **Phase 3**: Add branch suggestions if metrics show high branching engagement

---

## Acceptance Criteria

### Phase 2 (Core UX)
- [ ] User can navigate to `/workspace` and see empty state
- [ ] User can type message and create thread without modal
- [ ] Thread title auto-generated from first message (max 50 chars)
- [ ] User can click branch icon and navigate to empty branch state
- [ ] Branch state shows parent context ("Branching from: X")
- [ ] First message in branch creates child thread with `parentId` link
- [ ] Nested threads display correctly in sidebar tree
- [ ] Renamed threads persist and don't disappear
- [ ] Deleted threads removed from sidebar immediately

### Phase 3 (Branch Suggestions)
- [ ] Branching shows 3-5 AI-suggested topics
- [ ] Clicking suggestion pre-fills first message
- [ ] Suggestions load within 2 seconds
- [ ] Fallback to empty state if suggestions fail

---

## Edge Cases & Error Handling

### 1. User navigates away before sending
- **Behavior**: No thread created, no orphaned data
- **UX**: Next visit to `/workspace` shows fresh empty state

### 2. Network error during thread creation
- **Behavior**: Show error toast, keep message in input field
- **UX**: User can retry send

### 3. Slow AI title generation (Phase 3)
- **Behavior**: Show thread with temp title "Generating...", update when ready
- **UX**: Non-blocking, optimistic UI

### 4. Parent thread deleted while branching
- **Behavior**: API rejects branch creation (404)
- **UX**: Show error: "Parent thread not found. Creating root thread instead."

### 5. Multiple tabs creating thread simultaneously
- **Behavior**: Each tab creates separate thread (idempotency not required)
- **UX**: Acceptable (user intent is ambiguous anyway)

---

## Performance Considerations

### Auto-Title Generation
- **Option A** (first 50 chars): 0ms overhead
- **Option B** (AI-generated): ~500-1000ms, but non-blocking

### Branch Suggestions (Phase 3)
- Load async, don't block empty state render
- Cache for 5 minutes per parent thread
- Timeout after 5 seconds, fallback to no suggestions

---

## Metrics to Track

### Before/After Comparison
- **Time to first message** (should decrease)
- **Thread creation success rate** (should increase)
- **Thread rename rate** (may decrease if auto-titles are good)
- **Branch creation rate** (may increase if friction reduced)

### New Metrics
- **Empty state abandonment** (navigate away before sending)
- **Suggestion click-through rate** (Phase 3)
- **Auto-title acceptance** (threads not renamed within 24h)

---

## Future Enhancements

### Post-Phase 3
1. **Smart title updates**: Re-generate title after 5+ messages if initial auto-title was truncated
2. **Thread templates**: Pre-defined empty states ("Research", "Brainstorm", "Debug") with starter prompts
3. **Continuation suggestions**: "Continue this thread by asking about..."
4. **Branch previews**: Hover branch icon to see suggested topics before clicking

---

## Questions for Product Review

1. **Auto-title length**: 50 chars too short/long? Should we use AI titles from day 1?
2. **Branch suggestions**: Phase 3 priority? High value or "nice to have"?
3. **Empty state copy**: Current wording feel right, or too technical?
4. **Metrics threshold**: What success rate signals we can move to Phase 3?

---

## Implementation Checklist

### Backend
- [ ] `POST /api/threads/create-with-message` endpoint
- [ ] Auto-title generation logic (first 50 chars)
- [ ] Transaction: create thread + first message atomically
- [ ] `GET /api/threads/:id/branch-suggestions` (Phase 3)

### Frontend - Routing
- [ ] Update `/workspace/index.tsx` to accept `?parent` query param
- [ ] Pass `parentId` to WorkspaceContainer

### Frontend - Components
- [ ] Create `EmptyThreadState.tsx` component
- [ ] Update `ThreadView.tsx` to render empty state
- [ ] Update `WorkspaceContainer.tsx`:
  - [ ] Remove modal state
  - [ ] Update click handlers to navigate instead of opening modal
  - [ ] Pass `isEmpty`, `isBranching`, `parentTitle` to ThreadView

### Frontend - Hooks
- [ ] Update `useSendMessage` to handle empty state (create thread on first send)
- [ ] Create `useBranchSuggestions` hook (Phase 3)

### Frontend - State
- [ ] Ensure `useLoadThread(undefined)` handles empty state gracefully

### Cleanup
- [ ] Delete `CreateBranchModalContainer.tsx`
- [ ] Delete `CreateBranchModal.tsx`
- [ ] Remove modal imports from WorkspaceContainer

### Testing
- [ ] Empty state renders correctly (`/workspace`)
- [ ] Branch empty state shows parent context (`/workspace?parent=123`)
- [ ] First message creates thread with auto-title
- [ ] First branch message creates child thread with `parentId`
- [ ] Navigation works after thread creation
- [ ] Error handling (network failure, parent not found)

---

## Timeline Estimate

### Phase 2 (Core UX)
- **Backend**: 1-2 hours (endpoint + auto-title)
- **Frontend - Routing**: 30 min
- **Frontend - Components**: 1-2 hours (EmptyThreadState + ThreadView updates)
- **Frontend - Hooks**: 1 hour (useSendMessage update)
- **Cleanup**: 30 min (delete modal files)
- **Testing**: 1 hour (manual + edge cases)

**Total**: 5-7 hours

### Phase 3 (Branch Suggestions)
- **Backend**: 2 hours (AI service + endpoint)
- **Frontend**: 1-2 hours (hook + UI chips)
- **Testing**: 1 hour

**Total**: 4-5 hours

---

## Risk Assessment

### Low Risk
- Auto-title generation (simple string slice, no AI)
- Empty state UI (pure presentation)
- Navigation changes (Next.js routing)

### Medium Risk
- First message → thread creation flow (new state machine)
- Branch context passing via URL query params (state management)

### High Risk (Phase 3)
- AI-generated branch suggestions (external API, latency, cost)

### Mitigation
- Thorough testing of empty state edge cases
- Feature flag for Phase 3 (enable for beta users first)
- Fallback: if AI fails, show empty state without suggestions

---

## Success Criteria

**Phase 2 ships successfully if**:
1. Users can create threads by typing (no modal)
2. Zero regressions in existing thread/branch functionality
3. Thread tree bugs (rename, nesting) remain fixed
4. Empty state loads in <100ms

**Phase 3 ships successfully if**:
1. Branch suggestions appear in <2s
2. Click-through rate >30% (users find suggestions helpful)
3. Zero suggestion-related errors in production

---

**Last Updated**: 2025-10-31
**Next Review**: After Phase 2 implementation