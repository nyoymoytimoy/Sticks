-- Up

CREATE TABLE ticket_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  has_approval_step BOOLEAN NOT NULL DEFAULT false,
  allows_requestor_choose_assignee BOOLEAN NOT NULL DEFAULT false,
  extension_table VARCHAR(64) NOT NULL
);

-- Shared status vocabulary across every ticket type ("done" means the same
-- thing everywhere); which statuses are *reachable* per type is governed by
-- ticket_type_workflow_transitions, not by this table.
CREATE TABLE ticket_statuses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  label VARCHAR(64) NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(32) NOT NULL UNIQUE,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
  status_id INTEGER NOT NULL REFERENCES ticket_statuses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requestor_id INTEGER NOT NULL REFERENCES users(id),
  approver_id INTEGER REFERENCES users(id),
  current_assignee_id INTEGER REFERENCES users(id),
  priority VARCHAR(16) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  sla_due_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_tickets_status ON tickets(status_id);
CREATE INDEX idx_tickets_type ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_requestor ON tickets(requestor_id);
CREATE INDEX idx_tickets_assignee ON tickets(current_assignee_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- ticket_number sequence formatted as TCK-<year>-<zero-padded seq>, assigned
-- via trigger so callers never have to compute it themselves.
CREATE SEQUENCE ticket_number_seq;

CREATE OR REPLACE FUNCTION set_ticket_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TCK-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('ticket_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
DROP FUNCTION IF EXISTS set_updated_at();
DROP TRIGGER IF EXISTS trg_set_ticket_number ON tickets;
DROP FUNCTION IF EXISTS set_ticket_number();
DROP SEQUENCE IF EXISTS ticket_number_seq;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS ticket_statuses;
DROP TABLE IF EXISTS ticket_types;
