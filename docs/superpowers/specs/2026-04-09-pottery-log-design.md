# Pottery Log — Design Spec

## Context

User documents ceramic pieces across production stages (throwing, trimming, glazing, firing) to create a reproducible recipe book. Currently scattered across Joplin, Obsidian, and NocoDB. Needs a single app connecting images with structured production data, usable on mobile with bad internet.

## Overview

A ceramic recipe book web app. Grid overview of all pieces → detail page per piece showing production stages with images and structured data. Backed by self-hosted Supabase (own `pottery` schema). Norwegian UI, English app name.

## Architecture

```
React (Vite + TanStack Start) → @supabase/supabase-js → Supabase
                                    ├── Postgres (pottery schema)
                                    ├── Storage (pottery-images bucket)
                                    └── Auth (email/password)
```

- **Supabase-direct**: no custom API layer. React client calls Supabase JS SDK directly.
- **TanStack Query**: wraps all Supabase calls for caching, background refetch, optimistic updates.
- **TanStack Form + Zod**: create/edit forms with validation.
- **TanStack Router**: file-based routing (already set up).
- **Client-side image compression**: `browser-image-compression` — resize to ~1200px, 80% JPEG before upload. No originals kept.
- **RLS**: all `pottery.*` tables. Both users read/write all data. `created_by` tracks authorship.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Grid overview. Display image + title per piece. Filter by tags, clay type. Search by title. |
| `/pieces/:id` | Detail page. Stages with image + fields + notes. Extra images gallery. Slutttanker. |
| `/pieces/new` | Create new piece. Select stage templates, fill in data, upload images. |
| `/pieces/:id/edit` | Edit existing piece. Same form as create, pre-filled. |
| `/settings` | Admin: manage glazes, clay types, default stages, tag categories. |

## Data Model (pottery schema)

### pieces

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | Required |
| display_image | text | Storage path to grid thumbnail |
| clay_type_id | uuid FK → clay_types | Nullable |
| piece_id_label | text | User's own ID (e.g. "2024-03") |
| price | numeric | Nullable |
| final_notes | text | "Slutttanker" |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid FK → auth.users | |

### piece_stages

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| piece_id | uuid FK → pieces | ON DELETE CASCADE |
| stage_def_id | uuid FK → stage_defaults | Nullable (custom stages) |
| title | text | Display name, can override default |
| image_path | text | One image per stage, Supabase Storage path |
| fields | jsonb | Key-value structured data, e.g. `{"gram_leire": 400, "hoyde_cm": 15}` |
| notes | text | Freetext notes |
| sort_order | int | |
| created_at | timestamptz | |

### piece_images

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| piece_id | uuid FK → pieces | ON DELETE CASCADE |
| image_path | text | Supabase Storage path |
| caption | text | Optional label (e.g. "Detaljbilde", "Etter trimming") |
| sort_order | int | |
| created_at | timestamptz | |

### stage_defaults

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "Dreiing", "Glasering", "Brenning" |
| default_fields | jsonb | Field template, e.g. `["gram_leire", "etter_dreiing_g", "hoyde_cm", "bredde_cm"]` |
| sort_order | int | |
| is_system | bool | System defaults can't be deleted |

### tags

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| category_id | uuid FK → tag_categories | |
| created_by | uuid FK → auth.users | |

### tag_categories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "Glasur", "Form", "Fritekst" |
| is_freeform | bool | true = autocomplete from existing, false = managed list |

### piece_tags (junction)

| Column | Type | Notes |
|--------|------|-------|
| piece_id | uuid FK → pieces | ON DELETE CASCADE |
| tag_id | uuid FK → tags | |
| | | PK: (piece_id, tag_id) |

### clay_types

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "Leigods", "Steingods" |
| description | text | Optional |

## Supabase Storage

```
bucket: pottery-images/
  └── {user_id}/
      └── {piece_id}/
          ├── stages/
          │   ├── {stage_id}.jpg
          │   └── ...
          └── extra/
              ├── {image_id}.jpg
              └── ...
```

RLS on bucket: authenticated users can read/write all files.

## Auth

- Supabase Auth, email/password.
- 2 users, shared data. No per-user isolation.
- RLS policy: `auth.uid() IS NOT NULL` for all operations on `pottery.*` tables.
- `created_by` set automatically on insert via default or trigger.

## Detail Page Layout

Based on hand-drawn mockup:

```
┌──────────────────────────────────┐
│  Header: title, tags, ID, pris   │
├──────────────────────────────────┤
│                                  │
│  ── Dreiing ──────────────────   │
│  [image]  | gram leire: 400g    │
│           | etter dreiing: 380g  │
│           | høyde: 15cm          │
│           | bredde: 10cm         │
│           | notater: ...         │
│                                  │
│  ── Glasering ────────────────   │
│  [image]  | glasur: TT, HF      │
│           | 3 x HF, 3 x 55      │
│           | notater: ...         │
│                                  │
│  ── Brenning ─────────────────   │
│  [image]  | brann temp: Kon 6   │
│           | ovn detalj: halvfull │
│           | sluttvekt: 320g      │
│           | slutthøyde: 12cm     │
│           | sluttbredde: 9cm     │
│                                  │
│  ── Slutttanker ──────────────   │
│  Freetext reflections            │
│                                  │
│  ── Ekstra bilder ────────────   │
│  [thumb] [thumb] [thumb]         │
└──────────────────────────────────┘
```

Mobile: image stacks above fields. Desktop: side-by-side.

## Grid Overview Layout

- Responsive grid: 2 cols mobile, 3-4 cols desktop
- Each card: display image + title
- Filter bar: tag categories as dropdowns, clay type dropdown, text search
- "+ Ny" button to create

## Settings Page

- **Glasurer**: CRUD for tags in "Glasur" category
- **Leiretyper**: CRUD for clay_types
- **Standard-stadier**: CRUD for stage_defaults (reorder, rename, edit default_fields). System ones undeletable.
- **Tag-kategorier**: CRUD for tag_categories

## Image Handling

- Client-side compression before upload: `browser-image-compression`
- Max width 1200px, JPEG quality 80%
- No originals kept
- Grid thumbnails: same compressed images (further CSS sizing)
- `display_image`: defaults to last stage's image. User can override by picking any stage/extra image.

## Supabase Config

- `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Supabase client initialized once in `src/lib/supabase.ts`

## Stage Field Conventions

- `default_fields` is an array of field key strings: `["gram_leire", "hoyde_cm"]`
- Field labels derived from keys by convention: `gram_leire` → "Gram leire", `hoyde_cm` → "Høyde (cm)"
- Label mapping lives in a frontend constant, not in the DB
- Field values in JSONB are mixed types: numbers for measurements, strings for text fields (e.g. `glasur_filter`, `metode`)

## Seed Data

### stage_defaults
1. Dreiing — `["gram_leire", "etter_dreiing_g", "hoyde_cm", "bredde_cm"]`
2. Trimming — `["hoyde_cm", "bredde_cm"]`
3. Bisque-brenning — `["brann_temp", "ovn_detalj"]`
4. Glasering — `["glasur_filter", "glasur_lag", "metode"]`
5. Glasur-brenning — `["brann_temp", "ovn_detalj", "sluttvekt_g", "slutthoyde_cm", "sluttbredde_cm"]`

### tag_categories
1. Glasur (managed)
2. Form (managed) — kopp, skål, bolle, fat, etc.
3. Fritekst (freeform)

### clay_types
1. Leigods (earthenware)
2. Steingods (stoneware)
3. Porselen (porcelain)

## Verification

1. Create a piece with all stages, upload images, fill fields → verify data in Supabase
2. Grid view shows the piece with correct display image
3. Filter by tag → piece appears/disappears correctly
4. Edit piece → changes persist
5. Settings page → add a new glaze tag → available when creating pieces
6. Test on mobile viewport → layout is usable
7. Test with throttled network → images load, uploads complete
