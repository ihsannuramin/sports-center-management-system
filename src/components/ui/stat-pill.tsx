import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string | number
  label?: string
  icon?: LucideIcon
}

function StatPill({ value, label, icon: Icon, className, ...props }: StatPillProps) {
  return (
    <span
      data-slot="stat-pill"
      className={cn(
        "inline-flex items-center h-8 px-3 rounded-full bg-white text-gray-900 text-[12px] font-bold border border-gray-50 transition-colors gap-1.5",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      <span>{value}</span>
      {label && <span className="text-[10px] font-normal text-gray-500">{label}</span>}
    </span>
  )
}

export { StatPill }
