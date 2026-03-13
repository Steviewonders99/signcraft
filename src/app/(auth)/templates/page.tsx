'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronRight, FileText } from 'lucide-react';
import { NavToggle } from '@/components/layout/NavToggle';
import type { Template } from '@/types';

interface BuiltinTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
  variables: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [builtinTemplates, setBuiltinTemplates] = useState<BuiltinTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then((r) => r.json()).catch(() => []),
      fetch('/api/templates/builtin').then((r) => r.json()).catch(() => []),
    ]).then(([userT, builtinT]) => {
      setTemplates(Array.isArray(userT) ? userT : []);
      setBuiltinTemplates(Array.isArray(builtinT) ? builtinT : []);
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <NavToggle />
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Reusable contract templates for your team
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : (
        <>
          {/* Built-in Templates */}
          {builtinTemplates.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Built-in Templates</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
                {builtinTemplates.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/documents/new?template=${t.slug}`}
                    className="flex items-start gap-4 rounded-lg border border-border p-5 transition-colors hover:border-white/20 group"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium mb-1.5">{t.name}</p>
                      <Badge variant="outline" className="text-[10px] mb-2">{t.category}</Badge>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* User Templates */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">My Templates</h2>
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No custom templates yet. Create one to reuse across contracts.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((t) => (
                <Link
                  key={t.id}
                  href={`/templates/${t.id}/edit`}
                  className="flex items-start gap-4 rounded-lg border border-border p-5 transition-colors hover:border-white/20 group"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium mb-1">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.variables.length} variables · {t.category || 'Uncategorized'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
