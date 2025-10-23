/**
 * MarkdownEditor Component
 *
 * A WYSIWYG-style markdown editor using TipTap (ProseMirror-based).
 * Displays formatted markdown content with proper typography.
 */

'use client';

import * as React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@centrid/shared/utils';

export interface MarkdownEditorProps {
  /** Markdown content to display */
  content?: string;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Additional class names */
  className?: string;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text when content is empty */
  placeholder?: string;
}

interface ToolbarButtonProps {
  editor: Editor;
  label: string;
  icon: string;
  action: () => void;
  isActive?: () => boolean;
}

function ToolbarButton({ editor, label, icon, action, isActive }: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={isActive?.() ? 'default' : 'ghost'}
            className={cn(
              'h-8 px-2 font-mono text-xs',
              isActive?.() && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={(e) => {
              e.preventDefault();
              action();
            }}
            type="button"
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MarkdownEditor({
  content = '',
  onChange,
  className,
  showToolbar = true,
  readOnly = false,
  placeholder = 'Start writing...',
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content,
    contentType: 'markdown',
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Get markdown content using official API
      const markdown = editor.getMarkdown();
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-4 prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-gray-800 dark:prose-h2:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-7 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-ul:my-4 p-6',
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content, { contentType: 'markdown' });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-800', className)}>
      {/* Formatting Toolbar */}
      {showToolbar && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1 flex-shrink-0">
          <ToolbarButton
            editor={editor}
            label="Bold"
            icon="B"
            action={() => editor.chain().focus().toggleBold().run()}
            isActive={() => editor.isActive('bold')}
          />
          <ToolbarButton
            editor={editor}
            label="Italic"
            icon="I"
            action={() => editor.chain().focus().toggleItalic().run()}
            isActive={() => editor.isActive('italic')}
          />
          <ToolbarButton
            editor={editor}
            label="Heading 1"
            icon="H1"
            action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={() => editor.isActive('heading', { level: 1 })}
          />
          <ToolbarButton
            editor={editor}
            label="Heading 2"
            icon="H2"
            action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={() => editor.isActive('heading', { level: 2 })}
          />
          <ToolbarButton
            editor={editor}
            label="Bullet List"
            icon="•"
            action={() => editor.chain().focus().toggleBulletList().run()}
            isActive={() => editor.isActive('bulletList')}
          />
          <ToolbarButton
            editor={editor}
            label="Code Block"
            icon="</>"
            action={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={() => editor.isActive('codeBlock')}
          />
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Mobile-optimized variant
export interface MarkdownEditorMobileProps extends MarkdownEditorProps {
  /** Mobile-specific optimizations */
  touchOptimized?: boolean;
}

export function MarkdownEditorMobile({
  content = '',
  onChange,
  className,
  showToolbar = true,
  readOnly = false,
  placeholder = 'Start writing...',
  touchOptimized = true,
}: MarkdownEditorMobileProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content,
    contentType: 'markdown',
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-3 prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-gray-800 dark:prose-h2:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-6 p-4',
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content, { contentType: 'markdown' });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-800', className)}>
      {/* Mobile Toolbar - Larger touch targets */}
      {showToolbar && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1 overflow-x-auto">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            className={cn(
              'font-mono text-xs',
              touchOptimized ? 'h-11 min-w-[44px] px-3' : 'h-8 px-2',
              editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
            type="button"
          >
            B
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            className={cn(
              'font-mono text-xs',
              touchOptimized ? 'h-11 min-w-[44px] px-3' : 'h-8 px-2',
              editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            type="button"
          >
            I
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            className={cn(
              'font-mono text-xs',
              touchOptimized ? 'h-11 min-w-[44px] px-3' : 'h-8 px-2',
              editor.isActive('heading', { level: 1 }) && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            type="button"
          >
            H1
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            className={cn(
              'font-mono text-xs',
              touchOptimized ? 'h-11 min-w-[44px] px-3' : 'h-8 px-2',
              editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            type="button"
          >
            •
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            className={cn(
              'font-mono text-xs',
              touchOptimized ? 'h-11 min-w-[44px] px-3' : 'h-8 px-2',
              editor.isActive('codeBlock') && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            type="button"
          >
            {'</>'}
          </Button>
        </div>
      )}

      {/* Mobile Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
