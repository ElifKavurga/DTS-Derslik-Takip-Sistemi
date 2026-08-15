-- V19: Add expected student count to courses

ALTER TABLE courses
ADD COLUMN student_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE courses
ADD CONSTRAINT courses_student_count_non_negative CHECK (student_count >= 0);
