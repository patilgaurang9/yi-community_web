import {
  addYears,
  differenceInDays,
  format,
  isSameDay,
  parseISO,
  setYear,
  startOfDay,
} from "date-fns"

export interface BirthdayProfile {
  id: string
  full_name: string
  avatar_url: string | null
  dob: string // YYYY-MM-DD
  // Computed properties
  age: number
  nextBirthday: Date
  isToday: boolean
  daysUntil: number
  birthMonth: number // 0-11 (0 = January, 11 = December)
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function processBirthdays(profiles: any[]): BirthdayProfile[] {
  const today = startOfDay(new Date())

  return profiles
    .filter((p) => p.dob) // Filter out null DOBs
    .map((p) => {
      const dobDate = parseISO(p.dob)
      
      // Calculate Next Birthday
      let nextBday = setYear(dobDate, today.getFullYear())
      if (nextBday < today) {
        nextBday = addYears(nextBday, 1)
      }
      
      // Handle leap year edge case: if birthday is Feb 29 and next year is not a leap year
      if (dobDate.getMonth() === 1 && dobDate.getDate() === 29) {
        const nextYear = nextBday.getFullYear()
        const isLeapYear = (year: number) =>
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

        if (!isLeapYear(nextYear)) {
          // Use Feb 28 for non-leap years
          nextBday = new Date(nextYear, 1, 28)
        }
      }

      const isToday = isSameDay(nextBday, today)
      const daysUntil = differenceInDays(nextBday, today)
      const birthMonth = dobDate.getMonth() // 0-11
      
      // Calculate age (more accurate)
      let age = today.getFullYear() - dobDate.getFullYear()
      const monthDiff = today.getMonth() - dobDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--
      }

      return {
        ...p,
        age,
        nextBirthday: nextBday,
        isToday,
        daysUntil,
        birthMonth,
      }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Format birthday date for display
 */
export function formatBirthdayDate(profile: BirthdayProfile): string {
  if (profile.isToday) {
    return "Today!"
  } else if (profile.daysUntil === 1) {
    return "Tomorrow"
  } else {
    return format(profile.nextBirthday, "MMM d")
  }
}
