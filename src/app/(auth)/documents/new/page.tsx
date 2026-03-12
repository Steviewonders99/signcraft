'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { AISidebar } from '@/components/editor/AISidebar';
import { AIFab } from '@/components/mobile/AIFab';
import { AIOverlay } from '@/components/mobile/AIOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';

export default function NewDocumentPage() {
  const [title, setTitle] = useState('Untitled Contract');
  const [content, setContent] = useState<JSONContent>({});
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const router = useRouter();

  const handleInsertContent = useCallback((text: string) => {
    // AI inserts content — will be handled by updating content state
    setContent((prev) => ({
      type: 'doc',
      content: [
        ...(prev.content || []),
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ],
    }));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    const doc = await res.json();
    setSaving(false);
    router.push(`/documents/${doc.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1"
          placeholder="Document title..."
        />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Desktop: two-column layout */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <DocumentEditor content={content} onChange={setContent} />
        </div>
        <div className="hidden lg:block w-80 shrink-0">
          <AISidebar onInsert={handleInsertContent} />
        </div>
      </div>

      {/* Mobile: FAB + overlay */}
      <div className="lg:hidden">
        <AIFab onClick={() => setShowAI(true)} />
        <AIOverlay
          open={showAI}
          onClose={() => setShowAI(false)}
          onInsert={handleInsertContent}
        />
      </div>
    </div>
  );
}
