# AI-Powered Exploration Workspace - Design Specification

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Status**: Complete
**Prerequisites**: spec.md, ux.md, arch.md

---

## Overview

This document captures the visual design implementation of the AI Agent System feature. For detailed UX flows, component specifications, and interaction patterns, **see [ux.md](./ux.md)** (2000+ lines of detailed specifications).

**Design Approach**:
- **Reference-based documentation**: This design.md references ux.md for component specs to avoid duplication
- **Visual validation**: Screenshots demonstrate all states and layouts specified in ux.md
- **Design system integration**: Documents which design tokens (colors, spacing, typography) were used
- **Implementation mapping**: Maps components to actual file locations in `packages/ui`

---

## Component Architecture

### Reusability Assessment

All components created in `packages/ui/src/features/ai-agent-system/` (feature-specific):

| Component | File Location | Reusability Rationale |
|-----------|--------------|----------------------|
| `WorkspaceSidebar` | `packages/ui/src/features/ai-agent-system/WorkspaceSidebar.tsx` | Feature-specific 3-panel workspace navigation |
| `FileEditorPanel` | `packages/ui/src/features/ai-agent-system/FileEditorWithProvenance.tsx` | Wrapper with provenance header (uses existing MarkdownEditor) |
| `ThreadView` | `packages/ui/src/features/ai-agent-system/ChatView.tsx` | Feature-specific thread interface composition |
| `BranchSelector` | `packages/ui/src/features/ai-agent-system/BranchSelector.tsx` | Feature-specific hierarchical branch tree |
| `ContextPanel` | `packages/ui/src/features/ai-agent-system/ContextPanel.tsx` | Feature-specific multi-section context display with horizontal widgets |
| `MessageStream` | `packages/ui/src/features/ai-agent-system/ChatView.tsx` | Feature-specific message rendering with streaming |
| `ThreadInput` | `packages/ui/src/features/ai-agent-system/ChatView.tsx` | Feature-specific input with @-mention + send/stop toggle |
| `ToolCallApproval` | `packages/ui/src/features/ai-agent-system/ApprovalCard.tsx` | Feature-specific approval flow for filesystem/thread operations |
| `ContextWidgets` | `packages/ui/src/features/ai-agent-system/ContextWidgets.tsx` | Horizontal widget bar with tooltips |

**Existing Components Reused**:
- `MarkdownEditor` (from `packages/ui/src/components/`) - Used in FileEditorPanel wrapper
- `Button`, `Badge`, `Input`, `Card`, `Tooltip`, `Modal` - UI primitives

**Export Structure**:
- All components exported from `packages/ui/src/features/ai-agent-system/index.ts`
- Feature exported from `packages/ui/src/features/index.ts`

---

## Screens Designed

### 1. Workspace (3-Panel Adaptive Layout)

**Purpose**: Primary exploration interface with adaptive 3-panel layout prioritizing thread interface (center), with closeable file editor (right).

**Route**: `/workspace` (or integrated into main thread interface)

**Layout**: Adaptive 3-panel
- **Left sidebar**: 20% width, Files/Threads tabs
- **Center panel**: 50-80% width (adapts based on file editor state), thread interface ALWAYS visible
- **Right panel**: 0-30% width (only appears when file opened, closeable with X button)

**Screenshots**:
- Desktop (1440×900): `apps/design-system/public/screenshots/ai-agent-system/workspace-desktop.png`

**Component Composition**:
- `WorkspaceSidebar` (left panel)
- `ThreadView` (center panel - contains BranchSelector, MessageStream, ContextPanel, ThreadInput)
- `FileEditorPanel` (right panel - closeable)

**States Shown**:
- File open (3-panel layout: 20% + 50% + 30%)
- Thread interface always visible in center
- File editor on right with close button

**UX Specification Reference**: See [ux.md lines 487-606](./ux.md) for complete layout diagrams and panel behavior

---

### 2. Context Panel (Section-Level Collapse with Horizontal Widgets)

**Purpose**: Display context assembled for agent requests, organized by priority tier with section-level collapse and horizontal widget layout.

**Route**: Component within thread interface (appears above input)

**Key Design Decision**: Sections collapse/expand as units (not individual items), widgets display horizontally:
- **Collapsed**: Compact inline widgets in a row, custom tooltips on hover
- **Expanded**: Detailed cards displayed horizontally, action buttons visible

**Screenshots**:
- Desktop (1440×900): `apps/design-system/public/screenshots/ai-agent-system/context-panel-desktop.png`
- Mobile (375×812): `apps/design-system/public/screenshots/ai-agent-system/context-panel-mobile.png`

**Component Used**: `ContextPanel` with props:
```typescript
{
  explicitContext: ContextItem[];
  frequentlyUsed: ContextItem[];
  semanticMatches: ContextItem[];
  branchContext: ContextItem[];
  artifacts: ContextItem[];
  excludedContext: ContextItem[];
  expandedSections: string[]; // ['explicit', 'semantic']
  onToggleSection: (sectionId: string) => void;
}
```

**States Shown**:
- Sections expanded (▼ icon) - widgets display as detailed horizontal cards
- Sections collapsed (▶ icon) - widgets display as compact inline buttons with tooltips
- Priority tier colors on left border (coral, blue, purple, orange, green, gray)

**UX Specification Reference**: See [ux.md lines 1151-1284](./ux.md) for complete ContextPanel spec and [ux.md lines 1210-1256](./ux.md) for section collapse behavior

---

### 3. Branch Selector (Hierarchical Tree Dropdown)

**Purpose**: Navigate between conversation branches, showing parent-child relationships with metadata.

**Route**: Component in thread header

**Screenshots**:
- Desktop (1440×900): `apps/design-system/public/screenshots/ai-agent-system/branch-selector-desktop.png`

**Component Used**: `BranchSelector`

**States Shown**:
- Closed (button shows current branch title)
- Hierarchical tree with indentation
- Metadata badges (message count, artifact count)
- Current branch highlighted

**UX Specification Reference**: See [ux.md lines 1078-1148](./ux.md) for BranchSelector spec

---

### 4. File Editor with Provenance

**Purpose**: View/edit files with provenance header showing source conversation context.

**Route**: Right panel in workspace (opens when file clicked)

**Screenshots**:
- Desktop (1440×900): `apps/design-system/public/screenshots/ai-agent-system/file-editor-desktop.png`

**Component Used**: `FileEditorPanel` (wrapper around existing `MarkdownEditor`)

**States Shown**:
- AI-generated file with full provenance header
- Manual file with "Manual" badge only
- Provenance details: source branch, creation context, last edit info
- "Go to source" button

**UX Specification Reference**: See [ux.md lines 880-966](./ux.md) for FileEditorPanel spec

---

## Design Tokens Used

### Colors (from Coral Theme)

**Primary Colors** (Coral accent):
- `bg-primary-50` - Lightest coral backgrounds (#fff5f5)
- `bg-primary-500` - Primary coral (#ff4d4d)
- `bg-primary-600` - Primary coral hover (#ff3030)
- `border-l-primary-500` - Left border accent (tier 1 priority)
- `text-primary-600` - Coral text accents

**Priority Tier Colors** (Context Panel left borders):
- Tier 1 (Explicit): `border-l-primary-500` (coral)
- Tier 2 (Frequently Used): `border-l-blue-500`
- Tier 3 (Semantic Matches): `border-l-purple-500`
- Tier 4 (Branch Context): `border-l-orange-500`
- Tier 5 (Artifacts): `border-l-green-500`
- Tier 6 (Excluded): `border-l-gray-400`

**Semantic Colors**:
- Success: `text-success-500` (#34c759), `bg-success-50`
- Warning: `text-warning-500` (#ff9f0a), `bg-warning-50`
- Error: `text-error-500` (#ff3b30), `bg-error-50`

**Neutral Colors**:
- `bg-gray-50` - Light backgrounds
- `bg-gray-100` - Hover states
- `bg-gray-800` - Dark mode backgrounds
- `text-gray-700` - Primary text
- `text-gray-500` - Secondary text
- `border-gray-200` - Borders (light mode)
- `border-gray-700` - Borders (dark mode)

### Typography (from Tailwind Preset)

**Font Sizes**:
- `text-4xl` - 36px (2.25rem) - Page headers
- `text-2xl` - 24px (1.5rem) - Section headers
- `text-xl` - 20px (1.25rem) - Card headers
- `text-base` - 16px (1rem) - Body text
- `text-sm` - 14px (0.875rem) - Secondary text
- `text-xs` - 12px (0.75rem) - Labels, metadata

**Font Weights**:
- `font-semibold` (600) - Headers, emphasized text
- `font-medium` (500) - Buttons, labels
- `font-normal` (400) - Body text

**Line Heights**:
- `leading-tight` (1.25) - Headers
- `leading-normal` (1.5) - Body text
- `leading-relaxed` (1.625) - Long-form content

### Spacing (8px Grid System)

**Component Spacing**:
- `gap-2` (8px) - Tight spacing (horizontal widgets within section)
- `gap-3` (12px) - Mobile message gaps
- `gap-4` (16px) - Desktop message gaps
- `gap-6` (24px) - Section gaps in context panel

**Padding**:
- `p-2` (8px) - Compact elements (collapsed widgets)
- `p-3` (12px) - Standard buttons, inputs
- `p-4` (16px) - Mobile input padding
- `p-6` (24px) - Desktop input padding, context panel sections

**Margins**:
- `mb-2` (8px) - Small vertical spacing
- `mb-4` (16px) - Standard vertical spacing
- `mb-6` (24px) - Mobile section margins
- `mb-8` (32px) - Desktop section margins

**Border Radius**:
- `rounded` (4px) - Small elements (badges, pills)
- `rounded-md` (6px) - Cards, buttons
- `rounded-lg` (8px) - Modals, panels

### Shadows

- `shadow-sm` - Subtle elevation (cards)
- `shadow-md` - Medium elevation (dropdowns)
- `shadow-lg` - High elevation (modals)

---

## Design Principles Verification

✅ **Visual Hierarchy**: Primary actions prominent (Send button coral, approval buttons color-coded), section headers clear
✅ **Consistency**: Design tokens used throughout, no arbitrary values
✅ **Information Density**: Appropriate for data-dense exploration tool (collapsed widgets when not in focus, expanded for detail)
✅ **Color with Purpose**: Semantic colors (success/error/warning), priority tier colors, coral accent for primary actions
✅ **Typography Hierarchy**: Clear hierarchy (4xl headers → xs metadata), scannable structure
✅ **Spacing Rhythm**: 8px grid system maintained, consistent gaps (2/4/6/8)
✅ **Feedback & Affordance**: All interactive elements have hover states, tooltips on collapsed widgets, loading states
✅ **Mobile-First Responsive**: Layouts intentional at all breakpoints (375px → 1440px+)
✅ **Accessibility**: ARIA labels specified in ux.md for all components, keyboard navigation support
✅ **States Coverage**: Loading, error, empty, success states designed (see ux.md component specs)

---

## Implementation Notes

### Component Pattern (Data-in, Callbacks-out)

All presentational components follow the pattern:

```typescript
interface ComponentProps {
  // Data (read-only, passed from container)
  data: DataType;

  // UI state (ephemeral, local to component)
  isLoading?: boolean;

  // Callbacks (actions bubble up to container)
  onAction: (id: string) => void;
}
```

**Example** (ContextPanel):
```typescript
<ContextPanel
  explicitContext={contextData.explicit}  // Data in
  expandedSections={['explicit']}        // UI state
  onToggleSection={handleToggle}         // Callback out
/>
```

### Import Paths

**From other packages**:
```typescript
import { ContextPanel, BranchSelector } from '@centrid/ui/features';
import { Button, Badge, Card } from '@centrid/ui/components';
import { cn } from '@centrid/shared/utils';
```

**Container usage** (in `apps/web`):
```typescript
import { ContextPanel } from '@centrid/ui/features';
import { appState } from '@/lib/state'; // Valtio global state

function ThreadContainer() {
  const { primeContext } = useSnapshot(appState);

  return (
    <ContextPanel
      explicitContext={primeContext.explicit}
      onToggleSection={(id) => {
        // Update global state
        appState.expandedSections.toggle(id);
      }}
    />
  );
}
```

### Key Principles

1. **No data fetching in presenters** - All data passed via props
2. **No API clients in presenters** - Callbacks only
3. **No auth logic in presenters** - Handled by containers
4. **Component UI state is local** - Dropdown open/closed, scroll position (ephemeral)
5. **Global state in Valtio** - Messages, context, thread data (persisted/synced)

---

## Screen-to-Component Mapping (for /speckit.tasks)

| Screen | Container Location | Presenters Used | State Source |
|--------|-------------------|-----------------|--------------|
| Workspace (3-panel) | `apps/web/src/components/workspace/` | `WorkspaceSidebar`, `ThreadView`, `FileEditorPanel` | Valtio (threads, files, context) |
| Thread Interface | Part of Workspace center panel | `BranchSelector`, `MessageStream`, `ContextPanel`, `ThreadInput` | Valtio (messages, streaming buffer) |
| Context Panel | Component in Thread Interface | `ContextPanel`, `ContextWidgets` | Valtio (prime context) |
| Branch Selector | Component in Thread Header | `BranchSelector` | Valtio (branch tree) |
| File Editor | Right panel in Workspace | `FileEditorPanel` (wraps `MarkdownEditor`) | Valtio (file content, provenance) |

---

## Validation Checklist

✅ **UX Coverage**: All components from ux.md created in packages/ui
✅ **Component Locations**: All in `packages/ui/src/features/ai-agent-system/`
✅ **Exports**: All exported from `packages/ui/src/features/index.ts`
✅ **Screenshots**: Desktop (1440×900) + Mobile (375×812) for key screens
✅ **Design Tokens**: Documented which colors, typography, spacing used
✅ **Reusability**: Categorization table complete (all feature-specific)
✅ **Component Patterns**: All follow data-in/callbacks-out pattern
✅ **Design Principles**: All 10 levers verified

---

## Ready for Implementation

**Status**: ✅ Design Complete

**Next Steps**:
1. Run `/speckit.tasks` to generate implementation task list
2. Implement containers in `apps/web/src/components/` that use these presenters
3. Wire up Valtio state management
4. Connect to Supabase Edge Functions for data flow

**Design Artifacts Available**:
- ✅ Component specifications (see ux.md)
- ✅ Visual designs (screenshots in `apps/design-system/public/screenshots/`)
- ✅ Design tokens documented (colors, spacing, typography)
- ✅ Component locations mapped (for import statements)
- ✅ Props interfaces defined (in ux.md component specs)
