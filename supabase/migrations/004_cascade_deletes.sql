-- Add ON DELETE CASCADE so deleting a document cleans up all related data

-- signing_requests → documents
ALTER TABLE signing_requests
  DROP CONSTRAINT signing_requests_document_id_fkey,
  ADD CONSTRAINT signing_requests_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- signatures → signing_requests
ALTER TABLE signatures
  DROP CONSTRAINT signatures_signing_request_id_fkey,
  ADD CONSTRAINT signatures_signing_request_id_fkey
    FOREIGN KEY (signing_request_id) REFERENCES signing_requests(id) ON DELETE CASCADE;

-- audit_events → signing_requests
ALTER TABLE audit_events
  DROP CONSTRAINT audit_events_signing_request_id_fkey,
  ADD CONSTRAINT audit_events_signing_request_id_fkey
    FOREIGN KEY (signing_request_id) REFERENCES signing_requests(id) ON DELETE CASCADE;
