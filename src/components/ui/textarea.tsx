import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-r14 border border-line bg-white px-4 py-3 text-body text-ink transition-colors outline-none placeholder:text-label focus-visible:border-blue-1 focus-visible:ring-2 focus-visible:ring-sky disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
