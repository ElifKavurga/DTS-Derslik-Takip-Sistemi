CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ACADEMICIAN'))
);

INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    password,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'System',
    'Administrator',
    'admin@dts.local',
    '$2b$10$BYY4LDRN/HU6yH5c92Q1ae8S6zzToK2kY4kkuZuRjTDIOip8qZHpy',
    'SUPER_ADMIN',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
