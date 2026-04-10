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
