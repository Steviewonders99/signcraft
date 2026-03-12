export interface Template {
  id: string;
  user_id: string;
  name: string;
  content: Record<string, unknown>;
  variables: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  template_id: string | null;
  title: string;
  content: Record<string, unknown>;
  variables_filled: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface SigningRequest {
  id: string;
  document_id: string;
  sender_id: string;
  status: 'sent' | 'viewed' | 'signed' | 'countersigned' | 'complete';
  signer_name: string;
  signer_email: string;
  access_token: string;
  countersign_token: string;
  expires_at: string;
  created_at: string;
}

export interface Signature {
  id: string;
  signing_request_id: string;
  signer_role: 'signer' | 'countersigner';
  signature_data: string;
  ip_address: string;
  user_agent: string;
  geolocation: string | null;
  viewing_duration_sec: number;
  signed_at: string;
}

export type AuditEventType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'countersigned'
  | 'completed'
  | 'downloaded';

export interface AuditEvent {
  id: string;
  signing_request_id: string;
  event_type: AuditEventType;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
}

export interface DocumentWithStatus extends Document {
  signing_request?: SigningRequest;
}
