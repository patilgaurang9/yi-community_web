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
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.defaultMonth || new Date())
  const maxDate = props.toDate || new Date()

  return (
    <div className={cn("custom-daypicker w-[300px] max-w-[300px] bg-[#1e1e1e] text-white rounded-lg shadow-lg border border-border overflow-hidden", className)}>
      {/* Header Section - compact for dark theme */}
      <div className="bg-[#1e1e1e] text-white px-3 py-3">
        <div className="text-[10px] font-medium opacity-90 mb-1 text-white">
          {format(month, "yyyy")}
        </div>
        <div className="text-lg font-semibold text-white">
          {format(month, "EEE, MMM d")}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          fromYear={new Date().getFullYear() - 100}
          toDate={maxDate}
          className="w-full"
          classNames={{
            months: "!block !w-full",
            month: "!block !w-full",
            // caption contains the label and dropdowns area
            caption: "flex items-center justify-between px-2 pb-2 text-sm text-white",
            // hide the plain caption label to avoid duplicate text when using dropdowns
            caption_label: "sr-only",
            // container for dropdowns: center them
            caption_dropdowns: "flex items-center justify-center gap-2 w-full",
            // base dropdown/select styling - remove native appearance, fit dark theme
            dropdown: "appearance-none bg-transparent text-white font-semibold border-0 px-2 py-1 pr-8 cursor-pointer",
            // specific dropdowns for month/year (keep same styling)
            dropdown_month: "appearance-none bg-transparent text-white font-semibold border-0 px-2 py-1 pr-8 cursor-pointer",
            dropdown_year: "appearance-none bg-background text-foreground border border-border rounded px-2 py-1 cursor-pointer",
            dropdown_icon: "text-foreground",
            // navigation buttons area
            nav: "flex items-center gap-1",
            nav_button: "flex items-center justify-center h-10 w-10 rounded-full bg-transparent hover:bg-neutral-700 text-white",
            nav_button_previous: "flex items-center justify-center h-10 w-10 rounded-full bg-transparent hover:bg-neutral-700 text-white",
            nav_button_next: "flex items-center justify-center h-10 w-10 rounded-full bg-transparent hover:bg-neutral-700 text-white",
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
            day_outside: "!text-muted-foreground !opacity-50",
            day_disabled: "!text-muted-foreground !opacity-50 !cursor-not-allowed",
            day_range_middle: "aria-selected:!bg-accent aria-selected:!text-accent-foreground",
            day_hidden: "!invisible",
            ...classNames,
          }}
          {...props}
        />
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
