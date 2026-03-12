import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase-server';
import { logAuditEvent } from '@/lib/audit';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { document_id, signer_name, signer_email, embed_mode } = await request.json();

  if (!document_id || !signer_name || !signer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify document ownership
  const { data: doc } = await supabase
    .from('documents')
    .select('id, title')
    .eq('id', document_id)
    .eq('user_id', user.id)
    .single();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Generate tokens
  const access_token = randomBytes(16).toString('hex');
  const countersign_token = randomBytes(16).toString('hex');

  const serviceClient = createServiceClient();
  const { data: signingRequest, error } = await serviceClient
    .from('signing_requests')
    .insert({
      document_id,
      sender_id: user.id,
      signer_name,
      signer_email,
      access_token,
      countersign_token,
      status: 'sent',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log audit events
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  await logAuditEvent(signingRequest.id, 'created', ip, { sender_email: user.email });
  await logAuditEvent(signingRequest.id, 'sent', ip, { signer_email, embed_mode: !!embed_mode });

  // Send email (skip if embed mode)
  if (!embed_mode) {
    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://signcraft.vercel.app'}/sign/${access_token}`;
    await resend.emails.send({
      from: 'SignCraft <noreply@signcraft.vercel.app>',
      to: signer_email,
      subject: `${user.email} sent you "${doc.title}" to sign`,
      html: `
        <p>Hi ${signer_name},</p>
        <p>${user.email} has sent you a contract to review and sign.</p>
        <p><a href="${signUrl}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:white;text-decoration:none;border-radius:8px;">Review & Sign</a></p>
        <p>This link expires in 30 days.</p>
      `,
    });
  }

  return NextResponse.json({
    ...signingRequest,
    sign_url: `/sign/${access_token}`,
    embed_url: `/embed/${access_token}`,
  }, { status: 201 });
}
