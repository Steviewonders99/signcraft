import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase-server';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { countersign_token, signature_data } = await request.json();

  if (!countersign_token || !signature_data) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Verify token + ownership
  const { data: sr } = await serviceClient
    .from('signing_requests')
    .select('*')
    .eq('countersign_token', countersign_token)
    .eq('sender_id', user.id)
    .single();

  if (!sr) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  if (sr.status !== 'signed') {
    return NextResponse.json({ error: 'Cannot countersign at this stage' }, { status: 409 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Insert countersignature
  const { error: sigError } = await serviceClient.from('signatures').insert({
    signing_request_id: sr.id,
    signer_role: 'countersigner',
    signature_data,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (sigError) return NextResponse.json({ error: sigError.message }, { status: 500 });

  // Update to complete
  await serviceClient
    .from('signing_requests')
    .update({ status: 'complete' })
    .eq('id', sr.id);

  await logAuditEvent(sr.id, 'countersigned', ip, { user_agent: userAgent });
  await logAuditEvent(sr.id, 'completed', ip);

  // Notify sender directly
  const { notifySender } = await import('@/lib/notifications');
  const { data: doc } = await serviceClient
    .from('documents')
    .select('title')
    .eq('id', sr.document_id)
    .single();

  notifySender({
    senderId: sr.sender_id,
    signerName: sr.signer_name,
    documentTitle: doc?.title || 'Untitled',
    event: 'completed',
  }).catch(console.error);

  return NextResponse.json({ success: true });
}
