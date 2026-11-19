ALTER TABLE public.plant_materials
  ADD COLUMN IF NOT EXISTS "imageUrl" text;

ALTER TABLE public.plant_materials
  DROP CONSTRAINT IF EXISTS plant_materials_image_url_length_check;

ALTER TABLE public.plant_materials
  ADD CONSTRAINT plant_materials_image_url_length_check
  CHECK ("imageUrl" IS NULL OR length("imageUrl") <= 2048);
