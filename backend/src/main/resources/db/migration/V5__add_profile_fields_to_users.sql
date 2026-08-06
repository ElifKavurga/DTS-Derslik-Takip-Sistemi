ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN title VARCHAR(100);
ALTER TABLE users ADD COLUMN department VARCHAR(150);
ALTER TABLE users ADD COLUMN faculty VARCHAR(150);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);

-- Seed development admin user with profile values
UPDATE users
SET phone = '+90 555 123 45 67',
    title = 'Prof. Dr.',
    department = 'Bilgisayar Mühendisliği',
    faculty = 'Mühendislik Fakültesi'
WHERE email = 'admin@inonu.edu.tr';
