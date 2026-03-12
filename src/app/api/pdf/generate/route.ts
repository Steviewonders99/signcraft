import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase-server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPdf } from '@/lib/pdf';
import { logAuditEvent } from '@/lib/audit';
import { createElement } from 'react';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { signing_request_id } = await request.json();
  const serviceClient = createServiceClient();

  // Fetch all data
  const { data: sr } = await serviceClient
    .from('signing_requests')
    .select('*, documents(title, content)')
    .eq('id', signing_request_id)
    .eq('sender_id', user.id)
    .single();

  if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: signatures } = await serviceClient
    .from('signatures')
    .select('*')
    .eq('signing_request_id', sr.id);

  const { data: auditEvents } = await serviceClient
    .from('audit_events')
    .select('*')
    .eq('signing_request_id', sr.id)
    .order('created_at', { ascending: true });

  // Extract text content from TipTap JSON
  function extractText(node: Record<string, unknown>): string {
    if (node.text) return node.text as string;
    if (node.content && Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[]).map(extractText).join('');
    }
    return '';
  }
  const contentText = extractText(sr.documents.content);

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    createElement(ContractPdf, {
      title: sr.documents.title,
      contentText,
      signatures: (signatures || []).map((s) => ({
        role: s.signer_role,
        data: s.signature_data,
        date: s.signed_at,
      })),
      auditEvents: auditEvents || [],
    })
  );

  // Upload to Supabase Storage
  const fileName = `${user!.id}/${sr.id}/${Date.now()}.pdf`;
  await serviceClient.storage
    .from('signed-contracts')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  await logAuditEvent(sr.id, 'downloaded', ip);

  // Return PDF as download
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sr.documents.title}.pdf"`,
    },
  });
}
