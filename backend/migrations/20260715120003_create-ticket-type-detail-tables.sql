-- Up

-- Shared by BOTH database_fix_request and mass_request: the two types have
-- identical fields; only the auto-tagging-on-approval behavior differs
-- (handled in application/workflow logic, not the schema).
CREATE TABLE ticket_db_change_details (
  ticket_id BIGINT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  environment VARCHAR(64) NOT NULL,
  affected_system VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  change_description TEXT NOT NULL,
  business_justification TEXT NOT NULL,
  record_count_estimate INTEGER,
  requested_completion_date DATE
);

CREATE TABLE ticket_bcp_whitelist_details (
  ticket_id BIGINT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  ip_cidr VARCHAR(64),
  url_domain VARCHAR(255),
  department VARCHAR(120) NOT NULL,
  business_reason TEXT NOT NULL,
  expiry_date DATE,
  CHECK (ip_cidr IS NOT NULL OR url_domain IS NOT NULL)
);

CREATE TABLE ticket_incident_report_details (
  ticket_id BIGINT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3', 'sev4')),
  systems_affected TEXT NOT NULL,
  incident_occurred_at TIMESTAMPTZ NOT NULL,
  impact_description TEXT NOT NULL,
  immediate_action_taken TEXT
);

CREATE TABLE ticket_service_request_details (
  ticket_id BIGINT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  category VARCHAR(120) NOT NULL,
  requested_completion_date DATE
);

-- Down

DROP TABLE IF EXISTS ticket_service_request_details;
DROP TABLE IF EXISTS ticket_incident_report_details;
DROP TABLE IF EXISTS ticket_bcp_whitelist_details;
DROP TABLE IF EXISTS ticket_db_change_details;
