import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import type { AuditEvent } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  meta: { fontSize: 9, color: '#888', marginBottom: 24 },
  heading1: { fontSize: 16, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  heading2: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 6 },
  heading3: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 5 },
  paragraph: { lineHeight: 1.7, marginBottom: 10 },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  boldItalic: { fontWeight: 'bold', fontStyle: 'italic' },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 12 },
  listBullet: { width: 14, lineHeight: 1.7 },
  listContent: { flex: 1, lineHeight: 1.7 },
  codeBlock: { fontFamily: 'Courier', fontSize: 9, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 3, marginBottom: 10 },
  blockquote: { borderLeft: '3px solid #ddd', paddingLeft: 12, marginBottom: 10, color: '#555' },
  hr: { borderBottom: '1px solid #ddd', marginVertical: 16 },
  variable: { fontFamily: 'Courier', fontSize: 10, color: '#666' },
  // Signature block container
  sigBlock: { marginTop: 8, marginBottom: 16, padding: 14, border: '1px solid #e5e5e5', borderRadius: 4 },
  sigRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  sigRowFirst: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, paddingBottom: 4, gap: 8 },
  sigFieldLabel: { fontSize: 8, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, width: 75 },
  sigFieldLine: { flex: 1, borderBottom: '1px solid #ccc', height: 1 },
  // Filled signature styles
  sigImage: { width: 160, height: 50, marginBottom: 2 },
  sigFilledValue: { fontSize: 10, color: '#1a1a1a' },
  sigFilledDate: { fontSize: 10, color: '#444' },
  sigNotice: { fontSize: 7, color: '#999', marginTop: 6, fontStyle: 'italic' },
  // Verification footer
  verifySection: { marginTop: 30, borderTop: '2px solid #1a1a1a', paddingTop: 16 },
  verifyTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  verifyRow: { fontSize: 9, color: '#444', marginBottom: 6, lineHeight: 1.5 },
  verifyLabel: { fontWeight: 'bold', color: '#1a1a1a' },
  // Audit trail
  auditSection: { marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 12 },
  auditTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#666' },
  auditRow: { fontSize: 7, color: '#888', marginBottom: 2 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TipTapNode = { type?: string; text?: string; content?: TipTapNode[]; attrs?: any; marks?: Array<{ type: string }> };

/** Extract text segments from a paragraph (splitting on hardBreak) */
function extractTextSegments(node: TipTapNode): string[] {
  if (node.type !== 'paragraph' || !node.content) return [];
  const segments: string[] = [];
  let current = '';
  for (const child of node.content) {
    if (child.type === 'hardBreak') {
      if (current.trim()) segments.push(current.trim());
      current = '';
    } else if (child.type === 'text') {
      current += child.text || '';
    }
  }
  if (current.trim()) segments.push(current.trim());
  return segments;
}

const PDF_SIG_FIELD_RE = /^(?:Signature|Printed Name|Name|Title|Date|Email|Phone)\s*:\s*_{2,}/;
const PDF_SIG_LABEL_RE = /^(Signature|Printed Name|Name|Title|Date|Email|Phone)/;

/** Check if a paragraph contains signature field(s) — either single or multi-field with hardBreaks */
function isSignatureBlock(node: TipTapNode): boolean {
  if (node.type !== 'paragraph') return false;
  const segments = extractTextSegments(node);
  return segments.some((s) => /^Signature\s*:\s*_{2,}/.test(s));
}

/** Extract field labels from a signature block paragraph */
function extractSigFieldLabels(node: TipTapNode): string[] {
  const segments = extractTextSegments(node);
  return segments
    .map((s) => {
      const m = s.match(PDF_SIG_LABEL_RE);
      return m ? m[1] : null;
    })
    .filter((l): l is string => l !== null);
}

/** Check if a paragraph is a single signature-related field (for multi-paragraph format) */
function isSignatureFieldParagraph(node: TipTapNode): boolean {
  if (node.type !== 'paragraph') return false;
  const segments = extractTextSegments(node);
  return segments.length === 1 && PDF_SIG_FIELD_RE.test(segments[0]);
}

/** Check if specifically starts with Signature: ___ (first field in a block) */
function isSignatureLine(node: TipTapNode): boolean {
  if (node.type !== 'paragraph') return false;
  const segments = extractTextSegments(node);
  return segments.length > 0 && /^Signature\s*:\s*_{2,}/.test(segments[0]);
}

interface SignatureInfo {
  role: string;
  data: string;
  name: string;
  date: string;
}

/** Render a blank signature field row for PDF */
function renderBlankSigRow(label: string, index: number, isFirst: boolean): ReactElement {
  return createElement(View, { key: index, style: isFirst ? styles.sigRowFirst : styles.sigRow },
    createElement(Text, { style: styles.sigFieldLabel }, label),
    createElement(View, { style: styles.sigFieldLine }),
  );
}

/** Render a professional signature block — blank or filled */
function renderSignatureBlock(index: number, fields: string[], sig: SignatureInfo | undefined): ReactElement {
  if (!sig) {
    // Blank signature block
    return createElement(View, { key: index, style: styles.sigBlock },
      ...fields.map((label, i) => renderBlankSigRow(label, i, label === 'Signature')),
    );
  }

  const dateStr = sig.date ? new Date(sig.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : '';

  return createElement(View, { key: index, style: styles.sigBlock },
    // Signature row with image
    createElement(View, { key: 'sig-label', style: { marginBottom: 2 } },
      createElement(Text, { style: styles.sigFieldLabel }, 'SIGNATURE'),
    ),
    sig.data.startsWith('data:')
      ? createElement(Image, { style: styles.sigImage, src: sig.data })
      : createElement(Text, { style: { fontFamily: 'Courier', fontSize: 18, fontStyle: 'italic', marginBottom: 6 } }, sig.data),
    createElement(View, { style: { borderBottom: '1px solid #ccc', marginBottom: 10 } }),
    // Name row
    createElement(View, { key: 'name', style: styles.sigRow },
      createElement(Text, { style: styles.sigFieldLabel }, 'NAME'),
      createElement(Text, { style: styles.sigFilledValue }, sig.name),
    ),
    // Date row
    createElement(View, { key: 'date', style: styles.sigRow },
      createElement(Text, { style: styles.sigFieldLabel }, 'DATE'),
      createElement(Text, { style: styles.sigFilledDate }, dateStr),
    ),
    // Electronic signature notice
    createElement(Text, { style: styles.sigNotice },
      'Electronically signed via SignCraft'
    ),
  );
}

/** Render inline content (text + marks + variable tags) into an array of Text elements */
function renderInline(nodes: TipTapNode[] | undefined): ReactElement[] {
  if (!nodes) return [];
  return nodes.map((node, i) => {
    if (node.type === 'variableTag') {
      const name = node.attrs?.name || 'variable';
      return createElement(Text, { key: i, style: styles.variable }, `[${name}]`);
    }
    if (node.type === 'hardBreak') {
      return createElement(Text, { key: i }, '\n');
    }
    const text = node.text || '';
    const hasBold = node.marks?.some((m) => m.type === 'bold');
    const hasItalic = node.marks?.some((m) => m.type === 'italic');
    const style = hasBold && hasItalic ? styles.boldItalic : hasBold ? styles.bold : hasItalic ? styles.italic : undefined;
    return createElement(Text, { key: i, style }, text);
  });
}

/** Render a block-level TipTap node into a react-pdf element */
function renderBlock(node: TipTapNode, index: number): ReactElement | null {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 2;
      const style = level === 1 ? styles.heading1 : level === 2 ? styles.heading2 : styles.heading3;
      return createElement(Text, { key: index, style }, ...renderInline(node.content));
    }
    case 'paragraph':
      return createElement(Text, { key: index, style: styles.paragraph }, ...renderInline(node.content));
    case 'bulletList':
      return createElement(View, { key: index },
        ...(node.content || []).map((li, j) =>
          createElement(View, { key: j, style: styles.listItem },
            createElement(Text, { style: styles.listBullet }, '•  '),
            createElement(Text, { style: styles.listContent }, ...renderInline(li.content?.[0]?.content)),
          )
        )
      );
    case 'orderedList':
      return createElement(View, { key: index },
        ...(node.content || []).map((li, j) =>
          createElement(View, { key: j, style: styles.listItem },
            createElement(Text, { style: styles.listBullet }, `${j + 1}. `),
            createElement(Text, { style: styles.listContent }, ...renderInline(li.content?.[0]?.content)),
          )
        )
      );
    case 'codeBlock':
      return createElement(Text, { key: index, style: styles.codeBlock },
        (node.content || []).map((n) => n.text || '').join('\n')
      );
    case 'blockquote':
      return createElement(View, { key: index, style: styles.blockquote },
        ...(node.content || []).map((child, j) => renderBlock(child, j)).filter(Boolean) as ReactElement[]
      );
    case 'horizontalRule':
      return createElement(View, { key: index, style: styles.hr });
    default:
      // Fallback: extract any text
      if (node.content) {
        return createElement(Text, { key: index, style: styles.paragraph }, ...renderInline(node.content));
      }
      return null;
  }
}

interface PdfProps {
  title: string;
  content: TipTapNode;
  signatures: SignatureInfo[];
  auditEvents: AuditEvent[];
}

export function ContractPdf({ title, content, signatures, auditEvents }: PdfProps) {
  const nodes = content.content || [];
  const blocks: ReactElement[] = [];
  let sigBlockIdx = 0;
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    // Single paragraph with hardBreak-separated fields (most common)
    if (isSignatureBlock(node) && extractSigFieldLabels(node).length > 1) {
      const fields = extractSigFieldLabels(node);
      const sig = signatures[sigBlockIdx];
      sigBlockIdx++;
      blocks.push(renderSignatureBlock(blocks.length, fields, sig));
      i++;
    }
    // Multi-paragraph format: consecutive separate <p> per field
    else if (isSignatureLine(node)) {
      const fields: string[] = [];
      while (i < nodes.length && isSignatureFieldParagraph(nodes[i])) {
        const labels = extractSigFieldLabels(nodes[i]);
        fields.push(...labels);
        i++;
      }
      const sig = signatures[sigBlockIdx];
      sigBlockIdx++;
      blocks.push(renderSignatureBlock(blocks.length, fields, sig));
    }
    // Individual standalone signature field (not part of a consecutive block)
    else if (isSignatureFieldParagraph(node)) {
      const labels = extractSigFieldLabels(node);
      if (labels.length > 0) {
        blocks.push(renderBlankSigRow(labels[0], blocks.length, labels[0] === 'Signature'));
      }
      i++;
    } else {
      const rendered = renderBlock(node, blocks.length);
      if (rendered) blocks.push(rendered);
      i++;
    }
  }

  return createElement(Document, {},
    createElement(Page, { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.title }, title),
      createElement(Text, { style: styles.meta }, `Generated by SignCraft · ${new Date().toLocaleDateString()}`),

      // Document body — signature blocks are filled inline
      createElement(View, {}, ...blocks),

      // Signature verification section (legal proof)
      signatures.length > 0 && createElement(View, { style: styles.verifySection },
        createElement(Text, { style: styles.verifyTitle }, 'Electronic Signature Verification'),
        ...signatures.map((sig, i) => {
          const dateStr = sig.date ? new Date(sig.date).toLocaleString() : 'N/A';
          return createElement(View, { key: i, style: { marginBottom: 8 } },
            createElement(Text, { style: styles.verifyRow },
              createElement(Text, { style: styles.verifyLabel }, `${sig.role === 'signer' ? 'Signer' : 'Countersigner'}: `),
              createElement(Text, {}, `${sig.name} — Signed ${dateStr}`),
            ),
            createElement(Text, { style: { fontSize: 7, color: '#999' } },
              'This electronic signature is the legal equivalent of a manual signature under the ESIGN Act (15 U.S.C. § 7001).'
            ),
          );
        }),
      ),

      // Audit trail
      auditEvents.length > 0 && createElement(View, { style: styles.auditSection },
        createElement(Text, { style: styles.auditTitle }, 'Audit Trail'),
        ...auditEvents.map((event, i) =>
          createElement(Text, { key: i, style: styles.auditRow },
            `${new Date(event.created_at).toLocaleString()} — ${event.event_type} ${event.ip_address ? `(IP: ${event.ip_address})` : ''}`
          )
        ),
      ),
    )
  );
}
