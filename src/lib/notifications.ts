import { sendMail } from './mailer';
import { sendSMS } from './twilio';
import { createServiceClient } from '@/lib/supabase-server';

interface NotifyParams {
  senderId: string;
  signerName: string;
  documentTitle: string;
  event: 'signed' | 'completed';
  countersignUrl?: string;
}

export async function notifySender({ senderId, signerName, documentTitle, event, countersignUrl }: NotifyParams) {
  const supabase = createServiceClient();

  // Get sender info
  const { data: { user } } = await supabase.auth.admin.getUserById(senderId);
  if (!user) return;

  // Get notification preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', senderId)
    .single();

  const emailEnabled = prefs?.email_enabled ?? true;
  const smsEnabled = prefs?.sms_enabled ?? false;
  const phoneNumber = prefs?.phone_number;

  const isComplete = event === 'completed';
  const subject = isComplete
    ? `"${documentTitle}" is fully executed`
    : `${signerName} signed "${documentTitle}"`;

  // Send email
  if (emailEnabled && user.email) {
    const ctaUrl = countersignUrl || '';
    const ctaLabel = isComplete ? 'View Document' : 'Countersign Now';
    const headline = isComplete
      ? 'Contract fully executed'
      : `${signerName} signed your document`;
    const body = isComplete
      ? `<strong>"${documentTitle}"</strong> has been signed by both parties. You can now download the completed PDF from your dashboard.`
      : `<strong>${signerName}</strong> has signed <strong>"${documentTitle}"</strong>. ${countersignUrl ? 'Please review and add your countersignature.' : 'Log in to your dashboard to countersign.'}`;

    await sendMail({
      to: user.email,
      subject,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">${headline}</h2>
          <p style="color:#555;line-height:1.6;">${body}</p>
          ${ctaUrl ? `
          <div style="margin:28px 0;">
            <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:#22c55e;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${ctaLabel}</a>
          </div>
          ` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
          <p style="color:#bbb;font-size:11px;">Sent via SignCraft — AI-assisted contract drafting & e-signatures</p>
        </div>
      `,
    }).catch(console.error);
  }

  // Send SMS
  if (smsEnabled && phoneNumber) {
    await sendSMS(phoneNumber, `SignCraft: ${subject}`).catch(console.error);
  }
}

/** Send the signer a confirmation copy after they sign */
export async function notifySigner({ signerEmail, signerName, documentTitle, senderName }: {
  signerEmail: string;
  signerName: string;
  documentTitle: string;
  senderName: string;
}) {
  await sendMail({
    to: signerEmail,
    subject: `You signed "${documentTitle}"`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 0;">
        <h2 style="font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Signature confirmed</h2>
        <p style="color:#555;line-height:1.6;">Hi ${signerName},</p>
        <p style="color:#555;line-height:1.6;">This confirms that you electronically signed <strong>"${documentTitle}"</strong> sent by <strong>${senderName}</strong>.</p>
        <p style="color:#555;line-height:1.6;">A fully executed copy will be available once all parties have signed.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="color:#bbb;font-size:11px;">This electronic signature is the legal equivalent of a manual signature under the ESIGN Act (15 U.S.C. § 7001).</p>
        <p style="color:#bbb;font-size:11px;">Sent via SignCraft — AI-assisted contract drafting & e-signatures</p>
      </div>
    `,
  }).catch(console.error);
}
