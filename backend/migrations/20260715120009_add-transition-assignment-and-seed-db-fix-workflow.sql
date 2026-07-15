-- Up Migration

-- Some transitions hand a ticket off to a new exclusive assignee (e.g.
-- approving a Database Fix Request hands it to the exclusive admin, Rudy).
-- Naming *which step* to resolve keeps this data-driven -- the engine looks
-- up whoever currently holds that step's workflow_assignments row, rather
-- than a status-specific code branch.
ALTER TABLE ticket_type_workflow_transitions
  ADD COLUMN assigns_to_step VARCHAR(32) CHECK (assigns_to_step IN ('approver', 'admin'));

-- This is the row that actually turns on "only Leiva can approve Database
-- Fix Requests" -- see migrations 20260715120004 and 003's schema doc for
-- why this is a data row, not a hardcoded name check.
INSERT INTO workflow_assignments (ticket_type_id, workflow_step, user_id, is_exclusive)
SELECT tt.id, 'approver', u.id, true
  FROM ticket_types tt, users u
 WHERE tt.code = 'database_fix_request' AND u.email = 'lmorente@standard-insurance.com';

INSERT INTO workflow_assignments (ticket_type_id, workflow_step, user_id, is_exclusive)
SELECT tt.id, 'admin', u.id, true
  FROM ticket_types tt, users u
 WHERE tt.code = 'database_fix_request' AND u.email = 'rmanlapig@standard-insurance.com';

-- Database Fix Request's full transition graph (see docs/specs/008 for the
-- state diagram in prose). notify_spec's "relations" resolve against the
-- ticket's own requestor_id/approver_id/current_assignee_id columns;
-- "exclusive_step" resolves whoever currently holds that workflow step.
INSERT INTO ticket_type_workflow_transitions
  (ticket_type_id, from_status_id, to_status_id, action_code, workflow_step, assigns_to_step, requires_note, notify_spec)
SELECT tt.id, fs.id, ts.id, action_code, workflow_step, assigns_to_step, requires_note, notify_spec::jsonb
FROM ticket_types tt
CROSS JOIN (VALUES
  ('pending_approval', 'approved',      'approve',            'approver', 'admin', false, '{"exclusive_step":"admin"}'),
  ('pending_approval', 'sent_back',     'send_back',          'approver', NULL,    false, '{"relations":["requestor"]}'),
  ('pending_approval', 'declined',      'decline',            'approver', NULL,    true,  '{"relations":["requestor"]}'),
  ('sent_back',        'pending_approval','resubmit',         NULL,       NULL,    false, '{"exclusive_step":"approver"}'),
  ('approved',         'in_progress',   'start',              'admin',    NULL,    false, '{"relations":["requestor","approver"]}'),
  ('in_progress',      'done',          'complete',           'admin',    NULL,    false, '{"relations":["requestor","approver"]}'),
  ('in_progress',      'for_discussion','request_discussion', 'admin',    NULL,    false, '{"relations":["approver"]}'),
  ('for_discussion',   'in_progress',   'resume',             'admin',    NULL,    false, '{"relations":["requestor","approver"]}'),
  ('in_progress',      'declined',      'decline',            'admin',    NULL,    true,  '{"relations":["requestor","approver"]}'),
  ('done',             'in_progress',   'reopen',             NULL,       NULL,    true,  '{"relations":["requestor","approver"]}')
) AS t(from_code, to_code, action_code, workflow_step, assigns_to_step, requires_note, notify_spec)
JOIN ticket_statuses fs ON fs.code = t.from_code
JOIN ticket_statuses ts ON ts.code = t.to_code
WHERE tt.code = 'database_fix_request';

-- Down Migration

DELETE FROM ticket_type_workflow_transitions
 WHERE ticket_type_id = (SELECT id FROM ticket_types WHERE code = 'database_fix_request');

DELETE FROM workflow_assignments
 WHERE ticket_type_id = (SELECT id FROM ticket_types WHERE code = 'database_fix_request');

ALTER TABLE ticket_type_workflow_transitions DROP COLUMN assigns_to_step;
