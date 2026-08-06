-- Create academicians table
CREATE TABLE academicians (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial test academicians
-- Mühendislik Fakültesi (f1111111-1111-1111-1111-111111111111), Bilgisayar Mühendisliği (d1111111-1111-1111-1111-111111111111)
INSERT INTO academicians (id, first_name, last_name, email, phone, title, faculty_id, department_id, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Ahmet', 'Yılmaz', 'ahmet.yilmaz@inonu.edu.tr', '+90 555 333 44 55', 'Doç. Dr.', 'f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Mühendislik Fakültesi (f1111111-1111-1111-1111-111111111111), Elektrik-Elektronik Mühendisliği (d2222222-2222-2222-2222-222222222222)
INSERT INTO academicians (id, first_name, last_name, email, phone, title, faculty_id, department_id, created_at, updated_at) VALUES
('a2222222-2222-2222-2222-222222222222', 'Mehmet', 'Demir', 'mehmet.demir@inonu.edu.tr', '+90 555 555 66 77', 'Arş. Gör.', 'f1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Fen Edebiyat Fakültesi (f3333333-3333-3333-3333-333333333333), Biyoloji (d4444444-4444-4444-4444-444444444444)
INSERT INTO academicians (id, first_name, last_name, email, phone, title, faculty_id, department_id, created_at, updated_at) VALUES
('a3333333-3333-3333-3333-333333333333', 'Elif', 'Çelik', 'elif.celik@inonu.edu.tr', '+90 555 444 55 66', 'Dr. Öğr. Üyesi', 'f3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
