-- Create user_roles table and migrate existing role values into it, then drop old role column and add office
BEGIN;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role VARCHAR(30) NOT NULL
);

INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users WHERE role IS NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role;
ALTER TABLE users DROP COLUMN IF EXISTS role;

ALTER TABLE users ADD COLUMN IF NOT EXISTS office VARCHAR(150);

COMMIT;
