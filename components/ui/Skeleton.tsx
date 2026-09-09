import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-800/50",
        className,
      )}
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-[18px] h-[18px] rounded-[5px] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-5 w-14 rounded-md" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      <Skeleton className="w-7 h-7 rounded-lg" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  )
}