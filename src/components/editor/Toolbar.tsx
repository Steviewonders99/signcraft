'use client';

import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
  onInsertVariable: () => void;
}

export function Toolbar({ editor, onInsertVariable }: ToolbarProps) {
  if (!editor) return null;

  const items = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="flex items-center gap-0.5 p-2 border-b border-border overflow-x-auto">
      {items.map((item, i) => (
        <Button
          key={i}
          variant="ghost"
          size="sm"
          onClick={item.action}
          className={`h-8 w-8 p-0 ${item.active ? 'bg-white/10' : ''}`}
        >
          <item.icon className="w-4 h-4" />
        </Button>
      ))}
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onInsertVariable}
        className="h-8 px-2 text-xs font-mono"
        style={{ color: 'var(--accent-hex)' }}
      >
        {'{{ }}'}
      </Button>
    </div>
  );
}
