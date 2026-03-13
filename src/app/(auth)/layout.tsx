import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { AuthShell } from '@/components/layout/AuthShell';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <AuthShell user={user}>{children}</AuthShell>;
}
