-- Sprint 12.4 conflict/edge-case seed validation.
-- Every row must return violation_count = 0 and status = PASS.

WITH sprint_schedules AS (
    SELECT ws.*
    FROM weekly_schedules ws
    WHERE ws.source_note LIKE '[S12.4]%'
),
checks AS (
    SELECT 'missing_expected_schedule_rows' AS check_name,
           GREATEST(19 - COUNT(*), 0) AS violation_count
    FROM sprint_schedules

    UNION ALL

    SELECT 'missing_scenario_course', CASE WHEN COUNT(*) = 1 THEN 0 ELSE 1 END
    FROM courses
    WHERE code = 'S124EC1'

    UNION ALL

    SELECT 'online_classroom_violation', COUNT(*)
    FROM sprint_schedules
    WHERE delivery_type = 'ONLINE'
      AND classroom_id IS NOT NULL

    UNION ALL

    SELECT 'physical_classroom_chain_violation', COUNT(*)
    FROM sprint_schedules ws
    LEFT JOIN classrooms c ON c.id = ws.classroom_id
    LEFT JOIN floors fl ON fl.id = c.floor_id
    LEFT JOIN buildings b ON b.id = fl.building_id
    LEFT JOIN faculties f ON f.id = b.faculty_id
    WHERE ws.delivery_type = 'FACE_TO_FACE'
      AND (c.id IS NULL OR fl.id IS NULL OR b.id IS NULL OR f.id IS NULL)

    UNION ALL

    SELECT 'missing_capacity_overflow', CASE WHEN COUNT(*) > 0 THEN 0 ELSE 1 END
    FROM sprint_schedules ws
    JOIN courses c ON c.id = ws.course_id
    JOIN classrooms cl ON cl.id = ws.classroom_id
    WHERE c.student_count > cl.capacity

    UNION ALL

    SELECT 'missing_academician_conflict', CASE WHEN COUNT(*) > 0 THEN 0 ELSE 1 END
    FROM (
        SELECT c.academician_id, ws.day_of_week, ws.time_slot
        FROM sprint_schedules ws
        JOIN courses c ON c.id = ws.course_id
        GROUP BY c.academician_id, ws.day_of_week, ws.time_slot
        HAVING COUNT(DISTINCT c.id) > 1
    ) conflicts

    UNION ALL

    SELECT 'missing_student_group_conflict', CASE WHEN COUNT(*) > 0 THEN 0 ELSE 1 END
    FROM (
        SELECT c.department_id, c.grade, ws.day_of_week, ws.time_slot
        FROM sprint_schedules ws
        JOIN courses c ON c.id = ws.course_id
        WHERE c.course_type = 'ZORUNLU'
        GROUP BY c.department_id, c.grade, ws.day_of_week, ws.time_slot
        HAVING COUNT(DISTINCT c.id) > 1
    ) conflicts

    UNION ALL

    SELECT 'classroom_unique_constraint_violation', COUNT(*)
    FROM (
        SELECT classroom_id, day_of_week, time_slot
        FROM weekly_schedules
        WHERE classroom_id IS NOT NULL
        GROUP BY classroom_id, day_of_week, time_slot
        HAVING COUNT(*) > 1
    ) conflicts

    UNION ALL

    SELECT 'missing_back_to_back_control',
           CASE WHEN COUNT(DISTINCT time_slot) = 2 THEN 0 ELSE 1 END
    FROM sprint_schedules
    WHERE day_of_week = 'MONDAY'
      AND time_slot IN ('08:15-09:00', '09:10-09:55')
      AND classroom_id = (
          SELECT classroom_id
          FROM sprint_schedules
          WHERE source_note LIKE '%[PHYSICAL_BASELINE]%'
          LIMIT 1
      )

    UNION ALL

    SELECT 'missing_online_control', CASE WHEN COUNT(*) > 0 THEN 0 ELSE 1 END
    FROM sprint_schedules
    WHERE source_note LIKE '%[ONLINE_NO_PHYSICAL_CONFLICT]%'
      AND delivery_type = 'ONLINE'
      AND classroom_id IS NULL

    UNION ALL

    SELECT 'duplicate_sprint_schedule_id', COUNT(*)
    FROM (
        SELECT id
        FROM sprint_schedules
        GROUP BY id
        HAVING COUNT(*) > 1
    ) duplicates
)
SELECT
    check_name,
    violation_count,
    CASE WHEN violation_count = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM checks
ORDER BY check_name;
