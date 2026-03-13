'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, Code, Link2, ExternalLink, Eye } from 'lucide-react';

interface EmbedPanelProps {
  accessToken: string;
  documentTitle: string;
  viewCount?: number;
}

export function EmbedPanel({ accessToken, documentTitle, viewCount }: EmbedPanelProps) {
  const [copied, setCopied] = useState<'url' | 'iframe' | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `${origin}/embed/${accessToken}`;
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:1px solid #e5e7eb;border-radius:8px;"\n  title="${documentTitle}"\n></iframe>`;

  function handleCopy(text: string, type: 'url' | 'iframe') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold">Embed</h3>
      </div>

      {/* View count */}
      {viewCount !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md p-2.5 border border-border/40" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <Eye className="w-3.5 h-3.5" />
          <span>{viewCount} embed view{viewCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Direct URL */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Link2 className="w-3 h-3" /> Direct URL
        </Label>
        <div className="flex items-start gap-1.5">
          <div className="flex-1 p-2 rounded text-[11px] font-mono break-all border border-border/40 leading-relaxed" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            {embedUrl}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => handleCopy(embedUrl, 'url')}>
            {copied === 'url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Iframe code */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Code className="w-3 h-3" /> Embed Code
        </Label>
        <div className="flex items-start gap-1.5">
          <pre className="flex-1 p-2 rounded text-[10px] font-mono break-all border border-border/40 leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            {iframeCode}
          </pre>
          <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => handleCopy(iframeCode, 'iframe')}>
            {copied === 'iframe' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Customization hint */}
      <div className="text-[11px] text-muted-foreground space-y-1.5 border-t border-border/40 pt-4">
        <p className="font-medium text-foreground/70">Customize</p>
        <p>Add query params to style the embed:</p>
        <div className="p-2 rounded font-mono text-[10px] leading-relaxed border border-border/40" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          ?accent=22c55e&amp;bg=1a1a2e
        </div>
        <ul className="space-y-0.5 mt-1">
          <li><code className="text-[10px]">accent</code> — button/link color (hex, no #)</li>
          <li><code className="text-[10px]">bg</code> — background color (hex, no #)</li>
        </ul>
      </div>

      {/* Preview link */}
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Preview embed
      </a>
    </div>
  );
}
