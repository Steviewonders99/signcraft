import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { queryAI } from '@/lib/openrouter';
import { validateReviewContext, type AIMode } from '@/lib/legal-knowledge';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, context, mode = 'draft' } = await request.json();
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  // Validate mode
  const validModes: AIMode[] = ['draft', 'review', 'explain'];
  const aiMode: AIMode = validModes.includes(mode) ? mode : 'draft';

  // Validate review context length
  if (aiMode === 'review' && context) {
    const error = validateReviewContext(context);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const response = await queryAI(prompt, context, aiMode);
  return NextResponse.json({ response });
}
