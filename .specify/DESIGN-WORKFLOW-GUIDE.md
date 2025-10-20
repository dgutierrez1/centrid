# Design Workflow Quick Start Guide

This guide shows you how to use the enhanced SpecKit workflow to create high-fidelity, visually polished UI before implementation.

---

## Two-Layer Design Approach

### Layer 1: Global Design System (Do Once)

**When**: At project start or during design system overhaul

**Command**: `/speckit.design-system`

**What it does**:
- Asks you ~10 questions about visual personality, colors, typography, spacing
- Generates `.specify/design-system/` with:
  - `foundation.md` - Design tokens (colors, typography, spacing, shadows, etc.)
  - `components.md` - Component library specs (Button, Input, Card, etc.)
  - `tailwind.config.js` - Tailwind theme configuration
  - `components/` - React component starter code

**With Browser MCP**:
- Renders each component in isolation
- Screenshots all variants and states
- You iterate visually: "Make primary button darker", "Increase spacing"
- Repeats until you approve
- Locks design system as foundational truth

**Output**: Global design DNA that all features will use

---

### Layer 2: Feature-Specific Design (Do Per Feature)

**When**: After `/speckit.plan`, before `/speckit.tasks`

**Command**: `/speckit.design`

**What it does**:
- Reads your feature spec and plan
- Extracts screens, interactions, states needed
- Maps to design system components
- Generates `specs/[FEATURE]/design/` with:
  - `design.md` - Screen-by-screen visual specifications
  - `components/` - Feature-specific component code (using design system)
  - `screenshots/` - Visual previews (if Browser MCP available)
  - `checklists/design.md` - Design quality validation

**With Browser MCP**:
- Renders each screen (mobile + desktop)
- Screenshots all states (default, hover, focus, loading, error, empty)
- You iterate visually: "Space inputs more", "Error state too subtle"
- Repeats until you approve
- Locks design as approved

**Output**: High-fidelity visual design you can see and approve before a single line of implementation code is written

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ ONE-TIME SETUP (or when rebranding)                        │
└─────────────────────────────────────────────────────────────┘

/speckit.design-system
   ↓
Answer questions about visual personality, colors, typography
   ↓
[Browser MCP] See component library rendered
   ↓
Iterate: "Make buttons more rounded", "Darken primary color"
   ↓
Approve design system
   ↓
✅ Global design foundation locked

┌─────────────────────────────────────────────────────────────┐
│ PER FEATURE WORKFLOW                                        │
└─────────────────────────────────────────────────────────────┘

/speckit.specify
   ↓ (spec.md with user stories, UI/UX requirements section)

/speckit.plan
   ↓ (plan.md with architecture, tech stack)

/speckit.design ← VISUAL ITERATION HAPPENS HERE
   ↓
Claude generates:
   - Screen layouts (mobile + desktop)
   - Component code (using design system tokens)
   - All states (loading, error, empty, success)
   ↓
[Browser MCP] Renders screens, takes screenshots
   ↓
You see actual visual design:
   📸 Login Screen - Mobile
   📸 Login Screen - Desktop
   📸 Login Screen - Loading State
   📸 Login Screen - Error State
   ↓
You provide feedback:
   "Input spacing feels cramped"
   "Primary button too bright"
   "Error message hard to see"
   ↓
Claude updates design, regenerates code, re-screenshots
   ↓
You see changes, provide more feedback OR approve
   ↓
✅ Feature design approved and locked

/speckit.tasks
   ↓ (generates tasks to implement approved design)

/speckit.implement
   ↓ (builds feature matching approved design)
```

---

## What Makes This Powerful

### Without Browser MCP (Traditional):
```
You: "Add login screen"
Claude: [Writes code]
You: [Runs dev server, sees it]
You: "Hmm, doesn't look quite right..."
Claude: [Modifies code]
You: [Refreshes, sees it]
You: "Better but spacing is off..."
[Many rounds of iteration, lots of context switching]
```

### With Browser MCP (Visual-First):
```
You: "Add login screen"
Claude: [Generates design.md, code, screenshots]
Claude: "Here's what it will look like 📸"
You: "Spacing is off, button too bright"
Claude: [Updates design, new screenshots]
Claude: "Here's the updated version 📸"
You: "Perfect! Approved"
Claude: [Locks design]
[Implementation builds exactly what you approved]
```

**Key difference**: You see high-fidelity visual mockups BEFORE implementation begins. Iteration is faster (no manual dev server running), and implementation has a locked reference to match.

---

## Example: Real Workflow for Centrid Feature

### Scenario: "Add AI Agent Chat Interface"

#### Step 1: Specification
```
/speckit.specify "Add AI agent chat interface where users can have conversations with AI agents, view chat history, and manage context documents"
```

**Output**: `specs/004-ai-chat/spec.md` with:
- User stories (P1: Send/receive messages, P2: View history, P3: Manage context)
- UI/UX Requirements section:
  - Screens: Chat view, History sidebar, Context picker
  - Key elements: Message bubbles, input field, typing indicator
  - States: Loading (waiting for AI), error (AI failed), empty (no messages)
  - Mobile: Full-screen chat, slide-out history
  - Desktop: Split view (chat + history sidebar)

#### Step 2: Planning
```
/speckit.plan
```

**Output**: `specs/004-ai-chat/plan.md` with:
- Tech: React, Valtio state, Supabase real-time
- Architecture: Streaming responses, optimistic updates
- Components: ChatMessage, MessageInput, HistorySidebar

#### Step 3: Design (THE MAGIC STEP)
```
/speckit.design
```

**Claude analyzes**:
- "You need 3 main screens: Chat, History, Context Picker"
- "Chat needs message bubbles (user vs AI styling)"
- "Message input needs states: default, typing, sending, error"
- "AI messages need loading state (typing indicator)"
- "Empty state: 'Start a conversation'"

**Claude generates**:
1. `design/design.md`:
   ```markdown
   ## Screen 1: Chat View

   ### Mobile Layout
   ┌─────────────────────┐
   │ [Header] [Context] │ ← 64px height, design system
   ├─────────────────────┤
   │                     │
   │ [Message Bubbles]   │ ← Scrollable, padding: spacing.md
   │   User: Right       │
   │   AI: Left          │
   │                     │
   ├─────────────────────┤
   │ [Input] [Send]      │ ← 56px height, sticky bottom
   └─────────────────────┘

   ### Visual Specs
   - User message bubble:
     - Background: color.primary (from design system)
     - Text: color.white
     - Border radius: borderRadius.large (top-left, top-right, bottom-left)
     - Padding: spacing.md
     - Max width: 80% (mobile), 60% (desktop)
     - Alignment: flex-end (right side)

   - AI message bubble:
     - Background: color.gray.100
     - Text: color.gray.900
     - Border radius: borderRadius.large (top-left, top-right, bottom-right)
     - Padding: spacing.md
     - Max width: 80% (mobile), 60% (desktop)
     - Alignment: flex-start (left side)

   - Typing indicator (AI loading):
     - Component: Three bouncing dots
     - Color: color.gray.500
     - Animation: bounce, 1s infinite
     - Appears in AI message bubble

   - Message input:
     - Component: Input (multiline variant)
     - Placeholder: "Ask me anything..."
     - Min height: 40px
     - Max height: 120px (auto-expand)
     - Border: color.gray.300, focus: color.primary
   ```

2. `design/components/ChatView.tsx`:
   ```tsx
   import { Card, Input, Button } from '@/components/ui'; // Design system

   export const ChatView = () => {
     // Implementation using design system tokens
     return (
       <div className="flex flex-col h-screen">
         {/* Header */}
         <header className="h-16 bg-white border-b border-gray-300 px-md">
           {/* ... */}
         </header>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-md space-y-md">
           {messages.map(msg => (
             <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
               <div className={`
                 max-w-[80%] md:max-w-[60%] p-md rounded-large
                 ${msg.role === 'user'
                   ? 'bg-primary text-white rounded-br-none'
                   : 'bg-gray-100 text-gray-900 rounded-bl-none'
                 }
               `}>
                 {msg.content}
               </div>
             </div>
           ))}
         </div>

         {/* Input */}
         <div className="h-14 border-t border-gray-300 p-sm flex gap-sm">
           <Input
             multiline
             placeholder="Ask me anything..."
             className="flex-1"
           />
           <Button variant="primary">Send</Button>
         </div>
       </div>
     );
   };
   ```

**[Browser MCP activates]**:
- Starts dev server
- Navigates to `/design-preview/ai-chat/chat-view`
- Takes screenshots:
  - `chat-view-mobile-default.png` (375x812)
  - `chat-view-mobile-with-messages.png`
  - `chat-view-mobile-typing.png` (AI loading state)
  - `chat-view-desktop-default.png` (1440x900)
  - `chat-view-desktop-with-messages.png`

**Claude presents**:
```
📸 Chat View - Mobile
[Screenshot showing actual rendered component]

📸 Chat View - Desktop
[Screenshot showing split layout with sidebar]

📸 Typing Indicator (AI loading)
[Screenshot showing bouncing dots in AI bubble]

Visual design ready for review. Feedback?
```

**You respond**:
"The message bubbles feel too wide on mobile, and the AI bubble color is too light - hard to read. Also can we add more spacing between messages?"

**Claude updates**:
- `design.md`:
  - Max width: 80% → 70% (mobile)
  - AI background: color.gray.100 → color.gray.200
  - Message gap: spacing.md → spacing.lg
- Regenerates `ChatView.tsx`
- Re-screenshots (only chat views)

**Claude presents**:
```
📸 Updated Chat View - Mobile
[New screenshot with changes]

Changes applied:
✓ Message bubble max-width reduced to 70%
✓ AI bubble background darkened (gray.200)
✓ Message spacing increased (16px → 24px)

Feedback?
```

**You respond**: "Perfect! Approved"

**Claude locks design**:
- Marks `design/design.md` with `Status: Approved - 2024-01-18`
- Saves approved screenshots as reference
- Proceeds to next screen (History Sidebar)

#### Step 4: Tasks
```
/speckit.tasks
```

**Output**: `specs/004-ai-chat/tasks.md` with design-driven tasks:
```markdown
## Phase 3: UI Components - Chat Interface

- [ ] T015 [P] [US1] Create ChatBubble component per design/design.md (user + AI variants)
- [ ] T016 [P] [US1] Create TypingIndicator component per design/design.md
- [ ] T017 [P] [US1] Create MessageInput component (multiline, auto-expand)
- [ ] T018 [US1] Compose ChatView from components per design/design.md
- [ ] T019 [US1] Add responsive breakpoints (mobile → desktop split layout)
- [ ] T020 [US1] DESIGN REVIEW: Verify implementation matches design/screenshots/chat-view-mobile-default.png
```

Notice: Tasks reference approved design and screenshots!

#### Step 5: Implementation
```
/speckit.implement
```

**Output**:
- Builds `ChatBubble.tsx`, `TypingIndicator.tsx`, `MessageInput.tsx`
- Composes `ChatView.tsx`
- Adds responsive layout
- **Design review gate**: Compares implementation to `design/screenshots/chat-view-mobile-default.png`
- Validates: "Does this match the approved design?"

---

## Key Design Levers (from DESIGN-PRINCIPLES.md)

When iterating visually, focus on these 10 levers:

1. **Visual Hierarchy**: Is the primary action obvious?
2. **Consistency**: Do similar things look similar?
3. **Information Density**: Right amount of info for context?
4. **Color with Purpose**: Every color means something?
5. **Typography Hierarchy**: Scannable text structure?
6. **Spacing Rhythm**: Consistent, mathematical spacing?
7. **Feedback & Affordance**: Interactivity obvious?
8. **Mobile-First Responsive**: Designed for constraints first?
9. **Accessibility**: Works for everyone?
10. **Loading, Error, Empty States**: Gaps designed?

**During visual iteration, you can say**:
- "Visual hierarchy: Make submit button more prominent"
- "Consistency: Error messages should match design system error color"
- "Spacing: Feels cramped, increase gap between sections"
- "Typography: Heading feels too small compared to body text"
- "Accessibility: Focus state hard to see, needs stronger contrast"

Claude will update the relevant design tokens or feature design, regenerate code, and show you the visual change.

---

## Browser MCP Requirements

For full visual iteration workflow, Browser MCP needs:

**Capabilities**:
- Navigate to URL
- Set viewport size (for mobile/desktop screenshots)
- Wait for network idle
- Click, hover, focus elements (to capture states)
- Execute JavaScript (to trigger loading/error states programmatically)
- Take screenshot (full page, specific element, viewport)

**Example MCP config** (if using Playwright MCP):
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@automatalabs/mcp-server-playwright"],
    "env": {
      "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
    }
  }
}
```

**Fallback without MCP**:
- Design specs still generated (design.md, code)
- You manually run `npm run dev`
- You manually review in browser
- You provide text feedback
- Claude updates and regenerates
- Slower iteration but still works

---

## When to Run Each Command

| Command | When | What It Does | Output |
|---------|------|--------------|--------|
| `/speckit.design-system` | Project start, rebranding | Establish global visual foundation | `.specify/design-system/` |
| `/speckit.specify` | Starting new feature | Define requirements, user stories, UI needs | `specs/[N]/spec.md` |
| `/speckit.plan` | After spec approved | Technical approach, architecture | `specs/[N]/plan.md` |
| `/speckit.design` | After plan, before tasks | **HIGH-FIDELITY VISUAL DESIGN** | `specs/[N]/design/` + screenshots |
| `/speckit.tasks` | After design approved | Generate implementation tasks | `specs/[N]/tasks.md` |
| `/speckit.implement` | Ready to build | Execute tasks, build feature | Actual code in `src/` |

---

## Tips for Great Visual Design

### During Design System Setup:
- Provide reference URLs (apps you like visually)
- Be opinionated about personality (professional vs. playful)
- Start conservative (fewer colors, simpler), expand later
- Think about your users (enterprise? consumer? creative?)

### During Feature Design:
- Describe what feels wrong specifically: "too cramped", "too bright", "hard to read"
- Reference design levers: "visual hierarchy", "spacing rhythm", "accessibility"
- Compare to apps: "like Notion's empty state", "like Vercel's loading animation"
- Approve when it feels right, don't over-iterate

### General:
- Mobile-first: Design mobile first, desktop enhancements second
- Consistency > novelty: Use design system components, avoid one-offs
- Accessibility first: Check contrast, focus states, keyboard nav
- States matter: Don't forget loading, error, empty states

---

## Troubleshooting

**"Design feels inconsistent"**
→ Check if design system is being used (tokens vs. hard-coded values)
→ Run `/speckit.analyze` to find inconsistencies

**"Iteration is slow"**
→ Install Browser MCP for visual feedback
→ Without MCP: Provide more specific feedback in fewer rounds

**"Design doesn't match implementation"**
→ Tasks should have design review gates
→ Reference approved screenshots during implementation

**"Need to update global design system"**
→ Re-run `/speckit.design-system`
→ Bump version, update foundation.md
→ Existing features unaffected (they use locked tokens)

---

## Summary

**The workflow**: Design system (once) → Feature spec → Plan → **Visual design with iteration** → Tasks → Implementation

**The magic**: Browser MCP lets you see and approve high-fidelity UI before implementation

**The result**: Beautiful, consistent, accessible UI that matches your vision
