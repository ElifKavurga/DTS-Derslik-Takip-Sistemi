-- Support source-faithful weekly schedules.
-- Online schedules must not be linked to a physical classroom.

ALTER TABLE weekly_schedules
    ALTER COLUMN classroom_id DROP NOT NULL;

ALTER TABLE weekly_schedules
    ADD COLUMN delivery_type VARCHAR(20) NOT NULL DEFAULT 'FACE_TO_FACE',
    ADD COLUMN class_level INTEGER NULL,
    ADD COLUMN section VARCHAR(20) NULL,
    ADD COLUMN student_group VARCHAR(100) NULL,
    ADD COLUMN source_note VARCHAR(255) NULL;

ALTER TABLE weekly_schedules
    ADD CONSTRAINT chk_weekly_schedules_online_without_classroom
        CHECK (delivery_type <> 'ONLINE' OR classroom_id IS NULL);
