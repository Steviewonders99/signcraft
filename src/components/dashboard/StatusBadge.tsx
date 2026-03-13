import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  sent: { label: 'Sent', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  viewed: { label: 'Viewed', className: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  signed: { label: 'Signed', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  countersigned: { label: 'Counter', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  complete: { label: 'Complete', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <Badge
      variant="outline"
      className={`min-w-[72px] justify-center text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

export function EmbedBadge() {
  return (
    <Badge
      variant="outline"
      className="min-w-[52px] justify-center text-xs font-medium bg-orange-500/15 text-orange-400 border-orange-500/20"
    >
      Embed
    </Badge>
  );
}
