import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-3 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-black-soft",
        outline:
          "border-divider bg-white text-ink shadow-card hover:bg-note",
        secondary:
          "bg-white text-ink shadow-card hover:bg-note",
        ghost:
          "bg-transparent text-label hover:bg-white hover:text-ink",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-blue-1 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 rounded-r14 px-5 text-btn",
        xs: "h-7 gap-1 rounded-r10 px-2 text-ui-12",
        sm: "h-9 gap-1.5 rounded-r12 px-3 text-ui-14",
        lg: "h-12 gap-2 rounded-r14 px-6 text-btn",
        icon: "size-11 rounded-r14",
        "icon-xs": "size-7 rounded-r10",
        "icon-sm": "size-9 rounded-r12",
        "icon-lg": "size-12 rounded-r14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
