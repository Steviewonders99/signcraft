'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from './Toolbar';
import { VariableTagExtension } from './VariableTag';
import type { JSONContent } from '@tiptap/core';

interface DocumentEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  editable?: boolean;
}

export function DocumentEditor({ content, onChange, editable = true }: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: 'Start drafting your contract...' }),
      VariableTagExtension,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none p-4 min-h-[400px] focus:outline-none',
      },
    },
  });

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
    <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
      {editable && <Toolbar editor={editor} onInsertVariable={handleInsertVariable} />}
      <EditorContent editor={editor} />
    </div>
  );
}
