import { LoaderIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      size={10}
      aria-label="Loading"
      className={cn("size-10 animate-spin text-primary", className)}
      {...props}
    />
  )
}

export function Loader() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  )
}
