import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { queryAI } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, context } = await request.json();
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const response = await queryAI(prompt, context);
  return NextResponse.json({ response });
}
