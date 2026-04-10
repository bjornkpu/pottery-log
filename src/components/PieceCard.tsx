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
