-- V20: Create academic periods table and update courses relation

CREATE TABLE academic_periods (
    id            UUID PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    term_type     VARCHAR(20) NOT NULL,
    display_name  VARCHAR(50) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_academic_periods_year_term UNIQUE (academic_year, term_type)
);

-- Seed initial periods
INSERT INTO academic_periods (id, academic_year, term_type, display_name, start_date, end_date, is_active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', '2026-2027', 'FALL', '2026-2027 Güz', '2026-09-15', '2027-01-15', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', '2026-2027', 'SPRING', '2026-2027 Bahar', '2027-02-10', '2027-06-10', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('33333333-3333-3333-3333-333333333333', '2025-2026', 'FALL', '2025-2026 Güz', '2025-09-15', '2026-01-15', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add academic_period_id to courses table
ALTER TABLE courses ADD COLUMN academic_period_id UUID REFERENCES academic_periods(id) ON DELETE SET NULL;

-- Update existing courses according to their semester
UPDATE courses SET academic_period_id = '11111111-1111-1111-1111-111111111111' WHERE semester = 'GUZ';
UPDATE courses SET academic_period_id = '22222222-2222-2222-2222-222222222222' WHERE semester = 'BAHAR';
UPDATE courses SET academic_period_id = '11111111-1111-1111-1111-111111111111' WHERE academic_period_id IS NULL;

-- Set NOT NULL constraint on courses.academic_period_id
ALTER TABLE courses ALTER COLUMN academic_period_id SET NOT NULL;
