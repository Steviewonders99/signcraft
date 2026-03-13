'use client';

import { useState, useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { ChevronUp } from 'lucide-react';
import { markdownToHtml } from '@/lib/markdown';
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

/** Extract plain text from TipTap JSON, preserving paragraph breaks for markdown parsing */
function extractPlainText(json: JSONContent): string {
  if (!json) return '';
  if (json.text) return json.text;
  if (json.type === 'hardBreak') return '\n';
  if (!json.content) return '';

  if (json.type === 'doc') {
    return json.content.map(extractPlainText).join('\n\n');
  }
  // Paragraphs, headings, list items — concatenate inline children
  return json.content.map(extractPlainText).join('');
}

/** Detect if extracted text contains raw markdown syntax */
function hasMarkdownSyntax(text: string): boolean {
  return (
    /^#{1,4}\s+/m.test(text) ||
    /\*\*.+?\*\*/m.test(text) ||
    /^-{3,}$/m.test(text) ||
    /^\|.+\|$/m.test(text)
  );
}

/** Convert raw markdown syntax inside <p> tags to proper HTML.
 *  Fallback for content that has partial markdown mixed in.
 */
function convertMarkdownInHtml(html: string): string {
  // Convert <p> ## Heading </p> → <h2>Heading</h2> (with optional whitespace)
  html = html.replace(/<p[^>]*>\s*####\s+(.+?)\s*<\/p>/gi, '<h4>$1</h4>');
  html = html.replace(/<p[^>]*>\s*###\s+(.+?)\s*<\/p>/gi, '<h3>$1</h3>');
  html = html.replace(/<p[^>]*>\s*##\s+(.+?)\s*<\/p>/gi, '<h2>$1</h2>');
  html = html.replace(/<p[^>]*>\s*#\s+(.+?)\s*<\/p>/gi, '<h1>$1</h1>');

  // Convert <p>---</p> → <hr> (with optional whitespace)
  html = html.replace(/<p[^>]*>\s*-{3,}\s*<\/p>/gi, '<hr>');

  // Convert **bold** → <strong>bold</strong> inside any element
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* → <em>italic</em> (but not inside already converted strong)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Convert markdown tables: | col | col | rows
  html = html.replace(/(?:<p[^>]*>\|.+?\|<\/p>\s*)+/gi, (match) => {
    const rows = match.match(/<p[^>]*>(\|.+?\|)<\/p>/gi);
    if (!rows || rows.length < 2) return match;

    let table = '<table>';
    rows.forEach((row, i) => {
      const cellContent = row.replace(/<p[^>]*>\|(.+?)\|<\/p>/i, '$1');
      if (/^[\s|:-]+$/.test(cellContent)) return;
      const cells = cellContent.split('|').map((c) => c.trim());
      const tag = i === 0 ? 'th' : 'td';
      table += '<tr>' + cells.map((c) => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    table += '</table>';
    return table;
  });

  return html;
}

// Signature field labels we recognize (case-insensitive)
const SIG_FIELD_RE = /^(Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,}/i;
const SIG_FIELD_LABEL_RE = /^(Signature|Printed Name|Name|Title|Date|Email|Phone)/i;

/** Transform signature field paragraphs into styled signature blocks.
 *  Handles <p> tags with optional attributes (e.g. xmlns from generateHTML).
 */
function transformSignatureBlocks(html: string): string {
  // Single-paragraph format: fields separated by <br>
  html = html.replace(/<p[^>]*>((?:(?:Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,})(?:<br\s*\/?>(?:(?:Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,}))+)<\/p>/gi, (_, inner: string) => {
    const fields = inner.split(/<br\s*\/?>/).map((f: string) => {
      const m = f.trim().match(SIG_FIELD_LABEL_RE);
      return m ? m[1] : '';
    }).filter(Boolean);
    return renderSignatureBlockHtml(fields);
  });

  // Multi-paragraph format: consecutive <p>Field: ___</p> tags (2+ in a row)
  html = html.replace(/(?:<p[^>]*>(?:(?:Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,}[^<]*)<\/p>\s*){2,}/gi, (match) => {
    const fields: string[] = [];
    const re = /<p[^>]*>((?:Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,}[^<]*)<\/p>/gi;
    let m;
    while ((m = re.exec(match)) !== null) {
      const labelMatch = m[1].match(SIG_FIELD_LABEL_RE);
      if (labelMatch) fields.push(labelMatch[1]);
    }
    return renderSignatureBlockHtml(fields);
  });

  // Any remaining individual signature-related field: Signature: ___, Date: ___, etc.
  html = html.replace(/<p[^>]*>((?:Signature|Printed Name|Name|Title|Date)\s*:\s*_{2,}[^<]*)<\/p>/gi, (_, inner: string) => {
    const m = inner.match(SIG_FIELD_LABEL_RE);
    return m ? renderSignatureFieldHtml(m[1]) : _;
  });

  return html;
}

function renderSignatureBlockHtml(fields: string[]): string {
  const rows = fields.map((label) =>
    `<div class="sc-sig-row"><span class="sc-sig-label">${label}</span><span class="sc-sig-line"></span></div>`
  ).join('');
  return `<div class="sc-signature-block">${rows}</div>`;
}

/** Render a single standalone signature field (e.g. a lone "Date: ___" in the middle of the doc) */
function renderSignatureFieldHtml(label: string): string {
  return `<div class="sc-signature-field"><span class="sc-sig-label">${label}</span><span class="sc-sig-line"></span></div>`;
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
      const plainText = extractPlainText(content);
      let processed: string;

      if (hasMarkdownSyntax(plainText)) {
        // Content has raw markdown stored as text — use marked for proper conversion
        processed = markdownToHtml(plainText);
      } else {
        // Properly structured TipTap content — use generateHTML + fallback cleanup
        const raw = generateHTML(content, extensions);
        processed = convertMarkdownInHtml(raw);
      }

      setHtml(transformSignatureBlocks(processed));
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
