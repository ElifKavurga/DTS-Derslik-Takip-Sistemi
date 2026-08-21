-- Sprint 12.3 test-user consistency report.
-- Every row must return violation_count = 0 and status = PASS.

WITH checks AS (
    SELECT 'course_academician_without_login' AS check_name, COUNT(*) AS violation_count
    FROM (
        SELECT DISTINCT a.id
        FROM courses c
        JOIN academicians a ON a.id = c.academician_id
        LEFT JOIN users u ON LOWER(u.email) = LOWER(a.email) AND u.active = TRUE
        LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'ACADEMICIAN'
        WHERE u.id IS NULL OR ur.user_id IS NULL
    ) violations

    UNION ALL

    SELECT 'academician_login_without_course', COUNT(*)
    FROM (
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'ACADEMICIAN'
        LEFT JOIN academicians a ON LOWER(a.email) = LOWER(u.email)
        LEFT JOIN courses c ON c.academician_id = a.id
        WHERE a.id IS NULL OR c.id IS NULL
    ) violations

    UNION ALL

    SELECT 'course_academician_scope_mismatch', COUNT(*)
    FROM courses c
    JOIN academicians a ON a.id = c.academician_id
    WHERE a.faculty_id <> c.faculty_id
       OR a.department_id <> c.department_id

    UNION ALL

    SELECT 'academician_user_scope_mismatch', COUNT(*)
    FROM academicians a
    JOIN users u ON LOWER(u.email) = LOWER(a.email)
    JOIN faculties f ON f.id = a.faculty_id
    JOIN departments d ON d.id = a.department_id
    WHERE LOWER(u.faculty) <> LOWER(f.name)
       OR LOWER(u.department) <> LOWER(d.name)

    UNION ALL

    SELECT 'schedule_academician_without_login', COUNT(*)
    FROM weekly_schedules ws
    JOIN courses c ON c.id = ws.course_id
    JOIN academicians a ON a.id = c.academician_id
    LEFT JOIN users u ON LOWER(u.email) = LOWER(a.email) AND u.active = TRUE
    LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'ACADEMICIAN'
    WHERE u.id IS NULL OR ur.user_id IS NULL

    UNION ALL

    SELECT 'duplicate_user_email', COUNT(*)
    FROM (
        SELECT LOWER(email)
        FROM users
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    ) duplicates

    UNION ALL

    SELECT 'duplicate_academician_email', COUNT(*)
    FROM (
        SELECT LOWER(email)
        FROM academicians
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    ) duplicates

    UNION ALL

    SELECT 'duplicate_user_role', COUNT(*)
    FROM (
        SELECT user_id, role
        FROM user_roles
        GROUP BY user_id, role
        HAVING COUNT(*) > 1
    ) duplicates

    UNION ALL

    SELECT 'non_test_academician_email', COUNT(*)
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'ACADEMICIAN'
    WHERE LOWER(u.email) NOT LIKE '%@dts.test'

    UNION ALL

    SELECT 'department_admin_scope_requirement',
           CASE
               WHEN COUNT(DISTINCT u.id) >= 2
                AND COUNT(DISTINCT LOWER(u.faculty || '|' || u.department)) >= 2
               THEN 0 ELSE 1
           END
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'DEPARTMENT_ADMIN'
    JOIN faculties f ON LOWER(f.name) = LOWER(u.faculty)
    JOIN departments d ON d.faculty_id = f.id AND LOWER(d.name) = LOWER(u.department)
    WHERE u.active = TRUE
)
SELECT
    check_name,
    violation_count,
    CASE WHEN violation_count = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM checks
ORDER BY check_name;
