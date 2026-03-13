'use client';

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Toolbar } from './Toolbar';
import { VariableTagExtension } from './VariableTag';
import { markdownToHtml } from '@/lib/markdown';
import type { JSONContent } from '@tiptap/core';

/** Detect if pasted text contains markdown syntax */
function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,4}\s+/m.test(text) ||
    /\*\*.+?\*\*/m.test(text) ||
    /^-{3,}$/m.test(text) ||
    /^\|.+\|$/m.test(text) ||
    /^[-*]\s+/m.test(text) ||
    /^\d+\.\s+/m.test(text)
  );
}

/** TipTap extension: intercept pasted plain text, convert markdown → rich HTML */
const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (view, event) => {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            // Only intercept plain-text pastes (no HTML already on clipboard)
            const html = clipboard.getData('text/html');
            if (html) return false;

            const text = clipboard.getData('text/plain');
            if (!text || !looksLikeMarkdown(text)) return false;

            // Convert markdown → HTML and insert as rich content
            event.preventDefault();
            const converted = markdownToHtml(text);
            this.editor.commands.insertContent(converted);
            return true;
          },
        },
      }),
    ];
  },
});

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
      MarkdownPaste,
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
