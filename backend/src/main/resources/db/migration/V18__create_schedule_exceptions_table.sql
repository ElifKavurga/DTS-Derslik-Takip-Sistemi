CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    original_schedule_id UUID REFERENCES weekly_schedules(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    academician_id UUID NOT NULL REFERENCES academicians(id) ON DELETE RESTRICT,
    original_date DATE,
    target_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    slot_count INTEGER NOT NULL DEFAULT 1,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_schedule_exceptions_academician_date
    ON schedule_exceptions(academician_id, target_date, time_slot);

CREATE INDEX idx_schedule_exceptions_target_date_time
    ON schedule_exceptions(target_date, time_slot);

CREATE INDEX idx_schedule_exceptions_original
    ON schedule_exceptions(original_schedule_id, original_date, type);
