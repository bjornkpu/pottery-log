import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Separator } from '#/components/ui/separator'
import { useClayTypes, useCreateClayType, useDeleteClayType } from '#/hooks/use-clay-types'
import { useTags, useTagCategories, useCreateTag, useDeleteTag, useCreateTagCategory, useDeleteTagCategory } from '#/hooks/use-tags'
import { useStageDefaults, useCreateStageDefault, useDeleteStageDefault } from '#/hooks/use-stage-defaults'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

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
