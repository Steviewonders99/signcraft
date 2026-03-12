import type { AuditEvent } from '@/types';
import { Check, Eye, Send, FileText, Download, PenLine } from 'lucide-react';

const EVENT_CONFIG: Record<string, { icon: typeof Check; label: string }> = {
  created: { icon: FileText, label: 'Contract created' },
  sent: { icon: Send, label: 'Sent for signing' },
  viewed: { icon: Eye, label: 'Viewed by signer' },
  signed: { icon: PenLine, label: 'Signed' },
  countersigned: { icon: PenLine, label: 'Countersigned' },
  completed: { icon: Check, label: 'Complete' },
  downloaded: { icon: Download, label: 'PDF downloaded' },
};

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.created;
        const Icon = config.icon;
        const isLast = i === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'hsl(var(--accent) / 0.15)' }}
              >
                <Icon className="w-3 h-3" style={{ color: 'var(--accent-hex)' }} />
              </div>
              {!isLast && <div className="w-px h-6 bg-border" />}
            </div>

            {/* Content */}
            <div className="pb-4">
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
