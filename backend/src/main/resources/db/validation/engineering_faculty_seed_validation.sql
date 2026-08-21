-- Engineering Faculty room/slot seed validation report.
-- violation_count must be 0 for PASS unless the check is an expected_source_conflict note.

WITH checks AS (
    SELECT
        'engineering_blocks_missing' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        VALUES ('MF-A'), ('MF-B'), ('MF-C'), ('MF-D'), ('MF-E'), ('MF-F')
    ) expected(code)
    WHERE NOT EXISTS (
        SELECT 1
        FROM buildings b
        JOIN faculties f ON f.id = b.faculty_id
        WHERE f.code = 'MF'
          AND b.code = expected.code
    )

    UNION ALL

    SELECT
        'engineering_room_count_mismatch' AS check_name,
        CASE WHEN COUNT(*) = 110 THEN 0 ELSE ABS(COUNT(*) - 110) END AS violation_count
    FROM classrooms c
    JOIN floors fl ON fl.id = c.floor_id
    JOIN buildings b ON b.id = fl.building_id
    JOIN faculties f ON f.id = b.faculty_id
    WHERE f.code = 'MF'
      AND b.code IN ('MF-A', 'MF-B', 'MF-C', 'MF-D', 'MF-E', 'MF-F')
      AND c.code LIKE 'MF-%'

    UNION ALL

    SELECT
        'duplicate_engineering_room_code' AS check_name,
        COUNT(*) AS violation_count
    FROM (
        SELECT LOWER(c.code)
        FROM classrooms c
        JOIN floors fl ON fl.id = c.floor_id
        JOIN buildings b ON b.id = fl.building_id
        JOIN faculties f ON f.id = b.faculty_id
        WHERE f.code = 'MF'
          AND c.code LIKE 'MF-%'
        GROUP BY LOWER(c.code)
        HAVING COUNT(*) > 1
    ) duplicates

    UNION ALL

    SELECT
        'missing_slot_object_for_engineering_room' AS check_name,
        COUNT(*) AS violation_count
    FROM classrooms c
    JOIN floors fl ON fl.id = c.floor_id
    JOIN buildings b ON b.id = fl.building_id
    JOIN faculties f ON f.id = b.faculty_id
    WHERE f.code = 'MF'
      AND b.code IN ('MF-A', 'MF-B', 'MF-C', 'MF-D', 'MF-E', 'MF-F')
      AND c.code LIKE 'MF-%'
      AND NOT EXISTS (
          SELECT 1
          FROM space_objects so
          WHERE so.floor_id = c.floor_id
            AND so.classroom_id = c.id
      )

    UNION ALL

    SELECT
        'slot_object_wrong_floor' AS check_name,
        COUNT(*) AS violation_count
    FROM space_objects so
    JOIN classrooms c ON c.id = so.classroom_id
    WHERE so.floor_id <> c.floor_id

    UNION ALL

    SELECT
        'mf_a_2_13_expected_source_conflict' AS check_name,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM classrooms c
                JOIN floors fl ON fl.id = c.floor_id
                JOIN buildings b ON b.id = fl.building_id
                WHERE c.code = 'MF-A-2-13'
                  AND b.code = 'MF-A'
                  AND fl.level = 3
            )
            THEN 0
            ELSE 1
        END AS violation_count
)
SELECT
    check_name,
    violation_count,
    CASE WHEN violation_count = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM checks
ORDER BY check_name;
