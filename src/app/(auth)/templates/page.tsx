'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import type { Template } from '@/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      });
  }, []);

  async function handleCreate() {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Template' }),
    });
    const template = await res.json();
    window.location.href = `/templates/${template.id}/edit`;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No templates yet. Create one to reuse across contracts.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          {templates.map((t, i) => (
            <Link
              key={t.id}
              href={`/templates/${t.id}/edit`}
              className={`flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.03] group ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.variables.length} variables · {t.category || 'Uncategorized'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
