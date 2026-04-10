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
    setStages([...stages, { stage_def_id: defId, title: def.name, image: null, fields, notes: '', sort_order: stages.length }])
  }

  function addCustomStage() {
    setStages([...stages, { stage_def_id: null, title: '', image: null, fields: {}, notes: '', sort_order: stages.length }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const pieceId = initialData?.id ?? crypto.randomUUID()

      const processedStages = await Promise.all(
        stages.map(async (stage, i) => {
          let imagePath = typeof stage.image === 'string' ? stage.image : null
          if (stage.image instanceof File) {
            const path = `${user!.id}/${pieceId}/stages/${crypto.randomUUID()}.jpg`
            const result = await uploadImage(stage.image, path)
            if (!result.error) imagePath = result.path
          }
          return { stage_def_id: stage.stage_def_id, title: stage.title, image_path: imagePath, fields: stage.fields, notes: stage.notes || null, sort_order: i }
        }),
      )

      const processedImages = await Promise.all(
        extraImages.filter((img) => img.file).map(async (img, i) => {
          let imagePath = typeof img.file === 'string' ? img.file : ''
          if (img.file instanceof File) {
            const path = `${user!.id}/${pieceId}/extra/${crypto.randomUUID()}.jpg`
            const result = await uploadImage(img.file, path)
            if (!result.error) imagePath = result.path
          }
          return { image_path: imagePath, caption: img.caption || null, sort_order: i }
        }),
      )

      const lastStageWithImage = [...processedStages].reverse().find((s) => s.image_path)
      const displayImage = lastStageWithImage?.image_path ?? initialData?.display_image ?? null

      await onSubmit({
        title, clay_type_id: clayTypeId, piece_id_label: pieceIdLabel || null,
        price: price ? Number(price) : null, final_notes: finalNotes || null,
        display_image: displayImage, stages: processedStages, tag_ids: tagIds, images: processedImages,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const unusedDefaults = stageDefaults?.filter((d) => !stages.some((s) => s.stage_def_id === d.id)) ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              {clayTypes?.map((ct) => (<SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pris (kr)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Tags</Label>
        <TagSelect selectedIds={tagIds} onChange={setTagIds} />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Stadier</h2>
        <div className="space-y-4">
          {stages.map((stage, i) => (
            <StageEditor
              key={i}
              stage={stage}
              onChange={(updated) => { const next = [...stages]; next[i] = updated; setStages(next) }}
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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Ekstra bilder</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {extraImages.map((img, i) => (
            <div key={i} className="relative">
              <ImageUpload
                value={img.file}
                onChange={(file) => {
                  if (!file) { setExtraImages(extraImages.filter((_, j) => j !== i)) }
                  else { const next = [...extraImages]; next[i] = { ...next[i], file }; setExtraImages(next) }
                }}
              />
              <Input
                value={img.caption}
                onChange={(e) => { const next = [...extraImages]; next[i] = { ...next[i], caption: e.target.value }; setExtraImages(next) }}
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

      <div className="space-y-2">
        <Label>Slutttanker</Label>
        <Textarea value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} rows={4} placeholder="Refleksjoner, forbedringer til neste gang..." />
      </div>

      <Button type="submit" disabled={submitting || !title.trim()} className="w-full">
        {submitting ? 'Lagrer...' : submitLabel}
      </Button>
    </form>
  )
}
