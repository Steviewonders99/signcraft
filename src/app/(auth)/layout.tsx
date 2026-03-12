import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { Sidebar } from '@/components/layout/Sidebar';

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

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-root)' }}>
      <Sidebar user={user} />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
