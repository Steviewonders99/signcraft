'use client';

import { useState, useEffect, useRef } from 'react';
import { ContractPreview } from './ContractPreview';
import { SignaturePad } from './SignaturePad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import type { JSONContent } from '@tiptap/core';
import type { SenderSignatureInfo } from '@/components/signing/ContractPreview';

interface SigningPageProps {
  token: string;
  documentTitle: string;
  senderEmail: string;
  content: JSONContent;
  signerName: string;
  createdAt: string;
  status: string;
  signedAt?: string;
  isEmbed?: boolean;
  senderSignature?: SenderSignatureInfo;
}

export function SigningPage({
  token,
  documentTitle,
  senderEmail,
  content,
  signerName,
  createdAt,
  status,
  signedAt,
  isEmbed = false,
  senderSignature,
}: SigningPageProps) {
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(status !== 'sent' && status !== 'viewed');
  const startTime = useRef(Date.now());

  // View tracking is handled server-side in the sign/[token]/page.tsx server component

  async function handleSign() {
    if (!agreed || !fullName || !signatureData) return;
    setSubmitting(true);

    const viewingDuration = Math.floor((Date.now() - startTime.current) / 1000);

    const res = await fetch('/api/signing/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        signature_data: signatureData,
        full_name: fullName,
        viewing_duration_sec: viewingDuration,
      }),
    });

    if (res.ok) {
      setSigned(true);
    }
    setSubmitting(false);
  }

  if (signed) {
    return (
      <div className={isEmbed ? 'p-6' : 'min-h-screen flex items-center justify-center p-4'} style={{ backgroundColor: isEmbed ? 'transparent' : 'var(--bg-root)' }}>
        <div className={`${isEmbed ? 'py-12' : 'w-full max-w-lg'} text-center`}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.15)' }}>
            <Check className="w-8 h-8" style={{ color: 'var(--accent-hex)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Signed Successfully</h2>
          <p className="text-sm text-muted-foreground">
            {signedAt
              ? `You signed this on ${new Date(signedAt).toLocaleDateString()}`
              : 'A copy will be emailed to you once fully executed.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbed ? 'p-6' : 'min-h-screen flex items-center justify-center p-4'} style={{ backgroundColor: isEmbed ? 'transparent' : 'var(--bg-root)' }}>
      <div className={`${isEmbed ? 'max-w-2xl mx-auto' : 'w-full max-w-[520px]'} space-y-6`}>
        {/* Header */}
        {!isEmbed && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-hex)' }} />
              <span className="text-sm text-muted-foreground">Awaiting Signature</span>
            </div>
            <h1 className="text-xl font-bold">{documentTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              From {senderEmail} · {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Contract */}
        <ContractPreview content={content} collapsed transparent={isEmbed} senderSignature={senderSignature} />

        {/* Agree */}
        <div className={isEmbed ? 'p-4 border-t border-current/10' : 'rounded-lg p-4 border border-border'} style={isEmbed ? undefined : { backgroundColor: 'var(--bg-elevated)' }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-[var(--accent-hex)]"
            />
            <span className="text-sm">
              I, <strong>{signerName}</strong>, agree to the terms outlined in this document and consent to signing electronically.
            </span>
          </label>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label>Full Legal Name</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        {/* Signature */}
        <SignaturePad onChange={setSignatureData} />

        {/* Submit */}
        <Button
          className="w-full py-6 text-base font-semibold"
          disabled={!agreed || !fullName || !signatureData || submitting}
          onClick={handleSign}
        >
          {submitting ? 'Signing...' : 'Sign Document'}
        </Button>

        {/* ESIGN disclaimer */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          By clicking &quot;Sign Document,&quot; you agree that your electronic signature is the legal equivalent of your manual signature under the ESIGN Act (15 U.S.C. &sect; 7001).
        </p>
      </div>
    </div>
  );
}
