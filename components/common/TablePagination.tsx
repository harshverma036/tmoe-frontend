import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TablePaginationProps = {
  showingFrom: number
  showingTo: number
  total: number
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  isLoading?: boolean
  className?: string
}

export function TablePagination({
  showingFrom,
  showingTo,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  isLoading = false,
  className,
}: TablePaginationProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        Showing {showingFrom}–{showingTo} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg px-3 shadow-none"
          disabled={!hasPrevious || isLoading}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg px-3 shadow-none"
          disabled={!hasNext || isLoading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
