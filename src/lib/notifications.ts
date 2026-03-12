import { Resend } from 'resend';
import { sendSMS } from './twilio';
import { createServiceClient } from '@/lib/supabase-server';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

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

  const subject = event === 'signed'
    ? `${signerName} signed "${documentTitle}"`
    : `"${documentTitle}" is fully executed`;

  const body = event === 'signed'
    ? `${signerName} has signed "${documentTitle}". ${countersignUrl ? `Countersign here: ${countersignUrl}` : 'Log in to countersign.'}`
    : `"${documentTitle}" has been signed by both parties. Download the PDF from your dashboard.`;

  // Send email
  if (emailEnabled && user.email) {
    await getResend().emails.send({
      from: 'SignCraft <noreply@signcraft.vercel.app>',
      to: user.email,
      subject,
      html: `
        <p>${body}</p>
        ${countersignUrl ? `<p><a href="${countersignUrl}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:white;text-decoration:none;border-radius:8px;">Countersign Now</a></p>` : ''}
      `,
    }).catch(console.error);
  }

  // Send SMS
  if (smsEnabled && phoneNumber) {
    await sendSMS(phoneNumber, `SignCraft: ${subject}`).catch(console.error);
  }
}
