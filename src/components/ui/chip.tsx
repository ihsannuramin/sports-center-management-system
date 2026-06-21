import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center h-8 px-3 rounded-full text-[10px] font-bold transition-colors outline-none select-none whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-surface text-tertiary border border-border",
        active: "bg-primary text-surface border border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Chip({
  className,
  variant = "default",
  active = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof chipVariants> & { active?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="chip"
      className={cn(chipVariants({ variant: active ? "active" : variant, className }))}
      {...props}
    />
  )
}

export { Chip, chipVariants }
