'use client';

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Toolbar } from './Toolbar';
import { VariableTagExtension } from './VariableTag';
import type { JSONContent } from '@tiptap/core';

export interface DocumentEditorHandle {
  getEditor: () => Editor | null;
}

interface DocumentEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  editable?: boolean;
  initialHtml?: string | null;
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(function DocumentEditor({ content, onChange, editable = true, initialHtml }, ref) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: 'Start drafting your contract...' }),
      Markdown.configure({ transformPastedText: true, transformCopiedText: false }),
      VariableTagExtension,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'sc-editor prose prose-invert max-w-none min-h-[500px] focus:outline-none',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }), [editor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editor && initialHtml) {
      editor.commands.setContent(initialHtml);
      onChange(editor.getJSON());
    }
  }, [editor, initialHtml]);

  function handleInsertVariable() {
    const name = prompt('Variable name:');
    if (name && editor) {
      editor.chain().focus().insertContent({
        type: 'variableTag',
        attrs: { name },
      }).run();
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0 px-4 md:px-8 py-4" style={{ backgroundColor: 'var(--bg-root)' }}>
        <div
          className="flex-1 flex flex-col min-h-0 rounded-lg border border-border/60 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {editable && (
            <div className="shrink-0 border-b border-border/60" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <Toolbar editor={editor} onInsertVariable={handleInsertVariable} />
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
});
