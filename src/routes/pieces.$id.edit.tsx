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
