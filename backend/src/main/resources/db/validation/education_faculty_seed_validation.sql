-- Education Faculty seed validation report.
-- Returns one row per validation category; violation_count must be 0 for PASS.

WITH checks AS (
    SELECT
        'online_classroom_violation' AS check_name,
        COUNT(*) AS violation_count
    FROM weekly_schedules
    WHERE delivery_type = 'ONLINE'
      AND classroom_id IS NOT NULL

    UNION ALL

    SELECT
        'duplicate_course_code' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT LOWER(code)
        FROM courses
        GROUP BY LOWER(code)
        HAVING COUNT(*) > 1
    ) duplicate_codes

    UNION ALL

    SELECT
        'duplicate_academician_email' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT LOWER(email)
        FROM academicians
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    ) duplicate_emails

    UNION ALL

    SELECT
        'classroom_conflict' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT classroom_id, day_of_week, time_slot
        FROM weekly_schedules
        WHERE classroom_id IS NOT NULL
        GROUP BY classroom_id, day_of_week, time_slot
        HAVING COUNT(*) > 1
    ) conflicts

    UNION ALL

    SELECT
        'academician_conflict' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT c.academician_id, ws.day_of_week, ws.time_slot
        FROM weekly_schedules ws
        JOIN courses c ON c.id = ws.course_id
        GROUP BY c.academician_id, ws.day_of_week, ws.time_slot
        HAVING COUNT(*) > 1
    ) conflicts

    UNION ALL

    SELECT
        'student_group_conflict' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT c.department_id, COALESCE(ws.class_level, c.grade), COALESCE(ws.section, ''), ws.day_of_week, ws.time_slot
        FROM weekly_schedules ws
        JOIN courses c ON c.id = ws.course_id
        WHERE c.course_type = 'ZORUNLU'
        GROUP BY c.department_id, COALESCE(ws.class_level, c.grade), COALESCE(ws.section, ''), ws.day_of_week, ws.time_slot
        HAVING COUNT(*) > 1
    ) conflicts

    UNION ALL

    SELECT
        'classroom_code_block_floor_violation' AS check_name,
        COUNT(*) AS violation_count
    FROM classrooms c
    JOIN floors f ON f.id = c.floor_id
    JOIN buildings b ON b.id = f.building_id
    WHERE c.code ~ '^[A-Z][0-9]{3}$'
      AND (
          LEFT(c.code, 1) <> LEFT(b.code, 1)
          OR SUBSTRING(c.code FROM 2 FOR 1)::integer <> f.level
      )
)
SELECT
    check_name,
    violation_count,
    CASE WHEN violation_count = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM checks
ORDER BY check_name;
