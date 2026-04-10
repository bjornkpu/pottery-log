# Pottery Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ceramic recipe book web app — grid overview, detail pages with stage-based documentation, and settings — backed by self-hosted Supabase.

**Architecture:** React client calls Supabase JS SDK directly (no custom API). TanStack Query wraps all calls for caching. Client-side image compression before upload. Auth via Supabase Auth with RLS on all tables. All data in `pottery` schema.

**Tech Stack:** TanStack Start/Router/Query/Form, @supabase/supabase-js, browser-image-compression, Zod v4, Tailwind CSS v4, ShadcN UI, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-pottery-log-design.md`

---

## File Structure

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   ├── field-labels.ts          # Stage field key → Norwegian label mapping
│   ├── image-utils.ts           # Client-side compression + upload
│   └── utils.ts                 # Existing cn() utility
├── types/
│   └── database.ts              # TypeScript types for pottery schema
├── hooks/
│   ├── use-auth.ts              # Auth state + session management
│   ├── use-pieces.ts            # Pieces CRUD queries/mutations
│   ├── use-tags.ts              # Tags + categories queries/mutations
│   ├── use-clay-types.ts        # Clay types queries/mutations
│   └── use-stage-defaults.ts    # Stage defaults queries/mutations
├── components/
│   ├── ui/                      # ShadcN components (existing + new)
│   ├── PieceCard.tsx            # Grid card for overview
│   ├── FilterBar.tsx            # Filter/search bar
│   ├── StageSection.tsx         # Stage display on detail page
│   ├── PieceForm.tsx            # Create/edit form
│   ├── StageEditor.tsx          # Stage editing within form
│   ├── TagSelect.tsx            # Tag picker
│   ├── ImageUpload.tsx          # Image upload with preview
│   └── Header.tsx               # Modified nav
├── routes/
│   ├── __root.tsx               # Modified: auth guard
│   ├── index.tsx                # Modified: grid overview
│   ├── login.tsx                # Login page
│   ├── settings.tsx             # Settings/admin page
│   ├── pieces.new.tsx           # Create piece
│   ├── pieces.$id.index.tsx     # Piece detail
│   └── pieces.$id.edit.tsx      # Edit piece
└── tests/
    ├── field-labels.test.ts
    └── image-utils.test.ts
supabase/
└── migrations/
    └── 001_initial_schema.sql   # Full schema + RLS + seed data
```

---

### Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`
- Create: `src/lib/field-labels.ts`
- Create: `src/tests/field-labels.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add @supabase/supabase-js browser-image-compression
```

- [ ] **Step 2: Add ShadcN components needed across the app**

```bash
npx shadcn@latest add card badge dialog separator skeleton
```

- [ ] **Step 3: Create `.env.example`**

```env
VITE_SUPABASE_URL=https://your-supabase-instance.example.com
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 4: Create `.env` with real values**

Copy `.env.example` to `.env` and fill in the actual Supabase URL and anon key from your self-hosted instance.

- [ ] **Step 5: Add `.superpowers/` and `.env` to `.gitignore`**

Append to `.gitignore`:
```
.superpowers
.env
```

- [ ] **Step 6: Create `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 7: Create `src/types/database.ts`**

```typescript
export type ClayType = {
  id: string
  name: string
  description: string | null
}

export type TagCategory = {
  id: string
  name: string
  is_freeform: boolean
}

export type Tag = {
  id: string
  name: string
  category_id: string
  created_by: string | null
  category?: TagCategory
}

export type StageDefault = {
  id: string
  name: string
  default_fields: string[]
  sort_order: number
  is_system: boolean
}

export type PieceStage = {
  id: string
  piece_id: string
  stage_def_id: string | null
  title: string
  image_path: string | null
  fields: Record<string, string | number>
  notes: string | null
  sort_order: number
  created_at: string
}

export type PieceImage = {
  id: string
  piece_id: string
  image_path: string
  caption: string | null
  sort_order: number
  created_at: string
}

export type Piece = {
  id: string
  title: string
  display_image: string | null
  clay_type_id: string | null
  piece_id_label: string | null
  price: number | null
  final_notes: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export type PieceWithRelations = Piece & {
  clay_type: ClayType | null
  stages: PieceStage[]
  tags: Tag[]
  images: PieceImage[]
}
```

- [ ] **Step 8: Create `src/lib/field-labels.ts`**

```typescript
const FIELD_LABELS: Record<string, string> = {
  gram_leire: 'Gram leire',
  etter_dreiing_g: 'Etter dreiing (g)',
  hoyde_cm: 'Høyde (cm)',
  bredde_cm: 'Bredde (cm)',
  brann_temp: 'Brennetemperatur',
  ovn_detalj: 'Ovndetalj',
  glasur_filter: 'Glasurfilter',
  glasur_lag: 'Glasurlag',
  metode: 'Metode',
  sluttvekt_g: 'Sluttvekt (g)',
  slutthoyde_cm: 'Slutthøyde (cm)',
  sluttbredde_cm: 'Sluttbredde (cm)',
}

export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

export function getFieldType(key: string): 'number' | 'text' {
  if (key.endsWith('_g') || key.endsWith('_cm') || key === 'gram_leire') return 'number'
  return 'text'
}
```

- [ ] **Step 9: Write test for field labels**

Create `src/tests/field-labels.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getFieldLabel, getFieldType } from '#/lib/field-labels'

describe('getFieldLabel', () => {
  it('returns known label for mapped key', () => {
    expect(getFieldLabel('gram_leire')).toBe('Gram leire')
    expect(getFieldLabel('slutthoyde_cm')).toBe('Slutthøyde (cm)')
  })

  it('falls back to formatted key for unknown keys', () => {
    expect(getFieldLabel('custom_field')).toBe('Custom field')
  })
})

describe('getFieldType', () => {
  it('returns number for measurement keys', () => {
    expect(getFieldType('gram_leire')).toBe('number')
    expect(getFieldType('hoyde_cm')).toBe('number')
    expect(getFieldType('sluttvekt_g')).toBe('number')
  })

  it('returns text for non-measurement keys', () => {
    expect(getFieldType('metode')).toBe('text')
    expect(getFieldType('ovn_detalj')).toBe('text')
  })
})
```

- [ ] **Step 10: Run test to verify it passes**

```bash
pnpm test -- src/tests/field-labels.test.ts
```

Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: project setup — supabase client, types, field labels, shadcn components"
```

---

### Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
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
```

- [ ] **Step 2: Run migration against Supabase**

Open Supabase dashboard → SQL Editor → paste and run `supabase/migrations/001_initial_schema.sql`.

Verify: tables visible under `pottery` schema, storage bucket `pottery-images` exists.

- [ ] **Step 3: Create two user accounts**

In Supabase dashboard → Authentication → Users → Create user (email/password) for both users.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: database schema, RLS, seed data, storage bucket"
```

---

### Task 3: Auth

**Files:**
- Create: `src/hooks/use-auth.ts`
- Create: `src/routes/login.tsx`
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Create `src/hooks/use-auth.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '#/lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false })
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { ...state, signIn, signOut }
}
```

- [ ] **Step 2: Create `src/routes/login.tsx`**

```typescript
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '#/hooks/use-auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.navigate({ to: '/' })
    }
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pottery Log</h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">Logg inn for å fortsette</p>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passord</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logger inn...' : 'Logg inn'}
        </Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Modify `src/routes/__root.tsx` — add auth guard**

Add the auth import and wrap children with auth check. Replace the `RootDocument` function body to conditionally render login:

```typescript
// Add imports at top:
import { useAuth } from '../hooks/use-auth'
import LoginPage from './login'

// In RootDocument, wrap children:
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <AuthGate>{children}</AuthGate>
        <Scripts />
      </body>
    </html>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (typeof window === 'undefined' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--sea-ink-soft)]">Laster...</p>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
          TanStackQueryDevtools,
        ]}
      />
    </>
  )
}
```

Note: move `<Header />`, `<Footer />`, and devtools INSIDE `AuthGate` so they only render when authenticated. Remove them from where they were before.

Also change `lang="en"` to `lang="no"` since the UI is Norwegian.

- [ ] **Step 4: Verify auth flow**

```bash
pnpm dev
```

Open http://localhost:3000 — should see login form. Log in with a created user — should see the home page. Refresh — should stay logged in.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-auth.ts src/routes/login.tsx src/routes/__root.tsx
git commit -m "feat: auth — login page, auth guard in root layout"
```

---

### Task 4: Image Upload Utility

**Files:**
- Create: `src/lib/image-utils.ts`
- Create: `src/tests/image-utils.test.ts`

- [ ] **Step 1: Create `src/lib/image-utils.ts`**

```typescript
import imageCompression from 'browser-image-compression'
import { supabase } from '#/lib/supabase'

const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1200,
  maxSizeMB: 0.3,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.8,
}

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS)
}

export async function uploadImage(
  file: File,
  path: string,
): Promise<{ path: string; error: Error | null }> {
  const compressed = await compressImage(file)

  const { data, error } = await supabase.storage
    .from('pottery-images')
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) return { path: '', error }
  return { path: data.path, error: null }
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage.from('pottery-images').getPublicUrl(path)
  return data.publicUrl
}

export function getSignedImageUrl(path: string): Promise<string> {
  return supabase.storage
    .from('pottery-images')
    .createSignedUrl(path, 3600)
    .then(({ data }) => data?.signedUrl ?? '')
}
```

- [ ] **Step 2: Write test for compression config**

Create `src/tests/image-utils.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('browser-image-compression', () => ({
  default: vi.fn((_file, options) => {
    expect(options.maxWidthOrHeight).toBe(1200)
    expect(options.initialQuality).toBe(0.8)
    expect(options.fileType).toBe('image/jpeg')
    return Promise.resolve(new File(['compressed'], 'test.jpg'))
  }),
}))

vi.mock('#/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed.jpg' } }),
      }),
    },
  },
}))

describe('image-utils', () => {
  it('compresses with correct options', async () => {
    const { compressImage } = await import('#/lib/image-utils')
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await compressImage(file)
    expect(result).toBeInstanceOf(File)
  })
})
```

- [ ] **Step 3: Run test**

```bash
pnpm test -- src/tests/image-utils.test.ts
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/image-utils.ts src/tests/image-utils.test.ts
git commit -m "feat: image compression + upload utility"
```

---

### Task 5: Query Hooks

**Files:**
- Create: `src/hooks/use-pieces.ts`
- Create: `src/hooks/use-tags.ts`
- Create: `src/hooks/use-clay-types.ts`
- Create: `src/hooks/use-stage-defaults.ts`

- [ ] **Step 1: Create `src/hooks/use-pieces.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import type { Piece, PieceWithRelations, PieceStage, PieceImage } from '#/types/database'

export function usePieces(filters?: { tagIds?: string[]; clayTypeId?: string; search?: string }) {
  return useQuery({
    queryKey: ['pieces', filters],
    queryFn: async () => {
      let query = supabase
        .from('pieces')
        .select('*')
        .schema('pottery')
        .order('created_at', { ascending: false })

      if (filters?.clayTypeId) {
        query = query.eq('clay_type_id', filters.clayTypeId)
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      // If tag filter, fetch piece_tags and filter client-side
      if (filters?.tagIds?.length && data) {
        const { data: pieceTags } = await supabase
          .from('piece_tags')
          .select('piece_id, tag_id')
          .schema('pottery')
          .in('tag_id', filters.tagIds)

        const pieceIdsWithTags = new Set(pieceTags?.map((pt) => pt.piece_id))
        return data.filter((p) => pieceIdsWithTags.has(p.id)) as Piece[]
      }

      return data as Piece[]
    },
  })
}

export function usePiece(id: string) {
  return useQuery({
    queryKey: ['piece', id],
    queryFn: async (): Promise<PieceWithRelations> => {
      const [pieceRes, stagesRes, imagesRes, tagsRes] = await Promise.all([
        supabase.from('pieces').select('*, clay_type:clay_types(*)').schema('pottery').eq('id', id).single(),
        supabase.from('piece_stages').select('*').schema('pottery').eq('piece_id', id).order('sort_order'),
        supabase.from('piece_images').select('*').schema('pottery').eq('piece_id', id).order('sort_order'),
        supabase.from('piece_tags').select('tag_id, tags(*, category:tag_categories(*))').schema('pottery').eq('piece_id', id),
      ])

      if (pieceRes.error) throw pieceRes.error

      return {
        ...pieceRes.data,
        stages: (stagesRes.data ?? []) as PieceStage[],
        images: (imagesRes.data ?? []) as PieceImage[],
        tags: (tagsRes.data ?? []).map((pt: any) => pt.tags),
      }
    },
    enabled: !!id,
  })
}

type CreatePieceInput = {
  title: string
  clay_type_id?: string | null
  piece_id_label?: string | null
  price?: number | null
  final_notes?: string | null
  display_image?: string | null
  stages: Omit<PieceStage, 'id' | 'piece_id' | 'created_at'>[]
  tag_ids: string[]
  images: { image_path: string; caption: string | null; sort_order: number }[]
}

export function useCreatePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePieceInput) => {
      const { stages, tag_ids, images, ...pieceData } = input

      const { data: piece, error } = await supabase
        .from('pieces')
        .insert(pieceData)
        .schema('pottery')
        .select()
        .single()

      if (error) throw error

      if (stages.length > 0) {
        const { error: stagesError } = await supabase
          .from('piece_stages')
          .insert(stages.map((s) => ({ ...s, piece_id: piece.id })))
          .schema('pottery')

        if (stagesError) throw stagesError
      }

      if (tag_ids.length > 0) {
        const { error: tagsError } = await supabase
          .from('piece_tags')
          .insert(tag_ids.map((tag_id) => ({ piece_id: piece.id, tag_id })))
          .schema('pottery')

        if (tagsError) throw tagsError
      }

      if (images.length > 0) {
        const { error: imagesError } = await supabase
          .from('piece_images')
          .insert(images.map((img) => ({ ...img, piece_id: piece.id })))
          .schema('pottery')

        if (imagesError) throw imagesError
      }

      return piece as Piece
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] })
    },
  })
}

export function useUpdatePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: CreatePieceInput & { id: string }) => {
      const { stages, tag_ids, images, ...pieceData } = input

      const { error } = await supabase
        .from('pieces')
        .update(pieceData)
        .schema('pottery')
        .eq('id', id)

      if (error) throw error

      // Replace stages
      await supabase.from('piece_stages').delete().schema('pottery').eq('piece_id', id)
      if (stages.length > 0) {
        await supabase
          .from('piece_stages')
          .insert(stages.map((s) => ({ ...s, piece_id: id })))
          .schema('pottery')
      }

      // Replace tags
      await supabase.from('piece_tags').delete().schema('pottery').eq('piece_id', id)
      if (tag_ids.length > 0) {
        await supabase
          .from('piece_tags')
          .insert(tag_ids.map((tag_id) => ({ piece_id: id, tag_id })))
          .schema('pottery')
      }

      // Replace extra images
      await supabase.from('piece_images').delete().schema('pottery').eq('piece_id', id)
      if (images.length > 0) {
        await supabase
          .from('piece_images')
          .insert(images.map((img) => ({ ...img, piece_id: id })))
          .schema('pottery')
      }

      return { id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] })
      queryClient.invalidateQueries({ queryKey: ['piece', variables.id] })
    },
  })
}

export function useDeletePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pieces').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] })
    },
  })
}
```

- [ ] **Step 2: Create `src/hooks/use-tags.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import type { Tag, TagCategory } from '#/types/database'

export function useTagCategories() {
  return useQuery({
    queryKey: ['tag-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('*')
        .schema('pottery')
        .order('name')
      if (error) throw error
      return data as TagCategory[]
    },
  })
}

export function useTags(categoryId?: string) {
  return useQuery({
    queryKey: ['tags', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('tags')
        .select('*, category:tag_categories(*)')
        .schema('pottery')
        .order('name')

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Tag[]
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; category_id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert(input)
        .schema('pottery')
        .select()
        .single()
      if (error) throw error
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useCreateTagCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; is_freeform: boolean }) => {
      const { data, error } = await supabase
        .from('tag_categories')
        .insert(input)
        .schema('pottery')
        .select()
        .single()
      if (error) throw error
      return data as TagCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-categories'] })
    },
  })
}

export function useDeleteTagCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tag_categories').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-categories'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
```

- [ ] **Step 3: Create `src/hooks/use-clay-types.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import type { ClayType } from '#/types/database'

export function useClayTypes() {
  return useQuery({
    queryKey: ['clay-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clay_types')
        .select('*')
        .schema('pottery')
        .order('name')
      if (error) throw error
      return data as ClayType[]
    },
  })
}

export function useCreateClayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('clay_types')
        .insert(input)
        .schema('pottery')
        .select()
        .single()
      if (error) throw error
      return data as ClayType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clay-types'] })
    },
  })
}

export function useDeleteClayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clay_types').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clay-types'] })
    },
  })
}
```

- [ ] **Step 4: Create `src/hooks/use-stage-defaults.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import type { StageDefault } from '#/types/database'

export function useStageDefaults() {
  return useQuery({
    queryKey: ['stage-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_defaults')
        .select('*')
        .schema('pottery')
        .order('sort_order')
      if (error) throw error
      return data as StageDefault[]
    },
  })
}

export function useCreateStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; default_fields: string[]; sort_order: number }) => {
      const { data, error } = await supabase
        .from('stage_defaults')
        .insert({ ...input, is_system: false })
        .schema('pottery')
        .select()
        .single()
      if (error) throw error
      return data as StageDefault
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}

export function useUpdateStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; default_fields: string[]; sort_order: number }) => {
      const { error } = await supabase
        .from('stage_defaults')
        .update(input)
        .schema('pottery')
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}

export function useDeleteStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stage_defaults').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}
```

- [ ] **Step 5: Verify hooks compile**

```bash
pnpm build
```

Expected: builds without type errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-pieces.ts src/hooks/use-tags.ts src/hooks/use-clay-types.ts src/hooks/use-stage-defaults.ts
git commit -m "feat: TanStack Query hooks for all CRUD operations"
```

---

### Task 6: Grid Overview Page

**Files:**
- Create: `src/components/PieceCard.tsx`
- Create: `src/components/FilterBar.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Create `src/components/PieceCard.tsx`**

```tsx
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { getSignedImageUrl } from '#/lib/image-utils'
import { useEffect, useState } from 'react'
import type { Piece } from '#/types/database'

export function PieceCard({ piece }: { piece: Piece }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (piece.display_image) {
      getSignedImageUrl(piece.display_image).then(setImageUrl)
    }
  }, [piece.display_image])

  return (
    <Link to="/pieces/$id" params={{ id: piece.id }} className="no-underline">
      <Card className="overflow-hidden transition hover:shadow-md">
        <div className="aspect-square bg-[var(--sand)]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={piece.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              Ingen bilde
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium text-[var(--sea-ink)] truncate">{piece.title}</p>
          {piece.piece_id_label && (
            <p className="text-xs text-[var(--sea-ink-soft)]">{piece.piece_id_label}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Create `src/components/FilterBar.tsx`**

```tsx
import { Input } from '#/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { useClayTypes } from '#/hooks/use-clay-types'
import { useTags } from '#/hooks/use-tags'
import { useTagCategories } from '#/hooks/use-tags'
import { Badge } from '#/components/ui/badge'
import { X } from 'lucide-react'

type FilterState = {
  search: string
  clayTypeId: string | undefined
  tagIds: string[]
}

type FilterBarProps = {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: clayTypes } = useClayTypes()
  const { data: tags } = useTags()
  const { data: categories } = useTagCategories()

  const managedCategories = categories?.filter((c) => !c.is_freeform) ?? []

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Søk..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-full sm:w-48"
      />

      <Select
        value={filters.clayTypeId ?? 'all'}
        onValueChange={(v) => onChange({ ...filters, clayTypeId: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Leiretype" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle leiretyper</SelectItem>
          {clayTypes?.map((ct) => (
            <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {managedCategories.map((cat) => {
        const catTags = tags?.filter((t) => t.category_id === cat.id) ?? []
        if (catTags.length === 0) return null

        return (
          <Select
            key={cat.id}
            value={filters.tagIds.find((id) => catTags.some((t) => t.id === id)) ?? 'all'}
            onValueChange={(v) => {
              const otherTagIds = filters.tagIds.filter((id) => !catTags.some((t) => t.id === id))
              const newTagIds = v === 'all' ? otherTagIds : [...otherTagIds, v]
              onChange({ ...filters, tagIds: newTagIds })
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={cat.name} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle {cat.name.toLowerCase()}</SelectItem>
              {catTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}

      {filters.tagIds.length > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...filters, tagIds: [] })}
          className="text-xs text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
        >
          Nullstill filter
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/routes/index.tsx`**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { usePieces } from '#/hooks/use-pieces'
import { PieceCard } from '#/components/PieceCard'
import { FilterBar } from '#/components/FilterBar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/')({ component: GridOverview })

function GridOverview() {
  const [filters, setFilters] = useState({
    search: '',
    clayTypeId: undefined as string | undefined,
    tagIds: [] as string[],
  })

  const { data: pieces, isLoading } = usePieces({
    search: filters.search || undefined,
    clayTypeId: filters.clayTypeId,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pottery Log</h1>
        <Link to="/pieces/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Ny
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : pieces?.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <p className="text-[var(--sea-ink-soft)]">Ingen produkter ennå</p>
          <Link to="/pieces/new" className="mt-2">
            <Button variant="outline" size="sm">Legg til ditt første produkt</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pieces?.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Verify grid page renders**

```bash
pnpm dev
```

Open http://localhost:3000 — should see empty grid with "Ingen produkter ennå" message, filter bar, and "+ Ny" button.

- [ ] **Step 5: Commit**

```bash
git add src/components/PieceCard.tsx src/components/FilterBar.tsx src/routes/index.tsx
git commit -m "feat: grid overview page with filtering and search"
```

---

### Task 7: Detail Page

**Files:**
- Create: `src/components/StageSection.tsx`
- Create: `src/routes/pieces.$id.index.tsx`

- [ ] **Step 1: Create `src/components/StageSection.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { getSignedImageUrl } from '#/lib/image-utils'
import { getFieldLabel, getFieldType } from '#/lib/field-labels'
import { Separator } from '#/components/ui/separator'
import type { PieceStage } from '#/types/database'

export function StageSection({ stage }: { stage: PieceStage }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (stage.image_path) {
      getSignedImageUrl(stage.image_path).then(setImageUrl)
    }
  }, [stage.image_path])

  const fieldEntries = Object.entries(stage.fields).filter(([_, v]) => v !== null && v !== '')

  return (
    <section>
      <Separator className="my-4" />
      <h3 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">{stage.title}</h3>

      <div className="flex flex-col gap-4 sm:flex-row">
        {stage.image_path && (
          <div className="w-full flex-shrink-0 sm:w-48">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={stage.title}
                className="w-full rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-square rounded-lg bg-[var(--sand)]" />
            )}
          </div>
        )}

        <div className="flex-1 space-y-2">
          {fieldEntries.length > 0 && (
            <dl className="space-y-1">
              {fieldEntries.map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <dt className="font-medium text-[var(--sea-ink)]">{getFieldLabel(key)}:</dt>
                  <dd className="text-[var(--sea-ink-soft)]">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {stage.notes && (
            <div className="text-sm">
              <p className="font-medium text-[var(--sea-ink)]">Notater:</p>
              <p className="whitespace-pre-wrap text-[var(--sea-ink-soft)]">{stage.notes}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `src/routes/pieces.$id.index.tsx`**

```tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { usePiece, useDeletePiece } from '#/hooks/use-pieces'
import { StageSection } from '#/components/StageSection'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Separator } from '#/components/ui/separator'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { getSignedImageUrl } from '#/lib/image-utils'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/pieces/$id/')({
  component: PieceDetailPage,
})

function PieceDetailPage() {
  const { id } = Route.useParams()
  const { data: piece, isLoading } = usePiece(id)
  const deletePiece = useDeletePiece()
  const router = useRouter()

  if (isLoading) {
    return (
      <main className="page-wrap px-4 pb-8 pt-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
  }

  if (!piece) {
    return (
      <main className="page-wrap px-4 pb-8 pt-6">
        <p>Fant ikke produktet.</p>
        <Link to="/">Tilbake</Link>
      </main>
    )
  }

  async function handleDelete() {
    if (!confirm('Slett dette produktet?')) return
    await deletePiece.mutateAsync(id)
    router.navigate({ to: '/' })
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/" className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-bold text-[var(--sea-ink)]">{piece.title}</h1>
        <Link to="/pieces/$id/edit" params={{ id }}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1 h-4 w-4" /> Rediger
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Metadata */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {piece.tags.map((tag) => (
          <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
        ))}
        {piece.piece_id_label && (
          <span className="text-[var(--sea-ink-soft)]">ID: {piece.piece_id_label}</span>
        )}
        {piece.price != null && (
          <span className="text-[var(--sea-ink-soft)]">Pris: {piece.price} kr</span>
        )}
        {piece.clay_type && (
          <span className="text-[var(--sea-ink-soft)]">{piece.clay_type.name}</span>
        )}
      </div>

      {/* Stages */}
      {piece.stages.map((stage) => (
        <StageSection key={stage.id} stage={stage} />
      ))}

      {/* Slutttanker */}
      {piece.final_notes && (
        <>
          <Separator className="my-4" />
          <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">Slutttanker</h3>
          <p className="whitespace-pre-wrap text-sm text-[var(--sea-ink-soft)]">{piece.final_notes}</p>
        </>
      )}

      {/* Extra images */}
      {piece.images.length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Ekstra bilder</h3>
          <ExtraImagesGallery images={piece.images} />
        </>
      )}
    </main>
  )
}

function ExtraImagesGallery({ images }: { images: { image_path: string; caption: string | null }[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    images.forEach((img) => {
      getSignedImageUrl(img.image_path).then((url) => {
        setUrls((prev) => ({ ...prev, [img.image_path]: url }))
      })
    })
  }, [images])

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((img) => (
        <div key={img.image_path}>
          {urls[img.image_path] ? (
            <img
              src={urls[img.image_path]}
              alt={img.caption ?? 'Ekstra bilde'}
              className="aspect-square w-full rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="aspect-square rounded-lg bg-[var(--sand)]" />
          )}
          {img.caption && (
            <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{img.caption}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify detail page renders**

```bash
pnpm dev
```

Navigate to `/pieces/some-uuid` — should show "Fant ikke produktet" (since no data yet). Route itself should not error.

- [ ] **Step 4: Commit**

```bash
git add src/components/StageSection.tsx src/routes/pieces.\$id.index.tsx
git commit -m "feat: piece detail page with stages, metadata, extra images"
```

---

### Task 8: Create + Edit Piece

**Files:**
- Create: `src/components/ImageUpload.tsx`
- Create: `src/components/TagSelect.tsx`
- Create: `src/components/StageEditor.tsx`
- Create: `src/components/PieceForm.tsx`
- Create: `src/routes/pieces.new.tsx`
- Create: `src/routes/pieces.$id.edit.tsx`

- [ ] **Step 1: Create `src/components/ImageUpload.tsx`**

```tsx
import { useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { ImagePlus, X } from 'lucide-react'

type ImageUploadProps = {
  value: File | string | null  // File = new upload, string = existing path
  onChange: (file: File | null) => void
  previewUrl?: string | null
}

export function ImageUpload({ value, onChange, previewUrl }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      onChange(file)
      setLocalPreview(URL.createObjectURL(file))
    }
  }

  function handleRemove() {
    onChange(null)
    setLocalPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayUrl = localPreview ?? previewUrl

  return (
    <div className="relative">
      {displayUrl ? (
        <div className="relative">
          <img src={displayUrl} alt="Forhåndsvisning" className="w-full rounded-lg object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] bg-[var(--sand)] text-[var(--sea-ink-soft)] hover:border-[var(--lagoon)]"
        >
          <ImagePlus className="h-8 w-8" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/TagSelect.tsx`**

```tsx
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useTags, useTagCategories, useCreateTag } from '#/hooks/use-tags'
import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { Tag } from '#/types/database'

type TagSelectProps = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function TagSelect({ selectedIds, onChange }: TagSelectProps) {
  const { data: tags } = useTags()
  const { data: categories } = useTagCategories()
  const createTag = useCreateTag()
  const [newTagName, setNewTagName] = useState('')
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null)

  const selectedTags = tags?.filter((t) => selectedIds.includes(t.id)) ?? []

  function toggle(tagId: string) {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedIds, tagId])
    }
  }

  async function handleCreateTag(categoryId: string) {
    if (!newTagName.trim()) return
    const tag = await createTag.mutateAsync({ name: newTagName.trim(), category_id: categoryId })
    onChange([...selectedIds, tag.id])
    setNewTagName('')
    setAddingToCategory(null)
  }

  return (
    <div className="space-y-3">
      {categories?.map((cat) => {
        const catTags = tags?.filter((t) => t.category_id === cat.id) ?? []
        return (
          <div key={cat.id}>
            <p className="mb-1 text-xs font-medium uppercase text-[var(--sea-ink-soft)]">{cat.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {catTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedIds.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggle(tag.id)}
                >
                  {tag.name}
                  {selectedIds.includes(tag.id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
              {addingToCategory === cat.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag(cat.id)}
                    placeholder="Ny tag..."
                    className="h-6 w-24 text-xs"
                    autoFocus
                  />
                  <Button size="xs" onClick={() => handleCreateTag(cat.id)}>OK</Button>
                  <Button size="xs" variant="ghost" onClick={() => setAddingToCategory(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-dashed"
                  onClick={() => setAddingToCategory(cat.id)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Ny
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/StageEditor.tsx`**

```tsx
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { ImageUpload } from '#/components/ImageUpload'
import { getFieldLabel, getFieldType } from '#/lib/field-labels'
import { Trash2, GripVertical } from 'lucide-react'

export type StageFormData = {
  stage_def_id: string | null
  title: string
  image: File | string | null  // File = new, string = existing path
  fields: Record<string, string | number>
  notes: string
  sort_order: number
}

type StageEditorProps = {
  stage: StageFormData
  onChange: (stage: StageFormData) => void
  onRemove: () => void
  previewUrl?: string | null
}

export function StageEditor({ stage, onChange, onRemove, previewUrl }: StageEditorProps) {
  const fieldKeys = Object.keys(stage.fields)

  return (
    <div className="rounded-lg border border-[var(--line)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-[var(--sea-ink-soft)]" />
        <Input
          value={stage.title}
          onChange={(e) => onChange({ ...stage, title: e.target.value })}
          className="flex-1 font-semibold"
          placeholder="Stadienavn"
        />
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-40">
          <ImageUpload
            value={stage.image}
            onChange={(file) => onChange({ ...stage, image: file })}
            previewUrl={previewUrl}
          />
        </div>

        <div className="flex-1 space-y-3">
          {fieldKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="w-32 flex-shrink-0 text-xs">{getFieldLabel(key)}</Label>
              <Input
                type={getFieldType(key) === 'number' ? 'number' : 'text'}
                value={stage.fields[key] ?? ''}
                onChange={(e) => {
                  const val = getFieldType(key) === 'number' && e.target.value
                    ? Number(e.target.value)
                    : e.target.value
                  onChange({ ...stage, fields: { ...stage.fields, [key]: val } })
                }}
                className="h-8 text-sm"
              />
            </div>
          ))}

          <div>
            <Label className="text-xs">Notater</Label>
            <Textarea
              value={stage.notes}
              onChange={(e) => onChange({ ...stage, notes: e.target.value })}
              rows={3}
              className="text-sm"
              placeholder="Skriv notater..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/PieceForm.tsx`**

```tsx
import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { StageEditor, type StageFormData } from '#/components/StageEditor'
import { TagSelect } from '#/components/TagSelect'
import { ImageUpload } from '#/components/ImageUpload'
import { useClayTypes } from '#/hooks/use-clay-types'
import { useStageDefaults } from '#/hooks/use-stage-defaults'
import { uploadImage } from '#/lib/image-utils'
import { useAuth } from '#/hooks/use-auth'
import { Plus } from 'lucide-react'
import { Separator } from '#/components/ui/separator'
import type { PieceWithRelations } from '#/types/database'

type PieceFormProps = {
  initialData?: PieceWithRelations
  onSubmit: (data: {
    title: string
    clay_type_id: string | null
    piece_id_label: string | null
    price: number | null
    final_notes: string | null
    display_image: string | null
    stages: { stage_def_id: string | null; title: string; image_path: string | null; fields: Record<string, string | number>; notes: string | null; sort_order: number }[]
    tag_ids: string[]
    images: { image_path: string; caption: string | null; sort_order: number }[]
  }) => Promise<void>
  submitLabel: string
}

export function PieceForm({ initialData, onSubmit, submitLabel }: PieceFormProps) {
  const { data: clayTypes } = useClayTypes()
  const { data: stageDefaults } = useStageDefaults()
  const { user } = useAuth()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [clayTypeId, setClayTypeId] = useState<string | null>(initialData?.clay_type_id ?? null)
  const [pieceIdLabel, setPieceIdLabel] = useState(initialData?.piece_id_label ?? '')
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '')
  const [finalNotes, setFinalNotes] = useState(initialData?.final_notes ?? '')
  const [tagIds, setTagIds] = useState<string[]>(initialData?.tags.map((t) => t.id) ?? [])
  const [submitting, setSubmitting] = useState(false)

  const [stages, setStages] = useState<StageFormData[]>(
    initialData?.stages.map((s) => ({
      stage_def_id: s.stage_def_id,
      title: s.title,
      image: s.image_path,
      fields: s.fields,
      notes: s.notes ?? '',
      sort_order: s.sort_order,
    })) ?? [],
  )

  const [extraImages, setExtraImages] = useState<{ file: File | string; caption: string }[]>(
    initialData?.images.map((img) => ({ file: img.image_path, caption: img.caption ?? '' })) ?? [],
  )

  function addStageFromDefault(defId: string) {
    const def = stageDefaults?.find((d) => d.id === defId)
    if (!def) return
    const fields: Record<string, string | number> = {}
    for (const key of def.default_fields) {
      fields[key] = ''
    }
    setStages([
      ...stages,
      {
        stage_def_id: defId,
        title: def.name,
        image: null,
        fields,
        notes: '',
        sort_order: stages.length,
      },
    ])
  }

  function addCustomStage() {
    setStages([
      ...stages,
      {
        stage_def_id: null,
        title: '',
        image: null,
        fields: {},
        notes: '',
        sort_order: stages.length,
      },
    ])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const pieceId = initialData?.id ?? crypto.randomUUID()

      // Upload stage images
      const processedStages = await Promise.all(
        stages.map(async (stage, i) => {
          let imagePath = typeof stage.image === 'string' ? stage.image : null

          if (stage.image instanceof File) {
            const path = `${user!.id}/${pieceId}/stages/${crypto.randomUUID()}.jpg`
            const result = await uploadImage(stage.image, path)
            if (!result.error) imagePath = result.path
          }

          return {
            stage_def_id: stage.stage_def_id,
            title: stage.title,
            image_path: imagePath,
            fields: stage.fields,
            notes: stage.notes || null,
            sort_order: i,
          }
        }),
      )

      // Upload extra images
      const processedImages = await Promise.all(
        extraImages
          .filter((img) => img.file)
          .map(async (img, i) => {
            let imagePath = typeof img.file === 'string' ? img.file : ''

            if (img.file instanceof File) {
              const path = `${user!.id}/${pieceId}/extra/${crypto.randomUUID()}.jpg`
              const result = await uploadImage(img.file, path)
              if (!result.error) imagePath = result.path
            }

            return { image_path: imagePath, caption: img.caption || null, sort_order: i }
          }),
      )

      // Determine display image: last stage with image, or null
      const lastStageWithImage = [...processedStages].reverse().find((s) => s.image_path)
      const displayImage = lastStageWithImage?.image_path ?? initialData?.display_image ?? null

      await onSubmit({
        title,
        clay_type_id: clayTypeId,
        piece_id_label: pieceIdLabel || null,
        price: price ? Number(price) : null,
        final_notes: finalNotes || null,
        display_image: displayImage,
        stages: processedStages,
        tag_ids: tagIds,
        images: processedImages,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const unusedDefaults = stageDefaults?.filter(
    (d) => !stages.some((s) => s.stage_def_id === d.id),
  ) ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tittel *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="F.eks. Kaffekopp #5" />
        </div>
        <div className="space-y-2">
          <Label>ID-merking</Label>
          <Input value={pieceIdLabel} onChange={(e) => setPieceIdLabel(e.target.value)} placeholder="F.eks. 2024-03" />
        </div>
        <div className="space-y-2">
          <Label>Leiretype</Label>
          <Select value={clayTypeId ?? 'none'} onValueChange={(v) => setClayTypeId(v === 'none' ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Velg leiretype" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ingen valgt</SelectItem>
              {clayTypes?.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pris (kr)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="mb-2 block">Tags</Label>
        <TagSelect selectedIds={tagIds} onChange={setTagIds} />
      </div>

      <Separator />

      {/* Stages */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Stadier</h2>
        <div className="space-y-4">
          {stages.map((stage, i) => (
            <StageEditor
              key={i}
              stage={stage}
              onChange={(updated) => {
                const next = [...stages]
                next[i] = updated
                setStages(next)
              }}
              onRemove={() => setStages(stages.filter((_, j) => j !== i))}
              previewUrl={typeof stage.image === 'string' ? stage.image : undefined}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {unusedDefaults.map((def) => (
            <Button key={def.id} type="button" variant="outline" size="sm" onClick={() => addStageFromDefault(def.id)}>
              <Plus className="mr-1 h-3 w-3" /> {def.name}
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCustomStage}>
            <Plus className="mr-1 h-3 w-3" /> Egendefinert
          </Button>
        </div>
      </div>

      <Separator />

      {/* Extra images */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Ekstra bilder</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {extraImages.map((img, i) => (
            <div key={i} className="relative">
              <ImageUpload
                value={img.file}
                onChange={(file) => {
                  if (!file) {
                    setExtraImages(extraImages.filter((_, j) => j !== i))
                  } else {
                    const next = [...extraImages]
                    next[i] = { ...next[i], file }
                    setExtraImages(next)
                  }
                }}
              />
              <Input
                value={img.caption}
                onChange={(e) => {
                  const next = [...extraImages]
                  next[i] = { ...next[i], caption: e.target.value }
                  setExtraImages(next)
                }}
                placeholder="Bildetekst..."
                className="mt-1 h-7 text-xs"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setExtraImages([...extraImages, { file: null as any, caption: '' }])}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] text-[var(--sea-ink-soft)]"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Separator />

      {/* Final notes */}
      <div className="space-y-2">
        <Label>Slutttanker</Label>
        <Textarea
          value={finalNotes}
          onChange={(e) => setFinalNotes(e.target.value)}
          rows={4}
          placeholder="Refleksjoner, forbedringer til neste gang..."
        />
      </div>

      <Button type="submit" disabled={submitting || !title.trim()} className="w-full">
        {submitting ? 'Lagrer...' : submitLabel}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Create `src/routes/pieces.new.tsx`**

```tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { PieceForm } from '#/components/PieceForm'
import { useCreatePiece } from '#/hooks/use-pieces'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/pieces/new')({
  component: NewPiecePage,
})

function NewPiecePage() {
  const createPiece = useCreatePiece()
  const router = useRouter()

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/" className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Nytt produkt</h1>
      </div>

      <PieceForm
        submitLabel="Opprett"
        onSubmit={async (data) => {
          const piece = await createPiece.mutateAsync(data)
          router.navigate({ to: '/pieces/$id', params: { id: piece.id } })
        }}
      />
    </main>
  )
}
```

- [ ] **Step 6: Create `src/routes/pieces.$id.edit.tsx`**

```tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { PieceForm } from '#/components/PieceForm'
import { usePiece, useUpdatePiece } from '#/hooks/use-pieces'
import { Skeleton } from '#/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/pieces/$id/edit')({
  component: EditPiecePage,
})

function EditPiecePage() {
  const { id } = Route.useParams()
  const { data: piece, isLoading } = usePiece(id)
  const updatePiece = useUpdatePiece()
  const router = useRouter()

  if (isLoading) {
    return (
      <main className="page-wrap px-4 pb-8 pt-6">
        <Skeleton className="h-8 w-48" />
      </main>
    )
  }

  if (!piece) {
    return (
      <main className="page-wrap px-4 pb-8 pt-6">
        <p>Fant ikke produktet.</p>
        <Link to="/">Tilbake</Link>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/pieces/$id" params={{ id }} className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Rediger: {piece.title}</h1>
      </div>

      <PieceForm
        initialData={piece}
        submitLabel="Lagre endringer"
        onSubmit={async (data) => {
          await updatePiece.mutateAsync({ id, ...data })
          router.navigate({ to: '/pieces/$id', params: { id } })
        }}
      />
    </main>
  )
}
```

- [ ] **Step 7: Verify create flow**

```bash
pnpm dev
```

Navigate to `/pieces/new` — form should render with stage template buttons and all fields. Try adding a stage, filling fields.

- [ ] **Step 8: Commit**

```bash
git add src/components/ImageUpload.tsx src/components/TagSelect.tsx src/components/StageEditor.tsx src/components/PieceForm.tsx src/routes/pieces.new.tsx src/routes/pieces.\$id.edit.tsx
git commit -m "feat: create + edit piece — form, stages, tags, image upload"
```

---

### Task 9: Settings Page

**Files:**
- Create: `src/routes/settings.tsx`

- [ ] **Step 1: Create `src/routes/settings.tsx`**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { useClayTypes, useCreateClayType, useDeleteClayType } from '#/hooks/use-clay-types'
import { useTags, useTagCategories, useCreateTag, useDeleteTag, useCreateTagCategory, useDeleteTagCategory } from '#/hooks/use-tags'
import { useStageDefaults, useCreateStageDefault, useDeleteStageDefault, useUpdateStageDefault } from '#/hooks/use-stage-defaults'
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/" className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Innstillinger</h1>
      </div>

      <div className="space-y-8">
        <ClayTypesSection />
        <Separator />
        <TagsSection />
        <Separator />
        <StageDefaultsSection />
      </div>
    </main>
  )
}

function ClayTypesSection() {
  const { data: clayTypes } = useClayTypes()
  const createClayType = useCreateClayType()
  const deleteClayType = useDeleteClayType()
  const [newName, setNewName] = useState('')

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Leiretyper</h2>
      <div className="space-y-2">
        {clayTypes?.map((ct) => (
          <div key={ct.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2">
            <span className="text-sm">{ct.name}</span>
            <Button variant="ghost" size="sm" onClick={() => deleteClayType.mutate(ct.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ny leiretype..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) {
              createClayType.mutate({ name: newName.trim() })
              setNewName('')
            }
          }}
        />
        <Button
          onClick={() => {
            if (newName.trim()) {
              createClayType.mutate({ name: newName.trim() })
              setNewName('')
            }
          }}
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" /> Legg til
        </Button>
      </div>
    </section>
  )
}

function TagsSection() {
  const { data: categories } = useTagCategories()
  const { data: tags } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()
  const createCategory = useCreateTagCategory()
  const deleteCategory = useDeleteTagCategory()
  const [newTagNames, setNewTagNames] = useState<Record<string, string>>({})
  const [newCatName, setNewCatName] = useState('')

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Tags</h2>

      {categories?.map((cat) => {
        const catTags = tags?.filter((t) => t.category_id === cat.id) ?? []
        return (
          <div key={cat.id} className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-medium text-[var(--sea-ink)]">
                {cat.name} {cat.is_freeform && <span className="text-xs text-[var(--sea-ink-soft)]">(fritekst)</span>}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => deleteCategory.mutate(cat.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {catTags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                  {tag.name}
                  <button type="button" onClick={() => deleteTag.mutate(tag.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTagNames[cat.id] ?? ''}
                onChange={(e) => setNewTagNames({ ...newTagNames, [cat.id]: e.target.value })}
                placeholder="Ny tag..."
                className="h-8 w-40 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagNames[cat.id]?.trim()) {
                    createTag.mutate({ name: newTagNames[cat.id].trim(), category_id: cat.id })
                    setNewTagNames({ ...newTagNames, [cat.id]: '' })
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newTagNames[cat.id]?.trim()) {
                    createTag.mutate({ name: newTagNames[cat.id].trim(), category_id: cat.id })
                    setNewTagNames({ ...newTagNames, [cat.id]: '' })
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })}

      <Separator className="my-3" />
      <div className="flex gap-2">
        <Input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="Ny kategori..."
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => {
            if (newCatName.trim()) {
              createCategory.mutate({ name: newCatName.trim(), is_freeform: false })
              setNewCatName('')
            }
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Kategori
        </Button>
      </div>
    </section>
  )
}

function StageDefaultsSection() {
  const { data: defaults } = useStageDefaults()
  const createDefault = useCreateStageDefault()
  const deleteDefault = useDeleteStageDefault()
  const [newName, setNewName] = useState('')

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Standard-stadier</h2>
      <div className="space-y-2">
        {defaults?.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2">
            <div>
              <span className="text-sm font-medium">{d.name}</span>
              {d.is_system && <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">(system)</span>}
              <p className="text-xs text-[var(--sea-ink-soft)]">
                Felt: {(d.default_fields as string[]).join(', ') || 'ingen'}
              </p>
            </div>
            {!d.is_system && (
              <Button variant="ghost" size="sm" onClick={() => deleteDefault.mutate(d.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nytt stadium..."
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => {
            if (newName.trim()) {
              createDefault.mutate({
                name: newName.trim(),
                default_fields: [],
                sort_order: (defaults?.length ?? 0) + 1,
              })
              setNewName('')
            }
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Legg til
        </Button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify settings page**

```bash
pnpm dev
```

Navigate to `/settings` — should see seeded clay types, tag categories, and stage defaults. Try adding/removing items.

- [ ] **Step 3: Commit**

```bash
git add src/routes/settings.tsx
git commit -m "feat: settings page — manage clay types, tags, stage defaults"
```

---

### Task 10: Navigation Update + Cleanup

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/routes/__root.tsx` (title)
- Delete: demo files

- [ ] **Step 1: Update `src/components/Header.tsx`**

Replace the entire component with:

```tsx
import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '#/hooks/use-auth'
import { Button } from '#/components/ui/button'
import { Settings, LogOut } from 'lucide-react'

export default function Header() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-3 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Pottery Log
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/settings"
            className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Update page title in `__root.tsx`**

Change the `title` meta tag from `'TanStack Start Starter'` to `'Pottery Log'`.

- [ ] **Step 3: Delete demo files**

```bash
rm -rf src/routes/demo/ src/routes/about.tsx src/routes/mcp.ts
rm -rf src/hooks/demo.form.ts src/hooks/demo.form-context.ts
rm -rf src/components/demo.FormComponents.tsx
rm -rf src/data/demo-table-data.ts
rm -rf src/mcp-todos.ts src/utils/mcp-handler.ts
```

- [ ] **Step 4: Verify app compiles and runs**

```bash
pnpm build
pnpm dev
```

Expected: no build errors, app runs with updated nav showing "Pottery Log", settings icon, and logout button. No demo routes accessible.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: update nav, set title, remove demo routes"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

- [ ] Login with email/password → redirects to grid
- [ ] Grid shows "Ingen produkter ennå" when empty
- [ ] Settings → add a new glaze tag (e.g. "Textured Turquoise" in Glasur category)
- [ ] Create a piece with 2 stages, upload images, add tags → redirects to detail page
- [ ] Detail page shows all stages with images, fields, notes, tags
- [ ] Grid now shows the piece with display image
- [ ] Filter by tag → piece appears/disappears
- [ ] Edit piece → change title → verify change persists
- [ ] Delete piece → redirects to grid, piece gone
- [ ] Test on mobile viewport (Chrome DevTools responsive mode) → layout is usable
- [ ] Logout → shows login page
