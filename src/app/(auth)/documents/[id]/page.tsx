'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor, type DocumentEditorHandle } from '@/components/editor/DocumentEditor';
import { AISidebar } from '@/components/editor/AISidebar';
import { AIFab } from '@/components/mobile/AIFab';
import { AIOverlay } from '@/components/mobile/AIOverlay';
import { AuditTrail } from '@/components/signing/AuditTrail';
import { ContractPreview } from '@/components/signing/ContractPreview';
import { EmbedPanel } from '@/components/embed/EmbedPanel';
import { StatusBadge, EmbedBadge } from '@/components/dashboard/StatusBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { Save, Send, Download, Eye, PanelLeftOpen, PanelLeftClose, Copy, Check, Code, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/components/layout/AuthShell';
import type { JSONContent } from '@tiptap/core';
import type { AuditEvent } from '@/types';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const editorRef = useRef<DocumentEditorHandle>(null);
  const { collapsed, toggle: toggleNav } = useSidebar();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent>({});
  const [signingRequest, setSigningRequest] = useState<Record<string, unknown> | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [embedViews, setEmbedViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Send dialog state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [embedMode, setEmbedMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sign_url: string; embed_url: string } | null>(null);
  const [copied, setCopied] = useState<'url' | 'iframe' | null>(null);
  const [sendStep, setSendStep] = useState<'info' | 'sign'>('info');
  const [senderSignature, setSenderSignature] = useState('');

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        // Supabase returns object (not array) for unique FK relations
        const sr = Array.isArray(data.signing_requests)
          ? data.signing_requests[0]
          : data.signing_requests;
        if (sr) {
          setSigningRequest(sr);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (signingRequest) {
      fetch(`/api/audit/${(signingRequest as Record<string, string>).id}`)
        .then((r) => r.json())
        .then((events: AuditEvent[]) => {
          setAuditEvents(events);
          // Count embed views from audit events
          if ((signingRequest as Record<string, boolean>).embed_mode) {
            setEmbedViews(events.filter((e) => e.event_type === 'viewed').length);
          }
        })
        .catch(() => {});
    }
  }, [signingRequest]);

  function extractText(json: JSONContent): string {
    if (!json) return '';
    if (json.text) return json.text;
    if (json.content) return json.content.map(extractText).join('\n');
    return '';
  }

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
    if (!signerName || !signerEmail || !senderSignature) return;
    setSending(true);
    const res = await fetch('/api/signing/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: id,
        signer_name: signerName,
        signer_email: signerEmail,
        embed_mode: embedMode,
        sender_signature_data: senderSignature,
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
  const isEditable = isDraft || status === 'sent' || status === 'viewed';
  const isEmbed = !!(signingRequest && (signingRequest as Record<string, boolean>).embed_mode);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed top bar */}
      <div className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-border shrink-0 flex-wrap" style={{ backgroundColor: 'var(--bg-root)' }}>
        <Button
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleNav}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1 min-w-[200px]"
          readOnly={!isEditable}
        />
        <StatusBadge status={status} />
        {signingRequest && (signingRequest as Record<string, boolean>).embed_mode && <EmbedBadge />}
        {isEditable && (
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
        {isDraft && (
          <>
            <Dialog>
              <DialogTrigger className={buttonVariants()}>
                <Send className="w-4 h-4 mr-2" />
                Send for Signing
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {sendResult ? 'Sent!' : sendStep === 'info' ? 'Send for Signing' : 'Sign as Sender'}
                  </DialogTitle>
                </DialogHeader>
                {sendResult ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {embedMode ? 'Embed ready! Use the code below to add this contract to your site.' : 'Signing request sent!'}
                    </p>
                    {embedMode && (() => {
                      const embedUrl = `${window.location.origin}${sendResult.embed_url}`;
                      const iframeCode = `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border:1px solid #e5e7eb;border-radius:8px;"></iframe>`;

                      function handleCopy(text: string, type: 'url' | 'iframe') {
                        navigator.clipboard.writeText(text);
                        setCopied(type);
                        setTimeout(() => setCopied(null), 2000);
                      }

                      return (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Direct URL</Label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 p-2.5 rounded bg-black/30 text-xs font-mono break-all border border-border/40">
                                {embedUrl}
                              </div>
                              <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleCopy(embedUrl, 'url')}>
                                {copied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                              <Code className="w-3 h-3" /> Embed Code
                            </Label>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 p-2.5 rounded bg-black/30 text-xs font-mono break-all border border-border/40">
                                {iframeCode}
                              </div>
                              <Button variant="outline" size="icon" className="shrink-0 mt-0.5" onClick={() => handleCopy(iframeCode, 'iframe')}>
                                {copied === 'iframe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Customize with query params: <code className="text-[10px] px-1 py-0.5 rounded bg-black/20">?accent=22c55e&amp;bg=1a1a2e</code>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : sendStep === 'info' ? (
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
                    <Button className="w-full" onClick={() => setSendStep('sign')} disabled={!signerName || !signerEmail}>
                      Next: Sign as Sender
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSendStep('info')}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                    <p className="text-sm text-muted-foreground">
                      Pre-sign this document so {signerName || 'the recipient'} only needs to add their signature to complete it.
                    </p>
                    <SignaturePad onChange={setSenderSignature} />
                    <Button
                      className="w-full"
                      onClick={handleSend}
                      disabled={sending || !senderSignature}
                    >
                      {sending ? 'Sending...' : embedMode ? 'Sign & Generate Embed' : 'Sign & Send'}
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

      {/* Editor + sidebar, each scroll independently */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto">
          {isEditable ? (
            <DocumentEditor ref={editorRef} content={content} onChange={setContent} editable />
          ) : (
            <div className="px-4 md:px-8 py-6">
              <ContractPreview content={content} collapsed={false} />
            </div>
          )}
        </div>
        <div className="hidden lg:flex w-80 shrink-0 border-l border-border overflow-hidden flex-col">
          {/* Embed panel + audit trail for sent documents */}
          {signingRequest && (isEmbed || auditEvents.length > 0) && (
            <div className="p-4 space-y-4 border-b border-border overflow-y-auto shrink-0" style={{ backgroundColor: 'var(--bg-card)', maxHeight: isEditable ? '40%' : undefined }}>
              {isEmbed && (
                <EmbedPanel
                  accessToken={(signingRequest as Record<string, string>).access_token}
                  documentTitle={title}
                  viewCount={embedViews}
                />
              )}
              {auditEvents.length > 0 && (
                <>
                  {isEmbed && <div className="border-t border-border/40" />}
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Audit Trail</h3>
                    <AuditTrail events={auditEvents} />
                  </div>
                </>
              )}
            </div>
          )}
          {/* AI sidebar for editable documents */}
          {isEditable && (
            <div className="flex-1 min-h-0">
              <AISidebar
                onInsert={handleInsertContent}
                documentContext={extractText(content)}
                getEditor={() => editorRef.current?.getEditor() ?? null}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile AI */}
      {isEditable && (
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
