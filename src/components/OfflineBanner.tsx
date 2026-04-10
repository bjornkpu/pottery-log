import { useOnlineStatus } from '#/hooks/use-online-status'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="flex h-8 items-center justify-center bg-amber-500 text-xs font-medium text-amber-950">
      Du er frakoblet — kun visning
    </div>
  )
}
