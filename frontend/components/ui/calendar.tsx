import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(selected || new Date())
  
  // Sync month when selected date changes
  React.useEffect(() => {
    if (selected) {
      setMonth(selected)
    }
  }, [selected])
  
  return (
    <div className={cn("w-[300px] bg-popover text-popover-foreground rounded-lg shadow-lg border border-border overflow-hidden", className)}>
      {/* Header Section - Material Design Style */}
      <div className="bg-[#FF9933] text-white px-4 py-6">
        <div className="text-xs font-medium opacity-90 mb-1">
          {selected ? format(selected, "yyyy") : format(month, "yyyy")}
        </div>
        <div className="text-2xl font-semibold">
          {selected ? format(selected, "EEE, MMM d") : "Select a date"}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="text-sm font-medium text-foreground">
          {format(month, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const newMonth = new Date(month)
              newMonth.setMonth(newMonth.getMonth() - 1)
              setMonth(newMonth)
            }}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-8 w-8 p-0 hover:bg-accent"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const newMonth = new Date(month)
              newMonth.setMonth(newMonth.getMonth() + 1)
              setMonth(newMonth)
            }}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-8 w-8 p-0 hover:bg-accent"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={month}
          onMonthChange={setMonth}
          fromYear={1900}
          toYear={new Date().getFullYear() + 10}
          className="w-full"
          classNames={{
            months: "!block !w-full",
            month: "!block !w-full",
            caption: "hidden",
            caption_label: "hidden",
            caption_dropdowns: "hidden",
            dropdown: "hidden",
            dropdown_month: "hidden",
            dropdown_year: "hidden",
            dropdown_icon: "hidden",
            nav: "hidden",
            nav_button: "hidden",
            nav_button_previous: "hidden",
            nav_button_next: "hidden",
            table: "!w-full !border-collapse !table-fixed",
            head_row: "!grid !grid-cols-7 !mb-2 !w-full !gap-0",
            head_cell:
              "!text-muted-foreground !text-xs !font-medium !h-9 !w-full !flex !items-center !justify-center !text-center !m-0 !p-0",
            row: "!grid !grid-cols-7 !w-full !mt-1 !gap-0",
            cell: "!h-9 !w-full !text-center !text-sm !p-0 !m-0 !relative !flex !items-center !justify-center",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "!h-9 !w-9 !p-0 !m-0 !font-normal !rounded-full hover:bg-accent !flex !items-center !justify-center"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "!bg-[#FF9933] !text-white hover:!bg-[#FF9933] hover:!text-white focus:!bg-[#FF9933] focus:!text-white !rounded-full",
            day_today: "!bg-accent !text-accent-foreground !font-semibold !rounded-full",
            day_outside:
              "!text-muted-foreground !opacity-50",
            day_disabled: "!text-muted-foreground !opacity-50 !cursor-not-allowed",
            day_range_middle: "aria-selected:!bg-accent aria-selected:!text-accent-foreground",
            day_hidden: "!invisible",
            ...classNames,
          }}
          components={{
            IconLeft: () => null,
            IconRight: () => null,
          }}
          selected={selected}
          {...props}
        />
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
