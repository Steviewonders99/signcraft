'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge, EmbedBadge } from './StatusBadge';
import { ChevronRight, FileText, Eye, Trash2 } from 'lucide-react';
import type { DocumentWithStatus } from '@/types';

function getStatus(doc: DocumentWithStatus): string {
  if (!doc.signing_request) return 'draft';
  return doc.signing_request.status;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DocumentList({ documents }: { documents: DocumentWithStatus[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, docId: string, docTitle: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;

    setDeleting(docId);
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(null);
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No documents yet. Create your first contract.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {documents.map((doc) => {
        const isEmbed = doc.signing_request?.embed_mode;
        return (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className={`flex items-start gap-4 rounded-lg border border-border p-5 transition-colors hover:border-white/20 group ${deleting === doc.id ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1 truncate">{doc.title}</p>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={getStatus(doc)} />
                {isEmbed && <EmbedBadge />}
              </div>
              <p className="text-xs text-muted-foreground">
                {doc.signing_request?.signer_name || 'No recipient'}
                {isEmbed && doc.embed_views !== undefined && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <Eye className="w-3 h-3" /> {doc.embed_views}
                  </span>
                )}
                {' · '}{formatDate(doc.updated_at)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.id, doc.title)}
              className="shrink-0 mt-1 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Link>
        );
      })}
    </div>
  );
}
