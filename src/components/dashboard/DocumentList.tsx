'use client';

import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { ChevronRight } from 'lucide-react';
import type { DocumentWithStatus } from '@/types';

function getStatus(doc: DocumentWithStatus): string {
  if (!doc.signing_request) return 'draft';
  return doc.signing_request.status;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function DocumentList({ documents }: { documents: DocumentWithStatus[] }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No documents yet. Create your first contract.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
      {documents.map((doc, i) => (
        <Link
          key={doc.id}
          href={`/documents/${doc.id}`}
          className={`flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.03] group ${
            i > 0 ? 'border-t border-border' : ''
          }`}
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-medium truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.signing_request?.signer_name || 'No recipient'} · {formatDate(doc.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={getStatus(doc)} />
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
          </div>
        </Link>
      ))}
    </div>
  );
}
