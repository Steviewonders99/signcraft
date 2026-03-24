import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase-server';
import { logAuditEvent } from '@/lib/audit';
import { sendMail } from '@/lib/mailer';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { document_id, signer_name, signer_email, embed_mode, sender_signature_data } = await request.json();

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
      embed_mode: !!embed_mode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Store sender's pre-signature (countersigner role)
  if (sender_signature_data) {
    const senderName = user.user_metadata?.full_name || user.email || '';
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { error: sigInsertError } = await serviceClient
      .from('signatures')
      .insert({
        signing_request_id: signingRequest.id,
        signer_role: 'countersigner',
        signature_data: sender_signature_data,
        full_name: senderName,
        ip_address: ip,
        user_agent: userAgent,
        signed_at: new Date().toISOString(),
      });
    if (sigInsertError) {
      return NextResponse.json({ error: 'Failed to store sender signature: ' + sigInsertError.message }, { status: 500 });
    }
  }

  // Log audit events
  const auditIp = request.headers.get('x-forwarded-for') || 'unknown';
  await logAuditEvent(signingRequest.id, 'created', auditIp, { sender_email: user.email });
  if (sender_signature_data) {
    await logAuditEvent(signingRequest.id, 'countersigned', auditIp, { pre_signed: true });
  }
  await logAuditEvent(signingRequest.id, 'sent', auditIp, { signer_email, embed_mode: !!embed_mode });

  // Send email (skip if embed mode)
  if (!embed_mode) {
    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://signcraft.vercel.app'}/sign/${access_token}`;
    const senderName = user.user_metadata?.full_name || user.email;
    await sendMail({
      to: signer_email,
      subject: `${senderName} sent you "${doc.title}" to sign`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">You have a document to sign</h2>
          <p style="color:#555;line-height:1.6;">Hi ${signer_name},</p>
          <p style="color:#555;line-height:1.6;"><strong>${senderName}</strong> has sent you <strong>"${doc.title}"</strong> to review and sign electronically.</p>
          <div style="margin:28px 0;">
            <a href="${signUrl}" style="display:inline-block;padding:14px 32px;background:#22c55e;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Review & Sign</a>
          </div>
          <p style="color:#999;font-size:13px;">This link expires in 30 days. If you didn't expect this, you can ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
          <p style="color:#bbb;font-size:11px;">Sent via SignCraft — AI-assisted contract drafting & e-signatures</p>
        </div>
      `,
    }).catch(console.error);
  }

  return NextResponse.json({
    ...signingRequest,
    sign_url: `/sign/${access_token}`,
    embed_url: `/embed/${access_token}`,
  }, { status: 201 });
}
