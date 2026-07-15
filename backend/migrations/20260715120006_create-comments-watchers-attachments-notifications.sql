-- Up Migration

-- is_internal distinguishes approver/admin coordination notes from
-- requestor-visible updates (the Jira/Zendesk "internal note vs public
-- reply" pattern) -- lets Approver/Admin discuss a Database Fix ticket
-- without every remark emailing the requestor.
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_ticket ON comments(ticket_id, created_at);

-- Lets a manager/teammate follow a ticket's email notifications without
-- being requestor/approver/assignee. Manually added only -- no
-- auto-add-on-comment complexity, unlike Jira's watcher scheme.
CREATE TABLE ticket_watchers (
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  added_by_user_id INTEGER REFERENCES users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

CREATE TABLE attachments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  storage_key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_ticket ON attachments(ticket_id);

-- Write-only queue for the email layer: the app writes rows here on every
-- workflow transition; a separately-planned delivery worker (Gmail MCP,
-- once authorized -- see spec 014) polls status='pending' and updates it.
-- Decoupling this way means the workflow engine never blocks on email
-- delivery.
CREATE TABLE notification_events (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  audit_log_id BIGINT REFERENCES ticket_audit_log(id),
  recipient_user_id INTEGER NOT NULL REFERENCES users(id),
  recipient_role_snapshot VARCHAR(32),
  event_type VARCHAR(64) NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_notification_events_status ON notification_events(status);
CREATE INDEX idx_notification_events_ticket ON notification_events(ticket_id);

-- Down Migration

DROP TABLE IF EXISTS notification_events;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS ticket_watchers;
DROP TABLE IF EXISTS comments;
