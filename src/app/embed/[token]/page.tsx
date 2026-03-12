import { createServiceClient } from '@/lib/supabase-server';
import { ChromelessSign } from '@/components/embed/ChromelessSign';
import { logAuditEvent } from '@/lib/audit';
import { headers } from 'next/headers';

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accent?: string; bg?: string; font?: string; radius?: string }>;
}) {
  const { token } = await params;
  const { accent, bg } = await searchParams;
  const supabase = createServiceClient();

  const { data: sr } = await supabase
    .from('signing_requests')
    .select('*, documents(title, content)')
    .eq('access_token', token)
    .single();

  if (!sr || new Date(sr.expires_at) < new Date()) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">This contract is no longer available.</p>
      </div>
    );
  }

  // Log view
  if (sr.status === 'sent') {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    await logAuditEvent(sr.id, 'viewed', ip, { embed: true });
    await supabase
      .from('signing_requests')
      .update({ status: 'viewed' })
      .eq('id', sr.id);
  }

  const { data: signatures } = await supabase
    .from('signatures')
    .select('signed_at')
    .eq('signing_request_id', sr.id)
    .eq('signer_role', 'signer')
    .limit(1);

  return (
    <ChromelessSign
      token={token}
      documentTitle={sr.documents.title}
      content={sr.documents.content}
      signerName={sr.signer_name}
      createdAt={sr.created_at}
      status={sr.status}
      signedAt={signatures?.[0]?.signed_at}
      accentHex={accent}
      bgColor={bg ? `#${bg}` : undefined}
    />
  );
}
