CREATE TABLE weekly_schedules (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_weekly_schedules_classroom_day_time UNIQUE (classroom_id, day_of_week, time_slot)
);

CREATE INDEX idx_weekly_schedules_course_id ON weekly_schedules(course_id);
CREATE INDEX idx_weekly_schedules_classroom_id ON weekly_schedules(classroom_id);
CREATE INDEX idx_weekly_schedules_day_time ON weekly_schedules(day_of_week, time_slot);
