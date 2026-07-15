-- Up Migration

-- This is HOW the Leiva/Rudy restriction is data-driven instead of a
-- hardcoded string/name comparison in application code: a row here says
-- "for this ticket_type + workflow_step, the ONLY authorized actor is this
-- user_id". The workflow engine checks this table before falling back to a
-- generic role check. If Leiva or Rudy ever leave the company, ops updates
-- one row here -- no code change or deploy required.
CREATE TABLE workflow_assignments (
  id SERIAL PRIMARY KEY,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
  workflow_step VARCHAR(32) NOT NULL CHECK (workflow_step IN ('approver', 'admin')),
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_exclusive BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  UNIQUE (ticket_type_id, workflow_step, user_id)
);

-- A temporary delegate for an exclusive assignee (e.g. Leiva names a
-- delegate while on leave). The authorization check passes if the actor is
-- the assigned user OR their active delegate for the date range -- the
-- restriction stays "Leiva-or-her-explicit-delegate", never "any approver".
CREATE TABLE approver_delegations (
  id SERIAL PRIMARY KEY,
  workflow_assignment_id INTEGER NOT NULL REFERENCES workflow_assignments(id) ON DELETE CASCADE,
  delegate_user_id INTEGER NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_approver_delegations_lookup
  ON approver_delegations(workflow_assignment_id, start_date, end_date);

-- The declarative state machine: which (from_status, action) transitions
-- are legal for which ticket type, who's authorized (role fallback -- the
-- exclusive-assignment check above takes precedence when a row exists in
-- workflow_assignments for this type+step), and who gets notified.
CREATE TABLE ticket_type_workflow_transitions (
  id SERIAL PRIMARY KEY,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
  from_status_id INTEGER NOT NULL REFERENCES ticket_statuses(id),
  to_status_id INTEGER NOT NULL REFERENCES ticket_statuses(id),
  action_code VARCHAR(32) NOT NULL,
  -- Which workflow_assignments step (if any) governs authorization for this
  -- transition; NULL means "no exclusive assignment applies, use role fallback".
  workflow_step VARCHAR(32) CHECK (workflow_step IN ('approver', 'admin')),
  -- Generic role fallback used when no exclusive workflow_assignments row
  -- exists for this type+step (e.g. BCP: any 'admin' role holder).
  allowed_role_code VARCHAR(32),
  requires_note BOOLEAN NOT NULL DEFAULT false,
  notify_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (ticket_type_id, from_status_id, action_code)
);

-- Down Migration

DROP TABLE IF EXISTS ticket_type_workflow_transitions;
DROP TABLE IF EXISTS approver_delegations;
DROP TABLE IF EXISTS workflow_assignments;
