'use client';

import { useEffect, useState } from 'react';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavToggle } from '@/components/layout/NavToggle';
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
            signing_request: Array.isArray(d.signing_requests)
              ? d.signing_requests[0]
              : d.signing_requests || undefined,
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <NavToggle />
          <div>
            <h1 className="text-2xl font-bold">All Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/documents/new" className={cn(buttonVariants({ size: 'lg' }))}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
