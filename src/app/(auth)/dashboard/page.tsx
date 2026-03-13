import { createServerSupabase } from '@/lib/supabase-server';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import { NavToggle } from '@/components/layout/NavToggle';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from('documents')
    .select('*, signing_requests(*)')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  // Supabase returns signing_requests as object (not array) due to unique FK on document_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getSr(d: any) {
    const sr = d.signing_requests;
    if (!sr) return undefined;
    return Array.isArray(sr) ? sr[0] : sr;
  }

  const docs = documents || [];
  const awaitingAction = docs.filter(
    (d) => getSr(d)?.status === 'signed'
  ).length;

  // Count embed signing requests
  const embedCount = docs.filter(
    (d) => getSr(d)?.embed_mode
  ).length;

  // Fetch embed view counts from audit events for embed documents
  const embedSrIds = docs
    .filter((d) => getSr(d)?.embed_mode)
    .map((d) => getSr(d).id);

  let embedViewCounts: Record<string, number> = {};
  if (embedSrIds.length > 0) {
    const { data: viewEvents } = await supabase
      .from('audit_events')
      .select('signing_request_id')
      .in('signing_request_id', embedSrIds)
      .eq('event_type', 'viewed');

    if (viewEvents) {
      for (const event of viewEvents) {
        embedViewCounts[event.signing_request_id] =
          (embedViewCounts[event.signing_request_id] || 0) + 1;
      }
    }
  }

  const stats = [
    { label: 'Total', value: docs.length },
    ...(awaitingAction > 0 ? [{ label: 'Awaiting Action', value: awaitingAction }] : []),
    ...(embedCount > 0 ? [{ label: 'Embeds', value: embedCount }] : []),
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <NavToggle />
          <div>
            <h1 className="text-2xl font-bold">Contracts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(' · ')}
            </p>
          </div>
        </div>
        <DashboardActions />
      </div>

      <DocumentList
        documents={docs.map((d) => {
          const sr = getSr(d);
          return {
            ...d,
            signing_request: sr || undefined,
            embed_views: sr?.embed_mode ? (embedViewCounts[sr.id] || 0) : undefined,
          };
        })}
      />
    </div>
  );
}
