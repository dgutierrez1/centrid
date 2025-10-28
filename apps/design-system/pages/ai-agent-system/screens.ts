/**
 * Screen metadata for AI Agent System feature showcase
 * Used by DesignSystemFrame for consistent navigation
 */

export interface ScreenMetadata {
  id: string;
  title: string;
  route: string;
  description: string;
}

export const screens: ScreenMetadata[] = [
  {
    id: 'overview',
    title: '00 - Overview',
    route: '/ai-agent-system',
    description: 'Feature overview with workspace preview',
  },
  {
    id: 'workspace',
    title: '01 - Workspace (Screen Design)',
    route: '/ai-agent-system/workspace',
    description: 'Full adaptive 3-panel workspace - the actual screen',
  },
  {
    id: 'components',
    title: '02 - Component Library',
    route: '/ai-agent-system/components',
    description: 'All components with states and variations',
  },
] as const;
