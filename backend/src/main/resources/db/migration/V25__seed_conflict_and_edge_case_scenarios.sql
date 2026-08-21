-- Sprint 12.4: controlled conflict and edge-case data for Sprint 13 tests.
-- Every inserted weekly schedule is labelled in source_note with [S12.4].
-- Existing faculties, departments, academicians, classrooms, courses and schedules
-- are never updated or deleted.
--
-- Supported by the current model:
--   * academician conflict (same academician/day/generated slot)
--   * required-class conflict (same department/grade/day/generated slot)
--   * capacity warning, online delivery, physical delivery and adjacent slots
--   * partial/contained/same-start/same-end cases at generated-slot granularity
--
-- Not inserted because the current model does not support them safely:
--   * exact classroom conflict: blocked by uk_weekly_schedules_classroom_day_time
--   * arbitrary overlapping ranges: time_slot is a generated discrete slot
--   * different weeks: WeeklySchedule has no week/date dimension
--   * student identity conflict: there is no Student-to-WeeklySchedule relation

-- One additional course is required to create a second required first-grade course
-- without changing any existing course. It reuses the existing CENG101 ownership,
-- department, faculty and academic period.
INSERT INTO courses (
    id, code, name, faculty_id, department_id, academician_id,
    theoretical_hours, practical_hours, ects, credits, student_count,
    course_type, semester, academic_period_id, grade, active, created_at, updated_at
)
SELECT
    'c1240001-0000-4000-8000-000000000001'::uuid,
    'S124EC1',
    '[S12.4] Çakışma ve Kapasite Test Dersi',
    base.faculty_id,
    base.department_id,
    base.academician_id,
    12,
    0,
    1,
    1,
    999,
    'ZORUNLU',
    base.semester,
    base.academic_period_id,
    base.grade,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM courses base
WHERE base.code = 'CENG101'
  AND NOT EXISTS (
      SELECT 1
      FROM courses existing
      WHERE existing.id = 'c1240001-0000-4000-8000-000000000001'::uuid
         OR LOWER(existing.code) = LOWER('S124EC1')
  );

WITH engineering_rooms AS (
    SELECT
        c.id,
        ROW_NUMBER() OVER (ORDER BY c.capacity, c.code, c.id) AS room_order
    FROM classrooms c
    JOIN floors fl ON fl.id = c.floor_id
    JOIN buildings b ON b.id = fl.building_id
    JOIN faculties f ON f.id = b.faculty_id
    WHERE f.name = 'Mühendislik Fakültesi'
),
selected_rooms AS (
    SELECT
        (SELECT id FROM engineering_rooms WHERE room_order = 1) AS room_1,
        (SELECT id FROM engineering_rooms WHERE room_order = 2) AS room_2
),
course_refs AS (
    SELECT
        (SELECT id FROM courses WHERE code = 'CENG101') AS ceng101,
        (SELECT id FROM courses WHERE code = 'CENG201') AS ceng201,
        (SELECT id FROM courses WHERE code = 'CENG301') AS ceng301,
        (SELECT id FROM courses WHERE code = 'CENG401') AS ceng401,
        (SELECT id FROM courses WHERE code = 'S124EC1') AS edge_course
),
scenarios (
    id, course_id, classroom_id, day_of_week, time_slot, schedule_group_id,
    delivery_type, class_level, section, student_group, source_note
) AS (
    VALUES
        -- Same academician and same required class, but different classrooms.
        ('e1240001-0000-4000-8000-000000000001'::uuid, (SELECT ceng101 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'MONDAY', '08:15-09:00', 'b1240001-0000-4000-8000-000000000001'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][ACADEMICIAN_CONFLICT][STUDENT_GROUP_CONFLICT][PHYSICAL_BASELINE] pair=A'),
        ('e1240002-0000-4000-8000-000000000002'::uuid, (SELECT edge_course FROM course_refs), (SELECT room_2 FROM selected_rooms), 'MONDAY', '08:15-09:00', 'b1240002-0000-4000-8000-000000000002'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][ACADEMICIAN_CONFLICT][STUDENT_GROUP_CONFLICT][CAPACITY_OVERFLOW] pair=B'),

        -- Adjacent use of the same classroom and a later use of the same academician.
        ('e1240003-0000-4000-8000-000000000003'::uuid, (SELECT ceng201 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'MONDAY', '09:10-09:55', 'b1240003-0000-4000-8000-000000000003'::uuid, 'FACE_TO_FACE', 2, 'A', 'CENG-2-A', '[S12.4][BACK_TO_BACK_NO_CONFLICT][SAME_CLASSROOM_DIFFERENT_SLOT]'),
        ('e1240004-0000-4000-8000-000000000004'::uuid, (SELECT ceng301 FROM course_refs), (SELECT room_2 FROM selected_rooms), 'MONDAY', '10:05-10:50', 'b1240004-0000-4000-8000-000000000004'::uuid, 'FACE_TO_FACE', 3, 'A', 'CENG-3-A', '[S12.4][SAME_ACADEMICIAN_DIFFERENT_SLOT_NO_CONFLICT]'),

        -- Online delivery intentionally has no physical classroom.
        ('e1240005-0000-4000-8000-000000000005'::uuid, (SELECT ceng401 FROM course_refs), NULL, 'TUESDAY', '13:30-14:15', 'b1240005-0000-4000-8000-000000000005'::uuid, 'ONLINE', 4, 'A', 'CENG-4-A', '[S12.4][ONLINE_NO_PHYSICAL_CONFLICT]'),

        -- Partial overlap represented by two multi-slot groups sharing one slot.
        ('e1240006-0000-4000-8000-000000000006'::uuid, (SELECT ceng101 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'WEDNESDAY', '08:15-09:00', 'b1240006-0000-4000-8000-000000000006'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][PARTIAL_OVERLAP] group=A start'),
        ('e1240007-0000-4000-8000-000000000007'::uuid, (SELECT ceng101 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'WEDNESDAY', '09:10-09:55', 'b1240006-0000-4000-8000-000000000006'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][PARTIAL_OVERLAP] group=A shared-slot'),
        ('e1240008-0000-4000-8000-000000000008'::uuid, (SELECT edge_course FROM course_refs), (SELECT room_2 FROM selected_rooms), 'WEDNESDAY', '09:10-09:55', 'b1240007-0000-4000-8000-000000000007'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][PARTIAL_OVERLAP] group=B shared-slot'),
        ('e1240009-0000-4000-8000-000000000009'::uuid, (SELECT edge_course FROM course_refs), (SELECT room_2 FROM selected_rooms), 'WEDNESDAY', '10:05-10:50', 'b1240007-0000-4000-8000-000000000007'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][PARTIAL_OVERLAP] group=B end'),

        -- Full containment at slot granularity: B occupies the middle slot of A.
        ('e1240010-0000-4000-8000-000000000010'::uuid, (SELECT ceng201 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'THURSDAY', '08:15-09:00', 'b1240008-0000-4000-8000-000000000008'::uuid, 'FACE_TO_FACE', 2, 'A', 'CENG-2-A', '[S12.4][FULL_CONTAINMENT] outer start'),
        ('e1240011-0000-4000-8000-000000000011'::uuid, (SELECT ceng201 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'THURSDAY', '09:10-09:55', 'b1240008-0000-4000-8000-000000000008'::uuid, 'FACE_TO_FACE', 2, 'A', 'CENG-2-A', '[S12.4][FULL_CONTAINMENT] outer shared-slot'),
        ('e1240012-0000-4000-8000-000000000012'::uuid, (SELECT ceng201 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'THURSDAY', '10:05-10:50', 'b1240008-0000-4000-8000-000000000008'::uuid, 'FACE_TO_FACE', 2, 'A', 'CENG-2-A', '[S12.4][FULL_CONTAINMENT] outer end'),
        ('e1240013-0000-4000-8000-000000000013'::uuid, (SELECT ceng301 FROM course_refs), (SELECT room_2 FROM selected_rooms), 'THURSDAY', '09:10-09:55', 'b1240009-0000-4000-8000-000000000009'::uuid, 'FACE_TO_FACE', 3, 'A', 'CENG-3-A', '[S12.4][FULL_CONTAINMENT] inner shared-slot'),

        -- Same-start scenario at generated-slot granularity.
        ('e1240014-0000-4000-8000-000000000014'::uuid, (SELECT ceng101 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'FRIDAY', '08:15-09:00', 'b1240010-0000-4000-8000-000000000010'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][SAME_START] group=A shared-slot'),
        ('e1240015-0000-4000-8000-000000000015'::uuid, (SELECT ceng101 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'FRIDAY', '09:10-09:55', 'b1240010-0000-4000-8000-000000000010'::uuid, 'FACE_TO_FACE', 1, 'A', 'CENG-1-A', '[S12.4][SAME_START] group=A end'),
        ('e1240016-0000-4000-8000-000000000016'::uuid, (SELECT ceng201 FROM course_refs), (SELECT room_2 FROM selected_rooms), 'FRIDAY', '08:15-09:00', 'b1240011-0000-4000-8000-000000000011'::uuid, 'FACE_TO_FACE', 2, 'A', 'CENG-2-A', '[S12.4][SAME_START] group=B shared-slot'),

        -- Same-end scenario at generated-slot granularity.
        ('e1240017-0000-4000-8000-000000000017'::uuid, (SELECT ceng301 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'TUESDAY', '08:15-09:00', 'b1240012-0000-4000-8000-000000000012'::uuid, 'FACE_TO_FACE', 3, 'A', 'CENG-3-A', '[S12.4][SAME_END] group=A start'),
        ('e1240018-0000-4000-8000-000000000018'::uuid, (SELECT ceng301 FROM course_refs), (SELECT room_1 FROM selected_rooms), 'TUESDAY', '09:10-09:55', 'b1240012-0000-4000-8000-000000000012'::uuid, 'FACE_TO_FACE', 3, 'A', 'CENG-3-A', '[S12.4][SAME_END] group=A shared-slot'),
        ('e1240019-0000-4000-8000-000000000019'::uuid, (SELECT ceng401 FROM course_refs), (SELECT room_2 FROM selected_rooms), 'TUESDAY', '09:10-09:55', 'b1240013-0000-4000-8000-000000000013'::uuid, 'FACE_TO_FACE', 4, 'A', 'CENG-4-A', '[S12.4][SAME_END] group=B shared-slot')
)
INSERT INTO weekly_schedules (
    id, course_id, classroom_id, day_of_week, time_slot, schedule_group_id,
    delivery_type, class_level, section, student_group, source_note,
    created_at, updated_at
)
SELECT
    s.id,
    s.course_id,
    s.classroom_id,
    s.day_of_week,
    s.time_slot,
    s.schedule_group_id,
    s.delivery_type,
    s.class_level,
    s.section,
    s.student_group,
    s.source_note,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM scenarios s
WHERE s.course_id IS NOT NULL
  AND (s.delivery_type = 'ONLINE' OR s.classroom_id IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM weekly_schedules existing WHERE existing.id = s.id)
ON CONFLICT (classroom_id, day_of_week, time_slot) DO NOTHING;
