'use client';

import { useEffect, useState, use } from 'react';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { ContractPreview } from '@/components/signing/ContractPreview';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function CountersignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<{ title: string; content: Record<string, unknown> } | null>(null);
  const [signatureData, setSignatureData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch document details via the countersign token
    fetch(`/api/documents?countersign_token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDocument(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load document');
        setLoading(false);
      });
  }, [token]);

  async function handleCountersign() {
    if (!signatureData) return;
    setSubmitting(true);

    const res = await fetch('/api/signing/countersign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countersign_token: token, signature_data: signatureData }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to countersign');
    }
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}><p className="text-muted-foreground">Loading...</p></div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
      <p className="text-red-400">{error}</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.15)' }}>
          <Check className="w-8 h-8" style={{ color: 'var(--accent-hex)' }} />
        </div>
        <h2 className="text-xl font-bold mb-2">Contract Complete</h2>
        <p className="text-sm text-muted-foreground">Both parties have signed. PDF available in your dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-root)' }}>
      <div className="w-full max-w-[520px] space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Countersign: {document?.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and add your signature to complete the contract.</p>
        </div>

        {document && <ContractPreview content={document.content} collapsed />}

        <SignaturePad onChange={setSignatureData} />

        <Button
          className="w-full py-6 text-base font-semibold"
          disabled={!signatureData || submitting}
          onClick={handleCountersign}
        >
          {submitting ? 'Signing...' : 'Countersign & Complete'}
        </Button>
      </div>
    </div>
  );
}
