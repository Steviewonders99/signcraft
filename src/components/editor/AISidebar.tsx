'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus, PenLine, Search, HelpCircle, Pencil, Check, X } from 'lucide-react';
import type { Editor } from '@tiptap/core';

type AIMode = 'draft' | 'review' | 'explain' | 'edit';

interface ReviewSection {
  name: string;
  flag: 'green' | 'yellow' | 'red';
  assessment: string;
  suggestion?: string;
}

interface ReviewResponse {
  sections: ReviewSection[];
  summary: string;
}

interface EditOperation {
  search: string;
  replace: string;
}

interface EditResponse {
  edits: EditOperation[];
  summary: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: AIMode;
  review?: ReviewResponse;
  editResponse?: EditResponse;
  editsApplied?: boolean;
}

const MODE_CONFIG = {
  draft: { label: 'Draft', icon: PenLine },
  edit: { label: 'Edit', icon: Pencil },
  review: { label: 'Review', icon: Search },
  explain: { label: 'Explain', icon: HelpCircle },
} as const;

const QUICK_PROMPTS: Record<AIMode, string[]> = {
  draft: ['Draft NDA', 'Draft TOS', 'Payment clause', 'IP clause', 'Termination clause', 'Non-compete'],
  edit: ['Make indemnification mutual', 'Strengthen confidentiality', 'Add termination for convenience', 'Soften non-compete'],
  review: ['Review this contract', 'Check for missing clauses', 'Flag risky terms'],
  explain: ['What is indemnification?', 'Explain limitation of liability', 'What is force majeure?'],
};

const FLAG_COLORS = {
  green: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' },
  yellow: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', text: '#eab308' },
  red: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' },
};

interface AISidebarProps {
  onInsert: (text: string) => void;
  documentContext?: string;
  getEditor?: () => Editor | null;
}

export function AISidebar({ onInsert, documentContext, getEditor }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('draft');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function tryParseReview(content: string): ReviewResponse | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"sections"[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.sections && Array.isArray(parsed.sections)) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  function tryParseEdit(content: string): EditResponse | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"edits"[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.edits && Array.isArray(parsed.edits)) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  function applyEdits(edits: EditOperation[], msgIndex: number) {
    const editor = getEditor?.();
    if (!editor) return;

    let applied = 0;

    for (const edit of edits) {
      // Search within each textblock (paragraph, heading) for reliable position mapping
      let found = false;
      editor.state.doc.descendants((node, pos) => {
        if (found) return false;
        if (!node.isTextblock) return true;

        const blockText = node.textContent;
        const idx = blockText.indexOf(edit.search);
        if (idx === -1) return true;

        // Map text offset within this block to ProseMirror positions
        // pos is the block node position, content starts at pos+1
        let textOffset = 0;
        let from = -1;
        let to = -1;
        const searchEnd = idx + edit.search.length;

        node.forEach((child, childOffset) => {
          if (from !== -1 && to !== -1) return;
          if (child.isText && child.text) {
            const start = textOffset;
            const end = textOffset + child.text.length;

            if (from === -1 && idx >= start && idx < end) {
              from = pos + 1 + childOffset + (idx - start);
            }
            if (from !== -1 && to === -1 && searchEnd > start && searchEnd <= end) {
              to = pos + 1 + childOffset + (searchEnd - start);
            }

            textOffset = end;
          }
        });

        if (from !== -1 && to !== -1) {
          editor.chain().focus()
            .insertContentAt({ from, to }, edit.replace)
            .run();
          applied++;
          found = true;
        }

        return false;
      });
    }

    if (applied > 0) {
      setMessages((prev) =>
        prev.map((m, i) => i === msgIndex ? { ...m, editsApplied: true } : m)
      );
    }
  }

  async function handleSend(prompt?: string) {
    const text = prompt || input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text, mode }]);
    setLoading(true);

    const body: Record<string, string> = { prompt: text, mode };
    if (documentContext) {
      body.context = documentContext;
    }

    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error, mode }]);
        setLoading(false);
        return;
      }

      const content = data.response;
      const review = mode === 'review' ? tryParseReview(content) : null;
      const editResponse = mode === 'edit' ? tryParseEdit(content) : null;

      // Auto-apply edits immediately
      if (editResponse && editResponse.edits.length > 0) {
        const editor = getEditor?.();
        if (editor) {
          let applied = 0;
          for (const edit of editResponse.edits) {
            let found = false;
            editor.state.doc.descendants((node, pos) => {
              if (found) return false;
              if (!node.isTextblock) return true;
              const blockText = node.textContent;
              const idx = blockText.indexOf(edit.search);
              if (idx === -1) return true;
              let textOffset = 0;
              let from = -1;
              let to = -1;
              const searchEnd = idx + edit.search.length;
              node.forEach((child, childOffset) => {
                if (from !== -1 && to !== -1) return;
                if (child.isText && child.text) {
                  const start = textOffset;
                  const end = textOffset + child.text.length;
                  if (from === -1 && idx >= start && idx < end) {
                    from = pos + 1 + childOffset + (idx - start);
                  }
                  if (from !== -1 && to === -1 && searchEnd > start && searchEnd <= end) {
                    to = pos + 1 + childOffset + (searchEnd - start);
                  }
                  textOffset = end;
                }
              });
              if (from !== -1 && to !== -1) {
                editor.chain().focus().insertContentAt({ from, to }, edit.replace).run();
                applied++;
                found = true;
              }
              return false;
            });
          }
        }
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content,
        mode,
        review: review || undefined,
        editResponse: editResponse ? { ...editResponse } : undefined,
        editsApplied: editResponse && editResponse.edits.length > 0 ? true : undefined,
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to reach AI service. Please try again.', mode }]);
    } finally {
      setLoading(false);
    }
  }

  function renderReview(review: ReviewResponse) {
    return (
      <div className="space-y-2">
        {review.sections.map((section, i) => {
          const colors = FLAG_COLORS[section.flag];
          return (
            <div
              key={i}
              className="rounded-md px-3 py-2 text-xs"
              style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.text }}
                />
                <span className="font-medium" style={{ color: colors.text }}>
                  {section.flag.toUpperCase()}
                </span>
                <span className="text-foreground font-medium">{section.name}</span>
              </div>
              <p className="text-muted-foreground">{section.assessment}</p>
              {section.suggestion && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <p className="text-foreground italic">{section.suggestion}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-5 text-[10px] px-1.5"
                    onClick={() => onInsert(section.suggestion!)}
                    style={{ color: 'var(--accent-hex)' }}
                  >
                    <Plus className="w-2.5 h-2.5 mr-0.5" />
                    Insert suggestion
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {review.summary && (
          <p className="text-xs text-muted-foreground mt-2 italic">{review.summary}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Header with mode switcher */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">AI</span>
          <span className="text-sm text-muted-foreground">Legal Assistant</span>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-root)' }}>
          {(Object.keys(MODE_CONFIG) as AIMode[]).map((m) => {
            const { label, icon: Icon } = MODE_CONFIG[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={active ? { backgroundColor: 'var(--bg-elevated)' } : undefined}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {mode === 'draft' && 'Ask me to draft clauses or contract sections.'}
            {mode === 'edit' && 'Tell me what to change — I\'ll edit the document directly.'}
            {mode === 'review' && 'I\'ll review your contract clause by clause.'}
            {mode === 'explain' && 'Ask me about any legal term or concept.'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-[90%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-white/5 text-foreground'
                  : 'border-l-2 text-foreground'
              }`}
              style={msg.role === 'assistant' ? { borderLeftColor: 'var(--accent-hex)' } : undefined}
            >
              {msg.review ? (
                renderReview(msg.review)
              ) : msg.editResponse ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground italic">{msg.editResponse.summary}</p>
                  {msg.editResponse.edits.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.editResponse.edits.map((edit, j) => (
                        <div key={j} className="rounded-md px-2.5 py-2 text-xs" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div className="text-red-400/80 line-through mb-1 truncate" title={edit.search}>
                            {edit.search.slice(0, 80)}{edit.search.length > 80 ? '...' : ''}
                          </div>
                          <div className="text-green-400/80 truncate" title={edit.replace}>
                            {edit.replace.slice(0, 80)}{edit.replace.length > 80 ? '...' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.editResponse.edits.length > 0 && !msg.editsApplied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 text-xs"
                      onClick={() => applyEdits(msg.editResponse!.edits, i)}
                      style={{ color: 'var(--accent-hex)' }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Apply {msg.editResponse.edits.length} edit{msg.editResponse.edits.length > 1 ? 's' : ''} to document
                    </Button>
                  )}
                  {msg.editsApplied && (
                    <p className="text-xs mt-1" style={{ color: 'var(--accent-hex)' }}>
                      <Check className="w-3 h-3 inline mr-1" />
                      Edits applied
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.mode !== 'review' && msg.mode !== 'edit' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 text-xs"
                      onClick={() => onInsert(msg.content)}
                      style={{ color: 'var(--accent-hex)' }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Insert into editor
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-3">
            <div className="inline-block px-3 py-2 rounded-lg text-sm text-muted-foreground">
              {mode === 'review' ? 'Reviewing contract...' : mode === 'edit' ? 'Finding and editing...' : 'Thinking...'}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS[mode].map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="ai-input flex items-end gap-2 rounded-lg border border-border px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-hex)]">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              mode === 'draft' ? 'Ask AI to draft...' :
              mode === 'edit' ? 'e.g. Make the NDA mutual...' :
              mode === 'review' ? 'Ask AI to review...' :
              'Ask about a legal term...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none leading-snug"
            style={{ maxHeight: '120px' }}
          />
          <Button
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
