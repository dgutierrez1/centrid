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

// Export commonly used icon names as constants for autocomplete
export const Icons = {
  // Actions
  Zap: 'Zap' as IconName,
  Lock: 'Lock' as IconName,
  Upload: 'Upload' as IconName,
  Download: 'Download' as IconName,
  Search: 'Search' as IconName,
  Settings: 'Settings' as IconName,
  User: 'User' as IconName,
  Bell: 'Bell' as IconName,
  Check: 'Check' as IconName,
  X: 'X' as IconName,
  Plus: 'Plus' as IconName,
  Minus: 'Minus' as IconName,

  // Status
  AlertCircle: 'AlertCircle' as IconName,
  CheckCircle: 'CheckCircle' as IconName,
  XCircle: 'XCircle' as IconName,
  Info: 'Info' as IconName,
  AlertTriangle: 'AlertTriangle' as IconName,

  // Navigation
  Home: 'Home' as IconName,
  Menu: 'Menu' as IconName,
  ChevronDown: 'ChevronDown' as IconName,
  ChevronUp: 'ChevronUp' as IconName,
  ChevronLeft: 'ChevronLeft' as IconName,
  ChevronRight: 'ChevronRight' as IconName,

  // Files & Documents
  File: 'File' as IconName,
  FileText: 'FileText' as IconName,
  Folder: 'Folder' as IconName,
  Archive: 'Archive' as IconName,

  // Security
  Shield: 'Shield' as IconName,
  ShieldCheck: 'ShieldCheck' as IconName,
  Key: 'Key' as IconName,
};
