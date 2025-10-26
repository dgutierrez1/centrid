export const screens = [
  {
    id: 'workspace',
    title: 'Integrated Workspace',
    route: '/ai-agent-system/workspace',
    description:
      'Full workspace integration with file tree, editor, and AI chat. Switch between desktop (3-panel) and mobile (bottom nav) viewports.',
  },
  {
    id: 'chat-states',
    title: 'Chat States',
    route: '/ai-agent-system/chat-states',
    description:
      'ChatView and ChatListPanel component states including idle, streaming, tool calls, and various interaction states.',
  },
  {
    id: 'components',
    title: 'Component Showcase',
    route: '/ai-agent-system/components',
    description:
      'Individual components (ApprovalCard, ConflictModal, ContextReferenceBar, ChatMessage) with all states and variations.',
  },
] as const;

export type ScreenId = (typeof screens)[number]['id'];
