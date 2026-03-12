import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getAllTemplates } from '@/lib/template-loader';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = getAllTemplates();
  return NextResponse.json(templates);
}
