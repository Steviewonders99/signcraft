'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Draft TOS',
  'Payment terms',
  'IP clause',
  'Termination',
  'Non-compete',
  'Review gaps',
];

interface AISidebarProps {
  onInsert: (text: string) => void;
}

export function AISidebar({ onInsert }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(prompt?: string) {
    const text = prompt || input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    const res = await fetch('/api/ai/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    setLoading(false);
  }

  return (
    <div
      className="h-[calc(100vh-140px)] flex flex-col rounded-lg border border-border"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">AI</span>
          <span className="text-sm text-muted-foreground">Draft Assistant</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">OpenRouter</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Ask me to draft clauses, review your contract, or explain terms.
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
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && (
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
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-3">
            <div className="inline-block px-3 py-2 rounded-lg text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS.map((p) => (
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
        <div className="ai-input flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-hex)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask AI to draft..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            className="h-7 w-7 p-0"
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
