/**
 * Icon components for file tree
 * Provides visual indicators for different node types
 */

export interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Folder icon
 */
export function FolderIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

/**
 * Document icon
 */
export function DocumentIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/**
 * Markdown file icon
 */
export function MarkdownIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h16V5H4zm3 10h2l2-3 2 3h2v-6h-2v3.5l-2-3-2 3V9H7v6z" />
    </svg>
  );
}

/**
 * Text file icon
 */
export function TextFileIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Brand loading spinner
 * Uses Centrid coral color (#ff4d4d) and animate-spin
 */
export function BrandSpinner({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Get appropriate icon for file type
 */
export function getFileIcon(mimeType?: string): React.FC<IconProps> {
  if (mimeType === 'text/markdown') {
    return MarkdownIcon;
  }
  if (mimeType === 'text/plain') {
    return TextFileIcon;
  }
  return DocumentIcon;
}
