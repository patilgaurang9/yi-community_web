"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export interface EventFilters {
  vertical: string
  date: string
  mode: string
}

interface EventFiltersProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  onClear: () => void
  iconOnly?: boolean
}

const VERTICALS = [
  "All",
  "Innovation",
  "Learning",
  "Entrepreneurship",
  "Health",
  "Yuva",
  "Membership",
  "Branding",
  "Rural Initiatives",
  "Climate Change",
  "Accessibility",
  "Road Safety",
  "Masoom",
  "Thalir",
]

const DATE_OPTIONS = ["Any Date", "This Week", "This Month"]
const MODE_OPTIONS = ["All", "In-Person", "Online"]

export function EventFilters({
  filters,
  onFiltersChange,
  onClear,
  iconOnly = false,
}: EventFiltersProps) {
  const [open, setOpen] = useState(false)

  const handleVerticalChange = (value: string) => {
    onFiltersChange({ ...filters, vertical: value })
  }

  const handleDateChange = (value: string) => {
    onFiltersChange({ ...filters, date: value })
  }

  const handleModeChange = (value: string) => {
    onFiltersChange({ ...filters, mode: value })
  }

  const handleClear = () => {
    onClear()
  }

  const handleDone = () => {
    setOpen(false)
  }

  const hasActiveFilters =
    filters.vertical !== "All" ||
    filters.date !== "Any Date" ||
    filters.mode !== "All"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-10 border-white/20 bg-white/5 text-white hover:bg-white/10 ${hasActiveFilters ? "border-[#FF9933] bg-[#FF9933]/10" : ""
            } ${iconOnly ? "w-10 p-0" : "h-12 whitespace-nowrap"}`}
        >
          <Filter className={`h-4 w-4 ${iconOnly ? "" : "mr-2"}`} />
          {!iconOnly && "Filters"}
          {hasActiveFilters && (
            <span className={`flex items-center justify-center rounded-full bg-[#FF9933] text-xs font-semibold text-white ${iconOnly ? "absolute -top-1 -right-1 h-3 w-3 text-[8px]" : "ml-2 h-5 w-5"}`}>
              {iconOnly ? "" : [filters.vertical, filters.date, filters.mode].filter(
                (f) => f !== "All" && f !== "Any Date"
              ).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-zinc-900 border-zinc-800 p-6 backdrop-blur-md"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Section 1: Vertical */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              By Vertical
            </Label>
            <Select value={filters.vertical} onValueChange={handleVerticalChange}>
              <SelectTrigger className="h-10 bg-zinc-800 border-zinc-700 text-foreground">
                <SelectValue placeholder="Select vertical" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {VERTICALS.map((vertical) => (
                  <SelectItem
                    key={vertical}
                    value={vertical}
                    className="text-foreground focus:bg-zinc-800 focus:text-[#FF9933]"
                  >
                    {vertical}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section 2: Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Date</Label>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleDateChange(option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filters.date === option
                      ? "bg-[#FF9933] text-white"
                      : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-foreground"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Location
            </Label>
            <div className="flex flex-wrap gap-2">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleModeChange(option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filters.mode === option
                      ? "bg-[#FF9933] text-white"
                      : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-foreground"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
            <Button
              onClick={handleDone}
              className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
