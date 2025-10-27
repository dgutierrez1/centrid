import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

/**
 * Icon - Wrapper around lucide-react icons for easy reusability
 *
 * @example
 * ```tsx
 * <Icon name="Zap" className="w-6 h-6 text-primary-600" />
 * <Icon name="Lock" size={20} />
 * ```
 */
export function Icon({ name, className = '', size }: IconProps) {
  const LucideIcon = LucideIcons[name] as LucideIcons.LucideIcon;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <LucideIcon className={className} size={size} />;
}

// Export commonly used icons as components
export const Icons = {
  // Actions
  zap: LucideIcons.Zap,
  lock: LucideIcons.Lock,
  upload: LucideIcons.Upload,
  download: LucideIcons.Download,
  search: LucideIcons.Search,
  settings: LucideIcons.Settings,
  user: LucideIcons.User,
  bell: LucideIcons.Bell,
  check: LucideIcons.Check,
  x: LucideIcons.X,
  plus: LucideIcons.Plus,
  minus: LucideIcons.Minus,
  copy: LucideIcons.Copy,
  send: LucideIcons.Send,
  square: LucideIcons.Square,
  loader2: LucideIcons.Loader2,

  // Status
  alertCircle: LucideIcons.AlertCircle,
  checkCircle: LucideIcons.CheckCircle,
  xCircle: LucideIcons.XCircle,
  info: LucideIcons.Info,
  alertTriangle: LucideIcons.AlertTriangle,

  // Navigation
  home: LucideIcons.Home,
  menu: LucideIcons.Menu,
  chevronDown: LucideIcons.ChevronDown,
  chevronUp: LucideIcons.ChevronUp,
  chevronLeft: LucideIcons.ChevronLeft,
  chevronRight: LucideIcons.ChevronRight,
  externalLink: LucideIcons.ExternalLink,

  // Files & Documents
  file: LucideIcons.File,
  fileText: LucideIcons.FileText,
  fileEdit: LucideIcons.FileEdit,
  filePlus: LucideIcons.FilePlus,
  fileMove: LucideIcons.Move,
  folder: LucideIcons.Folder,
  archive: LucideIcons.Archive,
  trash: LucideIcons.Trash,

  // Chat & Agent
  messageSquare: LucideIcons.MessageSquare,
  bot: LucideIcons.Bot,

  // Version Control & Branching
  gitBranch: LucideIcons.GitBranch,

  // UI Elements
  layers: LucideIcons.Layers,
  sparkles: LucideIcons.Sparkles,
  edit: LucideIcons.Edit,
  globe: LucideIcons.Globe,
  code: LucideIcons.Code,
  clipboard: LucideIcons.Clipboard,

  // Security
  shield: LucideIcons.Shield,
  shieldCheck: LucideIcons.ShieldCheck,
  key: LucideIcons.Key,
};
