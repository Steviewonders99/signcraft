import { createServiceClient } from '@/lib/supabase-server';
import { SigningPage } from '@/components/signing/SigningPage';
import { logAuditEvent } from '@/lib/audit';
import { headers } from 'next/headers';

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: sr } = await supabase
    .from('signing_requests')
    .select('*, documents(title, content)')
    .eq('access_token', token)
    .single();

  if (!sr) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">This signing link is invalid or has been used.</p>
        </div>
      </div>
    );
  }

  if (new Date(sr.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">This link has expired. Contact the sender for a new one.</p>
        </div>
      </div>
    );
  }

  // Log view event
  if (sr.status === 'sent') {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    await logAuditEvent(sr.id, 'viewed', ip);
    await supabase
      .from('signing_requests')
      .update({ status: 'viewed' })
      .eq('id', sr.id);
  }

  // Fetch sender email
  const { data: { user: sender } } = await supabase.auth.admin.getUserById(sr.sender_id);

  // Check if already signed
  const { data: signatures } = await supabase
    .from('signatures')
    .select('signed_at')
    .eq('signing_request_id', sr.id)
    .eq('signer_role', 'signer')
    .limit(1);

  // Fetch sender's pre-signature for autofilling Party A block
  const { data: senderSig } = await supabase
    .from('signatures')
    .select('signature_data, full_name, signed_at')
    .eq('signing_request_id', sr.id)
    .eq('signer_role', 'countersigner')
    .limit(1)
    .single();

  return (
    <SigningPage
      token={token}
      documentTitle={sr.documents.title}
      senderEmail={sender?.email || ''}
      content={sr.documents.content}
      signerName={sr.signer_name}
      createdAt={sr.created_at}
      status={sr.status}
      signedAt={signatures?.[0]?.signed_at}
      senderSignature={senderSig ? {
        data: senderSig.signature_data,
        name: senderSig.full_name || '',
        date: senderSig.signed_at,
      } : undefined}
    />
  );
}
