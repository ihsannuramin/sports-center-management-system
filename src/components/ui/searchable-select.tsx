"use client"

import * as React from "react"
import { ChevronDownIcon, CheckIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) return extractText((node.props as any).children)
  return ""
}

interface ItemData {
  value: string
  label: React.ReactNode
  labelText: string
}

function collectItems(children: React.ReactNode): ItemData[] {
  const result: ItemData[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if ((child.type as any)?.displayName === "SearchableSelectItem") {
      result.push({
        value: (child.props as any).value as string,
        label: (child.props as any).children,
        labelText: extractText((child.props as any).children),
      })
    }
  })
  return result
}

export interface SearchableSelectProps {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Pilih...",
  className,
  disabled,
  children,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const items = collectItems(children)
  const filtered = search
    ? items.filter((item) => item.labelText.toLowerCase().includes(search.toLowerCase()))
    : items
  const selectedItem = items.find((item) => item.value === value)

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o)
          setSearch("")
        }}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 h-8",
          className
        )}
      >
        <span className={cn("flex-1 text-left truncate", !selectedItem && "text-gray-400")}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-gray-400 shrink-0 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 min-w-full rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200/60">
            <SearchIcon className="size-3.5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 min-w-0"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-gray-400">Tidak ada hasil</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onValueChange(item.value)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === item.value && "bg-accent/50"
                  )}
                >
                  <span className="flex-1 text-left">{item.label}</span>
                  {value === item.value && (
                    <CheckIcon className="absolute right-2 size-4 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export interface SearchableSelectItemProps {
  value: string
  children: React.ReactNode
}

export function SearchableSelectItem(_props: SearchableSelectItemProps): null {
  return null
}
SearchableSelectItem.displayName = "SearchableSelectItem"
