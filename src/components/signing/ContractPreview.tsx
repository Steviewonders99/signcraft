'use client';

import { useState } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/core';

interface ContractPreviewProps {
  content: JSONContent;
  collapsed?: boolean;
}

export function ContractPreview({ content, collapsed = true }: ContractPreviewProps) {
  const [expanded, setExpanded] = useState(!collapsed);

  let html = '';
  try {
    html = generateHTML(content, [StarterKit]);
  } catch {
    html = '<p>Unable to render document content.</p>';
  }

  return (
    <div className="relative">
      <div
        className={`prose prose-invert prose-sm max-w-none p-4 rounded-lg border border-border overflow-hidden ${
          !expanded ? 'max-h-48' : ''
        }`}
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(transparent, var(--bg-card))' }}
          />
          <button
            onClick={() => setExpanded(true)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium z-10"
            style={{ color: 'var(--accent-hex)' }}
          >
            Read full document
          </button>
        </>
      )}
    </div>
  );
}
