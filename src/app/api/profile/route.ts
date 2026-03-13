import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json(data || {
    full_name: '',
    company_name: '',
    company_address: '',
    company_website: '',
    services: [],
    accent_color: '#22c55e',
    theme: 'dark',
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      full_name: body.full_name || null,
      company_name: body.company_name || null,
      company_address: body.company_address || null,
      company_website: body.company_website || null,
      services: Array.isArray(body.services) ? body.services : [],
      accent_color: body.accent_color || '#22c55e',
      theme: body.theme === 'light' ? 'light' : 'dark',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
