'use client';

import { useEffect, useState } from 'react';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentWithStatus } from '@/types';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'viewed', 'signed', 'complete'] as const;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithStatus[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then((r) => r.json())
      .then((data) => {
        setDocuments(
          data.map((d: Record<string, unknown>) => ({
            ...d,
            signing_request: (d.signing_requests as Record<string, unknown>[])?.[0] || undefined,
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = documents.filter((doc) => {
    const status = doc.signing_request?.status || 'draft';
    if (filter !== 'all' && status !== filter) return false;
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">All Documents</h1>
        <Link href="/documents/new" className={cn(buttonVariants())}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(s)}
              className="capitalize whitespace-nowrap"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : (
        <DocumentList documents={filtered} />
      )}
    </div>
  );
}
