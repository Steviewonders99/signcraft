import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const transporter = createTransporter();
  if (!transporter) {
    console.error('[mailer] GMAIL_USER or GMAIL_APP_PASSWORD not configured — cannot send email to:', to, 'subject:', subject);
    throw new Error('Email not configured: GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required');
  }
  const from = `SignCraft <${process.env.GMAIL_USER}>`;
  await transporter.sendMail({ from, to, subject, html });
}
