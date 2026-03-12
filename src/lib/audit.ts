import { createServiceClient } from '@/lib/supabase-server';
import type { AuditEventType } from '@/types';

export async function logAuditEvent(
  signingRequestId: string,
  eventType: AuditEventType,
  ipAddress: string | null,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createServiceClient();
  await supabase.from('audit_events').insert({
    signing_request_id: signingRequestId,
    event_type: eventType,
    ip_address: ipAddress,
    metadata,
  });
}
