CREATE TABLE department_schedule_configs (
    id UUID PRIMARY KEY,
    department_id UUID NOT NULL UNIQUE,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    lesson_duration_minutes INTEGER NOT NULL,
    break_duration_minutes INTEGER NOT NULL,
    lunch_break_enabled BOOLEAN NOT NULL,
    lunch_break_start VARCHAR(5) NOT NULL,
    lunch_break_end VARCHAR(5) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_department_schedule_configs_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE weekly_schedules
    ADD COLUMN schedule_group_id UUID NULL;

CREATE INDEX idx_weekly_schedules_schedule_group_id
    ON weekly_schedules(schedule_group_id);
