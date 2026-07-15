-- Up Migration

-- pgcrypto's crypt()/gen_salt('bf') produces standard bcrypt hashes
-- ($2a$/$2b$), the same format bcryptjs verifies in application code --
-- lets seed data be self-contained SQL without a separate seeding script.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Seed the preconfigured users named in the project brief. Emails/passwords
-- here are DEV-ONLY PLACEHOLDERS (real corporate addresses were not
-- provided) -- see docs/specs/004-auth-rbac.md's open questions. Dev
-- password for every seeded account is 'ChangeMe123!'.
INSERT INTO users (name, email, password_hash, employee_id, department, "emailVerified") VALUES
  ('Leiva Morente', 'lmorente@standard-insurance.com', crypt('ChangeMe123!', gen_salt('bf')), 'EMP-LMORENTE', 'IT', now()),
  ('Rudy Manlapig', 'rmanlapig@standard-insurance.com', crypt('ChangeMe123!', gen_salt('bf')), 'EMP-RMANLAPIG', 'IT', now()),
  ('Demo Associate', 'associate.demo@standard-insurance.com', crypt('ChangeMe123!', gen_salt('bf')), 'EMP-ASSOC01', 'IT', now()),
  ('Demo Requestor', 'requestor.demo@standard-insurance.com', crypt('ChangeMe123!', gen_salt('bf')), 'EMP-REQ01', 'Underwriting', now());

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE (u.email = 'lmorente@standard-insurance.com' AND r.code = 'approver')
   OR (u.email = 'rmanlapig@standard-insurance.com' AND r.code = 'admin')
   OR (u.email = 'associate.demo@standard-insurance.com' AND r.code = 'associate');

-- 'Demo Requestor' gets no row in user_roles: requestor is the implicit
-- floor capability every authenticated user has, not a stored role.

-- Down Migration

DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE email IN (
    'lmorente@standard-insurance.com',
    'rmanlapig@standard-insurance.com',
    'associate.demo@standard-insurance.com',
    'requestor.demo@standard-insurance.com'
  )
);
DELETE FROM users WHERE email IN (
  'lmorente@standard-insurance.com',
  'rmanlapig@standard-insurance.com',
  'associate.demo@standard-insurance.com',
  'requestor.demo@standard-insurance.com'
);
ALTER TABLE users DROP COLUMN password_hash;
DROP EXTENSION IF EXISTS pgcrypto;
