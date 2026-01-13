"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Gift, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BirthdayCard } from "@/components/birthdays/birthday-card"
import { BirthdayMonthFilter } from "@/components/birthdays/birthday-month-filter"
import { processBirthdays, MONTHS } from "@/lib/birthday-utils"
import { format } from "date-fns"

interface RawProfile {
  id: string
  full_name: string
  dob: string | null
  avatar_url?: string | null
}

export default function BirthdaysPage() {
  const [rawProfiles, setRawProfiles] = useState<RawProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  // Fetch all profiles with birthdays
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("id, full_name, dob, avatar_url")
          .not("dob", "is", null)

        if (fetchError) {
          console.error("❌ Error fetching birthdays:", fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        setRawProfiles(data || [])
        setLoading(false)
      } catch (err) {
        console.error("💥 Exception fetching birthdays:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch birthdays"
        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  // Process birthdays with computed properties
  const processedProfiles = useMemo(() => {
    return processBirthdays(rawProfiles)
  }, [rawProfiles])

  // Hero Section: Today's Birthdays
  const todaysBirthdays = useMemo(() => {
    return processedProfiles.filter((p) => p.daysUntil === 0)
  }, [processedProfiles])

  // Hero Section: Upcoming Birthdays
  const upcomingBirthdays = useMemo(() => {
    return processedProfiles.filter((p) => p.daysUntil > 0 && p.daysUntil <= 7)
  }, [processedProfiles])

  // Directory Section: Filtered by selected month
  const filteredBirthdays = useMemo(() => {
    return processedProfiles.filter((p) => p.birthMonth === selectedMonth)
  }, [processedProfiles, selectedMonth])

  const currentDateFormatted = format(new Date(), "EEEE, MMMM d")

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-zinc-400">Loading birthdays...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Birthdays</h1>
        <p className="text-zinc-400">{currentDateFormatted}</p>
      </div>

      {/* Hero Section: 🎉 Today's Celebrations */}
      {todaysBirthdays.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-white">Today&apos;s Celebrations</h2>
            <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1">
              {todaysBirthdays.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysBirthdays.map((profile) => (
              <BirthdayCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Hero Section: 📅 Upcoming This Week */}
      {upcomingBirthdays.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-violet-500" />
            <h2 className="text-xl font-semibold text-white">Upcoming This Week</h2>
            <Badge className="bg-violet-500/20 text-violet-500 border border-violet-500/30 px-2 py-1">
              {upcomingBirthdays.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingBirthdays.map((profile) => (
              <BirthdayCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Directory Section: All Birthdays */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">All Birthdays</h2>
        </div>

        {/* Month Filter */}
        <BirthdayMonthFilter
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
        />

        {/* Filtered Grid */}
        {filteredBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBirthdays.map((profile) => (
              <BirthdayCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-400">
              No birthdays in {MONTHS[selectedMonth]}.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
