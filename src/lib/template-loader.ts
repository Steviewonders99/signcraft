import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const TEMPLATES_DIR = join(process.cwd(), 'src', 'data', 'legal', 'templates');

export interface BuiltinTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
  source: string;
  variables: string[];
  content: string;
}

let cachedTemplates: BuiltinTemplate[] | null = null;

function loadTemplates(): BuiltinTemplate[] {
  if (cachedTemplates) return cachedTemplates;

  try {
    const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.md'));
    cachedTemplates = files.map((file) => {
      const raw = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug: file.replace('.md', ''),
        name: data.name || file.replace('.md', ''),
        category: data.category || 'General',
        description: data.description || '',
        source: data.source || '',
        variables: data.variables || [],
        content: content.trim(),
      };
    });
    return cachedTemplates;
  } catch (err) {
    console.error('[template-loader] Failed to load templates:', err);
    return [];
  }
}

export function getAllTemplates(): Omit<BuiltinTemplate, 'content'>[] {
  return loadTemplates().map(({ content, ...meta }) => meta);
}

export function getTemplateBySlug(slug: string): BuiltinTemplate | undefined {
  return loadTemplates().find((t) => t.slug === slug);
}

/**
 * Convert template markdown to HTML with variable substitution.
 * Filled variables become plain text. Unfilled variables become <variable-tag> elements.
 */
export function renderTemplate(
  template: BuiltinTemplate,
  variables: Record<string, string>
): string {
  let html = template.content;

  // Replace filled variables with their values, unfilled with <variable-tag>
  html = html.replace(/\{\{([^}]+)\}\}/g, (_, varName: string) => {
    const trimmed = varName.trim();
    const value = variables[trimmed];
    if (value && value.trim()) {
      return value.trim();
    }
    return `<variable-tag name="${trimmed}"></variable-tag>`;
  });

  // Simple markdown-to-HTML conversion for controlled template content
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks: convert double newlines to paragraph/list blocks
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h')) return trimmed;
      if (trimmed === '---') return '<hr>';
      const lines = trimmed.split('\n');
      if (lines.every((l) => l.trim().startsWith('- '))) {
        const items = lines.map((l) => `<li>${l.trim().slice(2)}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
        const items = lines.map((l) => `<li>${l.trim().replace(/^\d+\.\s/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}
