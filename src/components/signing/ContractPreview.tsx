'use client';

import { useState, useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { ChevronUp } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';

// Lightweight variableTag extension for HTML generation (no React node view)
const VariableTagHTML = Node.create({
  name: 'variableTag',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return { name: { default: 'variable' } };
  },
  parseHTML() {
    return [{ tag: 'variable-tag' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'sc-variable',
        'data-variable': HTMLAttributes.name || 'variable',
      }),
      HTMLAttributes.name || 'variable',
    ];
  },
});

const extensions = [StarterKit, VariableTagHTML];

/** Transform signature field paragraphs into styled signature blocks.
 *  Handles <p> tags with optional attributes (e.g. xmlns from generateHTML).
 */
function transformSignatureBlocks(html: string): string {
  // Match <p ...> with any attributes, capturing the inner content that has signature fields
  // Single-paragraph format: <p ...>Signature: ___<br>Name: ___<br>...</p>
  html = html.replace(/<p[^>]*>((?:(?:Signature|Name|Title|Date)\s*:\s*_{3,})(?:<br\s*\/?>(?:(?:Signature|Name|Title|Date)\s*:\s*_{3,}))+)<\/p>/gi, (_, inner: string) => {
    const fields = inner.split(/<br\s*\/?>/).map((f: string) => {
      const m = f.trim().match(/^(Signature|Name|Title|Date)/i);
      return m ? m[1] : '';
    }).filter(Boolean);
    return renderSignatureBlockHtml(fields);
  });

  // Multi-paragraph format: consecutive <p ...>Field: ___</p> tags
  html = html.replace(/(?:<p[^>]*>(?:(?:Signature|Name|Title|Date)\s*:\s*_{3,})<\/p>\s*){2,}/gi, (match) => {
    const fields: string[] = [];
    const re = /<p[^>]*>((?:Signature|Name|Title|Date)\s*:\s*_{3,})<\/p>/gi;
    let m;
    while ((m = re.exec(match)) !== null) {
      const labelMatch = m[1].match(/^(Signature|Name|Title|Date)/i);
      if (labelMatch) fields.push(labelMatch[1]);
    }
    return renderSignatureBlockHtml(fields);
  });

  // Single remaining <p>Signature: ___</p>
  html = html.replace(/<p[^>]*>(Signature\s*:\s*_{3,})<\/p>/gi, () => {
    return renderSignatureBlockHtml(['Signature']);
  });

  return html;
}

function renderSignatureBlockHtml(fields: string[]): string {
  const rows = fields.map((label) =>
    `<div class="sc-sig-row"><span class="sc-sig-label">${label}</span><span class="sc-sig-line"></span></div>`
  ).join('');
  return `<div class="sc-signature-block">${rows}</div>`;
}

interface ContractPreviewProps {
  content: JSONContent;
  collapsed?: boolean;
  transparent?: boolean;
}

export function ContractPreview({ content, collapsed = true, transparent = false }: ContractPreviewProps) {
  const [expanded, setExpanded] = useState(!collapsed);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Client-only rendering avoids SSR/client hydration mismatch from generateHTML
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      const raw = generateHTML(content, extensions);
      setHtml(transformSignatureBlocks(raw));
    } catch {
      setHtml('<p>Unable to render document content.</p>');
    }
  }, [content]);

  function handleCollapse() {
    setExpanded(false);
    // Scroll the container back to top so the user sees the beginning
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }

  const containerClass = [
    'sc-contract max-w-none overflow-hidden',
    !transparent && 'p-5 md:p-8 rounded-lg border border-border/50',
    !expanded && 'max-h-60',
  ].filter(Boolean).join(' ');

  // Solid-to-transparent overlay for collapsed state — dark enough to ensure button visibility
  const overlayBg = transparent
    ? 'linear-gradient(to bottom, transparent 0%, oklch(0.1 0.005 285 / 0.6) 40%, oklch(0.1 0.005 285 / 0.95) 100%)'
    : 'linear-gradient(to bottom, transparent 0%, oklch(0.13 0.005 285 / 0.7) 40%, oklch(0.13 0.005 285 / 0.98) 100%)';

  return (
    <div className="relative" ref={scrollRef}>
      <div
        className={containerClass}
        style={transparent ? undefined : { backgroundColor: 'var(--bg-elevated)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded ? (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: overlayBg }}
          />
          <button
            onClick={() => setExpanded(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold z-10 px-5 py-2 rounded-full border transition-all hover:scale-105"
            style={{
              color: 'var(--accent-hex)',
              borderColor: 'hsl(var(--accent) / 0.4)',
              backgroundColor: 'hsl(var(--accent) / 0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            Read full document
          </button>
        </>
      ) : collapsed && (
        <div className="flex justify-center mt-3 mb-1">
          <button
            onClick={handleCollapse}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-full border transition-all hover:scale-105"
            style={{
              color: 'oklch(0.6 0 0)',
              borderColor: 'oklch(1 0 0 / 0.1)',
              backgroundColor: 'oklch(1 0 0 / 0.04)',
            }}
          >
            <ChevronUp className="w-3 h-3" />
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
