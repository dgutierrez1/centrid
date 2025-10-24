import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  className?: string;
}

/**
 * TipTap-based editor component with rich text formatting
 * Supports bold, italic, headings, lists, code blocks, blockquotes
 * Content is stored as HTML (markdown serialization can be added later)
 */
export function MarkdownEditor({
  initialContent = '',
  onChange,
  editable = true,
  className = '',
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg focus:outline-none ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // Update content if initialContent changes externally
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      if (initialContent !== currentContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full w-full overflow-auto">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
