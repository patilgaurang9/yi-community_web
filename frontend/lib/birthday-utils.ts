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
  avatar_url?: string | null
  dob?: string | null // YYYY-MM-DD
  phone_number?: string | null
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

export function processBirthdays(profiles: Array<{ dob?: string | null; full_name: string; avatar_url?: string | null; id: string; phone_number?: string | null }>): BirthdayProfile[] {
  const today = startOfDay(new Date())

  return profiles
    .filter((p) => p.dob && p.full_name) // Filter out null DOBs and names
    .map((p) => {
      const dobDate = parseISO(p.dob!)

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
        dob: p.dob,
        avatar_url: p.avatar_url ?? null,
        phone_number: p.phone_number ?? null,
        age,
        nextBirthday: nextBday,
        isToday,
        daysUntil,
        birthMonth,
      }
    })
    .sort((a, b) => {
      // Primary sort: Days until birthday
      if (a.daysUntil !== b.daysUntil) {
        return a.daysUntil - b.daysUntil
      }
      // Secondary sort: Alphabetical by name
      return a.full_name.localeCompare(b.full_name)
    })
}

/**
 * Format birthday date for display
 */
export function formatBirthdayDate(profile: BirthdayProfile): string {
  if (profile.isToday) {
    return "Today"
  } else if (profile.daysUntil === 1) {
    return "Tomorrow"
  } else if (profile.daysUntil > 1 && profile.daysUntil <= 7) {
    return `In ${profile.daysUntil} days`
  } else {
    return format(profile.nextBirthday, "MMM d")
  }
}
