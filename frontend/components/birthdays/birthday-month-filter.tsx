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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              isSelected
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {month}
          </button>
        )
      })}
    </div>
  )
}
