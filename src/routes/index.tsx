import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { FilterBar } from '#/components/FilterBar'
import { PieceCard } from '#/components/PieceCard'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { usePieces } from '#/hooks/use-pieces'

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
          {['a','b','c','d','e','f','g','h'].map((k) => (
            <Skeleton key={k} className="aspect-[3/4] rounded-xl" />
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
