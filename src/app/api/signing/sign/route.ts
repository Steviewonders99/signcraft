import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const { access_token, signature_data, full_name, viewing_duration_sec } =
    await request.json();

  if (!access_token || !signature_data || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find signing request
  const { data: sr } = await supabase
    .from('signing_requests')
    .select('*')
    .eq('access_token', access_token)
    .single();

  if (!sr) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  if (new Date(sr.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }
  if (sr.status !== 'sent' && sr.status !== 'viewed') {
    return NextResponse.json({ error: 'Already signed' }, { status: 409 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Insert signature
  const { error: sigError } = await supabase.from('signatures').insert({
    signing_request_id: sr.id,
    signer_role: 'signer',
    signature_data,
    ip_address: ip,
    user_agent: userAgent,
    viewing_duration_sec: viewing_duration_sec || 0,
  });

  if (sigError) return NextResponse.json({ error: sigError.message }, { status: 500 });

  await logAuditEvent(sr.id, 'signed', ip, { signer_name: full_name, user_agent: userAgent });

  // Check if sender already pre-signed (countersigner signature exists)
  const { data: existingSigs } = await supabase
    .from('signatures')
    .select('id')
    .eq('signing_request_id', sr.id)
    .eq('signer_role', 'countersigner');

  const senderPreSigned = existingSigs && existingSigs.length > 0;

  // Update status — complete if pre-signed, otherwise awaiting countersign
  await supabase
    .from('signing_requests')
    .update({ status: senderPreSigned ? 'complete' : 'signed' })
    .eq('id', sr.id);

  // Notify both parties
  const { notifySender, notifySigner } = await import('@/lib/notifications');
  const { data: doc } = await supabase
    .from('documents')
    .select('title')
    .eq('id', sr.document_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://signcraft.vercel.app';

  // Get sender name for signer confirmation email
  const { data: { user: sender } } = await supabase.auth.admin.getUserById(sr.sender_id);
  const senderName = sender?.user_metadata?.full_name || sender?.email || 'the sender';

  // Send signer their confirmation copy
  notifySigner({
    signerEmail: sr.signer_email,
    signerName: full_name,
    documentTitle: doc?.title || 'Untitled',
    senderName,
  }).catch(console.error);

  if (senderPreSigned) {
    // Both parties have signed — notify sender of completion
    await logAuditEvent(sr.id, 'completed', ip, { pre_signed: true });
    notifySender({
      senderId: sr.sender_id,
      signerName: full_name,
      documentTitle: doc?.title || 'Untitled',
      event: 'completed',
      countersignUrl: `${appUrl}/documents/${sr.document_id}`,
    }).catch(console.error);
  } else {
    // Signer signed, sender still needs to countersign
    notifySender({
      senderId: sr.sender_id,
      signerName: full_name,
      documentTitle: doc?.title || 'Untitled',
      event: 'signed',
      countersignUrl: `${appUrl}/countersign/${sr.countersign_token}`,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, complete: senderPreSigned });
}
