import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getTemplateBySlug, renderTemplate } from '@/lib/template-loader';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const { variables = {} } = await request.json();
  const html = renderTemplate(template, variables);

  return NextResponse.json({ html, template: { ...template, content: undefined } });
}
