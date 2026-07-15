-- Up Migration

-- The audit trail. Every status/assignment/tag change is logged here,
-- written by the application inside the same transaction as the change --
-- see the AFTER UPDATE trigger below for a defense-in-depth fallback that
-- catches any bypass of the shared workflow engine (a manual psql fix, a
-- forgotten call site).
CREATE TABLE ticket_audit_log (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  from_value TEXT,
  to_value TEXT,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ticket_audit_log_ticket ON ticket_audit_log(ticket_id, occurred_at);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE ticket_tags (
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  applied_by_user_id INTEGER REFERENCES users(id),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, tag_id)
);

-- Defense-in-depth fallback: if a ticket's status changes without a
-- matching audit row already having been written in the same statement (the
-- primary, application-level mechanism), insert a minimal fallback row
-- rather than silently losing the audit trail.
CREATE OR REPLACE FUNCTION fallback_audit_ticket_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM ticket_audit_log
      WHERE ticket_id = NEW.id
        AND event_type = 'status_change'
        AND occurred_at >= statement_timestamp() - interval '5 seconds'
    ) THEN
      INSERT INTO ticket_audit_log (ticket_id, event_type, from_value, to_value, note)
      VALUES (NEW.id, 'status_change', OLD.status_id::text, NEW.status_id::text,
        'Fallback audit entry: status changed without an application-level audit write.');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_fallback_audit
  AFTER UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION fallback_audit_ticket_status_change();

-- Down Migration

DROP TRIGGER IF EXISTS trg_tickets_fallback_audit ON tickets;
DROP FUNCTION IF EXISTS fallback_audit_ticket_status_change();
DROP TABLE IF EXISTS ticket_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS ticket_audit_log;
