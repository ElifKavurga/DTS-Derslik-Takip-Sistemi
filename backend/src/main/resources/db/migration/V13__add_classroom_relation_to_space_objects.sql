-- Link classroom-like space objects to their physical classroom record.
-- Nullable because WC, stairs, mosque and similar objects do not require a classroom.
ALTER TABLE space_objects
  ADD COLUMN classroom_id UUID NULL;

ALTER TABLE space_objects
  ADD COLUMN metadata_json TEXT;

ALTER TABLE space_objects
  ADD CONSTRAINT fk_space_objects_classroom
  FOREIGN KEY (classroom_id)
  REFERENCES classrooms(id)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_space_objects_floor_classroom
  ON space_objects(floor_id, classroom_id)
  WHERE classroom_id IS NOT NULL;
