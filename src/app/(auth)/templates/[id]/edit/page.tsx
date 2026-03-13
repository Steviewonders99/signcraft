'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Trash2 } from 'lucide-react';
import { NavToggle } from '@/components/layout/NavToggle';
import type { JSONContent } from '@tiptap/core';

export default function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState('');
  const [content, setContent] = useState<JSONContent>({});
  const [variables, setVariables] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name);
        setContent(data.content);
        setVariables(data.variables || []);
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, variables }),
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    router.push('/templates');
  }

  if (loading) return <p className="text-muted-foreground text-center py-12">Loading...</p>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <NavToggle />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1"
        />
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <DocumentEditor content={content} onChange={setContent} />

      <div className="mt-4 text-xs text-muted-foreground">
        Variables: {variables.length > 0 ? variables.join(', ') : 'None — insert {{ variables }} in the editor'}
      </div>
    </div>
  );
}
