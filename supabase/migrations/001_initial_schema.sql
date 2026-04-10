-- Pottery Log schema
-- Run against your self-hosted Supabase via SQL editor or psql

CREATE SCHEMA IF NOT EXISTS pottery;

-- Lookup tables

CREATE TABLE pottery.clay_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text
);

CREATE TABLE pottery.tag_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_freeform boolean NOT NULL DEFAULT false
);

CREATE TABLE pottery.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES pottery.tag_categories(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE pottery.stage_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_fields jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT false
);

-- Main tables

CREATE TABLE pottery.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  display_image text,
  clay_type_id uuid REFERENCES pottery.clay_types(id) ON DELETE SET NULL,
  piece_id_label text,
  price numeric,
  final_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid()
);

CREATE TABLE pottery.piece_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES pottery.pieces(id) ON DELETE CASCADE,
  stage_def_id uuid REFERENCES pottery.stage_defaults(id) ON DELETE SET NULL,
  title text NOT NULL,
  image_path text,
  fields jsonb NOT NULL DEFAULT '{}',
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pottery.piece_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES pottery.pieces(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pottery.piece_tags (
  piece_id uuid NOT NULL REFERENCES pottery.pieces(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES pottery.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (piece_id, tag_id)
);

-- updated_at trigger

CREATE OR REPLACE FUNCTION pottery.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pieces_set_updated_at
  BEFORE UPDATE ON pottery.pieces
  FOR EACH ROW EXECUTE FUNCTION pottery.set_updated_at();

-- RLS

ALTER TABLE pottery.clay_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.stage_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.piece_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.piece_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.piece_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON pottery.clay_types FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.tag_categories FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.tags FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.stage_defaults FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.pieces FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.piece_stages FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.piece_images FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.piece_tags FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Grant API access (required for PostgREST to access pottery schema)

GRANT USAGE ON SCHEMA pottery TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA pottery TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pottery TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pottery GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pottery GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Storage bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('pottery-images', 'pottery-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pottery-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_select" ON storage.objects FOR SELECT USING (bucket_id = 'pottery-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'pottery-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pottery-images' AND auth.uid() IS NOT NULL);

-- Seed data

INSERT INTO pottery.clay_types (name, description) VALUES
  ('Leigods', 'Earthenware'),
  ('Steingods', 'Stoneware'),
  ('Porselen', 'Porcelain');

INSERT INTO pottery.tag_categories (name, is_freeform) VALUES
  ('Glasur', false),
  ('Form', false),
  ('Fritekst', true);

INSERT INTO pottery.stage_defaults (name, default_fields, sort_order, is_system) VALUES
  ('Dreiing', '["gram_leire", "etter_dreiing_g", "hoyde_cm", "bredde_cm"]', 1, true),
  ('Trimming', '["hoyde_cm", "bredde_cm"]', 2, true),
  ('Bisque-brenning', '["brann_temp", "ovn_detalj"]', 3, true),
  ('Glasering', '["glasur_filter", "glasur_lag", "metode"]', 4, true),
  ('Glasur-brenning', '["brann_temp", "ovn_detalj", "sluttvekt_g", "slutthoyde_cm", "sluttbredde_cm"]', 5, true);
