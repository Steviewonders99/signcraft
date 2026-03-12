import { createServerSupabase } from '@/lib/supabase-server';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, LayoutTemplate } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from('documents')
    .select('*, signing_requests(*)')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  const docs = documents || [];
  const awaitingAction = docs.filter(
    (d) => d.signing_requests?.[0]?.status === 'signed'
  ).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {docs.length} total{awaitingAction > 0 ? ` · ${awaitingAction} awaiting action` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/templates">
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="w-4 h-4 mr-2" />
              New Contract
            </Link>
          </Button>
        </div>
      </div>

      <DocumentList
        documents={docs.map((d) => ({
          ...d,
          signing_request: d.signing_requests?.[0] || undefined,
        }))}
      />
    </div>
  );
}
