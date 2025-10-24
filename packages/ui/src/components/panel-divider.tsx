export interface PanelDividerProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * PanelDivider - Visual separator between panels
 * Provides subtle visual boundary without interaction (non-resizable for MVP)
 */
export function PanelDivider({
  orientation = 'vertical',
  className = '',
}: PanelDividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`w-px h-full bg-gray-200 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`h-px w-full bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}
