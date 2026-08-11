-- Ensure seeded department admin users have a matching department scope.
INSERT INTO departments (id, faculty_id, name, code, created_at, updated_at)
SELECT
    'd6666666-6666-6666-6666-666666666666',
    f.id,
    u.department,
    'TIP-EGT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
JOIN faculties f ON f.name = u.faculty
WHERE u.id = '33333333-3333-3333-3333-333333333333'
  AND NOT EXISTS (
      SELECT 1
      FROM departments d
      WHERE d.faculty_id = f.id
        AND LOWER(d.name) = LOWER(u.department)
  );
