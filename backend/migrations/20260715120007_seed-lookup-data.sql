-- Up Migration

-- Static lookup data only. Deliberately NOT seeded here: specific user
-- accounts (spec 004 -- Auth & RBAC), workflow_assignments and
-- ticket_type_workflow_transitions rows (specs 007-011, one per ticket
-- type's workflow spec) -- those depend on real users and per-type business
-- rules that belong to their own feature commits, not the schema commit.

INSERT INTO roles (code, label) VALUES
  ('approver', 'Approver'),
  ('admin', 'Admin'),
  ('associate', 'Associate');

INSERT INTO ticket_types (code, label, has_approval_step, allows_requestor_choose_assignee, extension_table) VALUES
  ('database_fix_request', 'Database Fix Request', true, false, 'ticket_db_change_details'),
  ('mass_request', 'Mass Request', true, false, 'ticket_db_change_details'),
  ('bcp_whitelisting_request', 'BCP (Whitelisting) Request', false, false, 'ticket_bcp_whitelist_details'),
  ('incident_report', 'Incident Report', false, false, 'ticket_incident_report_details'),
  ('service_request', 'Service Request', false, true, 'ticket_service_request_details');

-- Shared across every ticket type; not every type reaches every status (see
-- each ticket_type_workflow_transitions seed in specs 007-011 for which
-- statuses a given type can actually reach).
INSERT INTO ticket_statuses (code, label, is_terminal) VALUES
  ('new', 'New', false),
  ('pending_approval', 'Pending Approval', false),
  ('approved', 'Approved', false),
  ('assigned', 'Assigned', false),
  ('in_progress', 'In Progress', false),
  ('for_discussion', 'For Discussion', false),
  ('sent_back', 'Sent Back', false),
  ('acknowledged', 'Acknowledged', false),
  ('reopened', 'Reopened', false),
  ('resolved', 'Resolved', true),
  ('done', 'Done', true),
  ('declined', 'Declined', true),
  ('closed', 'Closed', true);

-- Down Migration

DELETE FROM ticket_statuses;
DELETE FROM ticket_types;
DELETE FROM roles;
