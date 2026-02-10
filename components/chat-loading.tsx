export function ChatLoading() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header Skeleton */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>

      {/* Timer Bar Skeleton */}
      <div className="border-b border-border bg-muted px-4 py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-background" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex gap-3 ${i % 3 === 0 ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div
                  className={`h-16 animate-pulse rounded-lg bg-muted ${
                    i % 3 === 0 ? 'ml-auto w-3/4' : 'w-2/3'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2">
            <div className="h-24 flex-1 animate-pulse rounded-lg bg-muted" />
            <div className="h-11 w-11 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
