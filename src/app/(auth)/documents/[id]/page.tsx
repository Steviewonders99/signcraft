'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { AISidebar } from '@/components/editor/AISidebar';
import { AIFab } from '@/components/mobile/AIFab';
import { AIOverlay } from '@/components/mobile/AIOverlay';
import { AuditTrail } from '@/components/signing/AuditTrail';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Send, Download, Eye } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';
import type { AuditEvent } from '@/types';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent>({});
  const [signingRequest, setSigningRequest] = useState<Record<string, unknown> | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Send dialog state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [embedMode, setEmbedMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sign_url: string; embed_url: string } | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        if (data.signing_requests?.[0]) {
          setSigningRequest(data.signing_requests[0]);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (signingRequest) {
      fetch(`/api/audit/${(signingRequest as Record<string, string>).id}`)
        .then((r) => r.json())
        .then(setAuditEvents)
        .catch(() => {});
    }
  }, [signingRequest]);

  const handleInsertContent = (text: string) => {
    setContent((prev) => ({
      type: 'doc',
      content: [
        ...(prev.content || []),
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ],
    }));
  };

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
  }

  async function handleSend() {
    if (!signerName || !signerEmail) return;
    setSending(true);
    const res = await fetch('/api/signing/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: id,
        signer_name: signerName,
        signer_email: signerEmail,
        embed_mode: embedMode,
      }),
    });
    const data = await res.json();
    setSendResult(data);
    setSigningRequest(data);
    setSending(false);
  }

  async function handleDownloadPdf() {
    if (!signingRequest) return;
    const res = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signing_request_id: (signingRequest as Record<string, string>).id }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-muted-foreground text-center py-12">Loading...</p>;

  const status = signingRequest ? (signingRequest as Record<string, string>).status : 'draft';
  const isDraft = !signingRequest;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1 min-w-[200px]"
          readOnly={!isDraft}
        />
        <StatusBadge status={status} />
        {isDraft && (
          <>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Dialog>
              <DialogTrigger>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send for Signing</DialogTitle>
                </DialogHeader>
                {sendResult ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {embedMode ? 'Embed URL generated.' : 'Signing request sent!'}
                    </p>
                    {embedMode && (
                      <div className="p-3 rounded bg-black/30 text-xs font-mono break-all">
                        {`${window.location.origin}${sendResult.embed_url}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Recipient Name</Label>
                      <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Email</Label>
                      <Input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder="john@example.com" type="email" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={embedMode} onChange={(e) => setEmbedMode(e.target.checked)} />
                      <span className="text-sm">Pitch Deck Embed (no email sent)</span>
                    </label>
                    <Button className="w-full" onClick={handleSend} disabled={sending || !signerName || !signerEmail}>
                      {sending ? 'Sending...' : embedMode ? 'Generate Embed URL' : 'Send'}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
        {!isDraft && (
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Editor + sidebar */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <DocumentEditor content={content} onChange={setContent} editable={isDraft} />
        </div>
        {isDraft ? (
          <div className="hidden lg:block w-80 shrink-0">
            <AISidebar onInsert={handleInsertContent} />
          </div>
        ) : auditEvents.length > 0 ? (
          <div className="hidden lg:block w-80 shrink-0">
            <div className="rounded-lg border border-border p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
              <h3 className="text-sm font-semibold mb-4">Audit Trail</h3>
              <AuditTrail events={auditEvents} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile AI */}
      {isDraft && (
        <div className="lg:hidden">
          <AIFab onClick={() => setShowAI(true)} />
          <AIOverlay
            open={showAI}
            onClose={() => setShowAI(false)}
            onInsert={handleInsertContent}
          />
        </div>
      )}
    </div>
  );
}
