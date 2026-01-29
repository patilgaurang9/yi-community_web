"use client"

import { MONTHS } from "@/lib/birthday-utils"

interface BirthdayMonthFilterProps {
  selectedMonth: number // 0-11
  onSelect: (month: number) => void
}

export function BirthdayMonthFilter({
  selectedMonth,
  onSelect,
}: BirthdayMonthFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MONTHS.map((month, index) => {
        const isSelected = index === selectedMonth
        return (
          <button
            key={month}
            onClick={() => onSelect(index)}
            className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 relative ${isSelected
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {month}
            {isSelected && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#FF9933] rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
