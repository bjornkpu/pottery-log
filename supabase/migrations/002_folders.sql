-- Folders: flat grouping of pieces (issue #6)
-- Run against your self-hosted Supabase via SQL editor or psql

CREATE TABLE pottery.folders (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE pottery.piece_folders (
	piece_id uuid NOT NULL REFERENCES pottery.pieces(id) ON DELETE CASCADE,
	folder_id uuid NOT NULL REFERENCES pottery.folders(id) ON DELETE CASCADE,
	PRIMARY KEY (piece_id, folder_id)
);

ALTER TABLE pottery.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pottery.piece_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON pottery.folders FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON pottery.piece_folders FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Seed data

INSERT INTO pottery.folders (name, sort_order) VALUES
	('Glasur', 1),
	('Teknisk', 2),
	('Bygging', 3);
