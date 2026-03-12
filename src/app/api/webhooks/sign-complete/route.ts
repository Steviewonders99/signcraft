import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { notifySender } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const { signing_request_id, event } = await request.json();

  const supabase = createServiceClient();
  const { data: sr } = await supabase
    .from('signing_requests')
    .select('*, documents(title)')
    .eq('id', signing_request_id)
    .single();

  if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://signcraft.vercel.app';
  const countersignUrl = event === 'signed'
    ? `${appUrl}/countersign/${sr.countersign_token}`
    : undefined;

  await notifySender({
    senderId: sr.sender_id,
    signerName: sr.signer_name,
    documentTitle: sr.documents.title,
    event,
    countersignUrl,
  });

  return NextResponse.json({ success: true });
}
