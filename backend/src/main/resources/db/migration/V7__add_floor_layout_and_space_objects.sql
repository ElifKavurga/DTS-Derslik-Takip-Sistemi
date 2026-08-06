-- Create floor_layout table
-- Stores the background floor plan image and canvas viewport state per floor
CREATE TABLE floor_layout (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL UNIQUE REFERENCES floors(id) ON DELETE CASCADE,
    background_image_base64 TEXT,
    background_image_type VARCHAR(10),
    viewport_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    viewport_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    viewport_zoom DOUBLE PRECISION NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create space_objects table
-- Stores individual objects placed on the canvas (classrooms, labs, WCs, etc.)
CREATE TABLE space_objects (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'EMPTY',
    label VARCHAR(255),
    code VARCHAR(100),
    capacity INTEGER,
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    width DOUBLE PRECISION NOT NULL DEFAULT 160,
    height DOUBLE PRECISION NOT NULL DEFAULT 100,
    rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup of objects by floor
CREATE INDEX idx_space_objects_floor_id ON space_objects(floor_id);
