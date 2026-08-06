-- Add background image positioning and opacity to floor_layout
-- These fields allow the floor plan image to be repositioned and resized on the canvas
ALTER TABLE floor_layout
  ADD COLUMN background_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN background_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN background_width DOUBLE PRECISION,
  ADD COLUMN background_height DOUBLE PRECISION,
  ADD COLUMN background_opacity DOUBLE PRECISION NOT NULL DEFAULT 0.35,
  ADD COLUMN background_locked BOOLEAN NOT NULL DEFAULT true;
