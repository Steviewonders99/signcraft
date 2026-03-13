import { marked } from 'marked';

// Configure marked for clean HTML output (no extra wrapping)
marked.setOptions({ gfm: true, breaks: false });

/**
 * Convert markdown text to HTML suitable for TipTap ingestion.
 * Handles headings, bold/italic, lists, tables, horizontal rules, etc.
 */
export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
