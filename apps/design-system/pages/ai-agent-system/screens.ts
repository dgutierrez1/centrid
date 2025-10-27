export const screens = [
  {
    id: 'chat-interface',
    title: '01 - Chat Interface (Full)',
    route: '/ai-agent-system/chat-interface',
    description:
      'Complete chat interface with branch selector, message stream, context panel (6 sections), and input. Shows branching threads and cross-branch discovery.',
  },
  {
    id: 'branch-selector',
    title: '02 - Branch Selector',
    route: '/ai-agent-system/branch-selector',
    description:
      'Hierarchical tree dropdown showing current branch, parent, siblings, children, and other branches with metadata.',
  },
  {
    id: 'context-panel',
    title: '03 - Context Panel',
    route: '/ai-agent-system/context-panel',
    description:
      'Context panel with 6 sections: Explicit, Frequently Used, Semantic Matches, Branch Context, Artifacts, and Excluded items. Shows priority indicators.',
  },
  {
    id: 'file-editor',
    title: '04 - File Editor (Provenance)',
    route: '/ai-agent-system/file-editor',
    description:
      'File editor with provenance header showing source branch, creation context, last edit info, and "Go to source" navigation.',
  },
  {
    id: 'approval-modal',
    title: '05 - Approval Modal',
    route: '/ai-agent-system/approval-modal',
    description:
      'Tool call approval flow showing inline approval prompt during agent streaming with file preview and approve/reject actions.',
  },
  {
    id: 'tree-view',
    title: '06 - Visual Tree View',
    route: '/ai-agent-system/tree-view',
    description:
      'Interactive branch tree visualization showing hierarchical relationships, artifact counts, and active branch highlighting (Phase 3).',
  },
] as const;

export type ScreenId = (typeof screens)[number]['id'];
