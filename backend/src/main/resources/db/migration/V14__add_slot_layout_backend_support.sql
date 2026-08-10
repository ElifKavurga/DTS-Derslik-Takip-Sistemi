ALTER TABLE floors
  ADD COLUMN plan_mode VARCHAR(30) NOT NULL DEFAULT 'FLOOR_PLAN';

CREATE TABLE slot_layout (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL UNIQUE REFERENCES floors(id) ON DELETE CASCADE,
    rows INTEGER NOT NULL DEFAULT 3,
    columns INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_slot_layout_rows_positive CHECK (rows > 0),
    CONSTRAINT chk_slot_layout_columns_positive CHECK (columns > 0)
);

ALTER TABLE space_objects
  ADD COLUMN slot_row INTEGER NULL,
  ADD COLUMN slot_column INTEGER NULL,
  ADD CONSTRAINT chk_space_objects_slot_pair
    CHECK (
      (slot_row IS NULL AND slot_column IS NULL)
      OR
      (slot_row IS NOT NULL AND slot_column IS NOT NULL)
    );

CREATE UNIQUE INDEX ux_space_objects_floor_slot
  ON space_objects(floor_id, slot_row, slot_column)
  WHERE slot_row IS NOT NULL
    AND slot_column IS NOT NULL;
