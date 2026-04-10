import { Input } from '#/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { useClayTypes } from '#/hooks/use-clay-types'
import { useTags, useTagCategories } from '#/hooks/use-tags'

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
