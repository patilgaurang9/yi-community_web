"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Gift } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BirthdayCard } from "@/components/birthdays/birthday-card"
import { processBirthdays, MONTHS, BirthdayProfile } from "@/lib/birthday-utils"
import { format } from "date-fns"
import confetti from "canvas-confetti"

interface RawProfile {
  id: string
  full_name: string
  dob: string | null
  avatar_url?: string | null
  phone_number?: string | null
}

export default function BirthdaysPage() {
  const [rawProfiles, setRawProfiles] = useState<RawProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all profiles with birthdays
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("id, full_name, dob, avatar_url, phone_number")
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

  // Confetti Trigger
  useEffect(() => {
    // Check if we have birthdays today from the processed profiles
    const today = new Date().getDate()
    const hasBirthdaysToday = processedProfiles.some(p => p.birthMonth === new Date().getMonth() && new Date(p.dob!).getDate() === today)

    if (!loading && hasBirthdaysToday) {
      const duration = 2000

      // Fire first burst immediately
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        angle: 60,
        colors: ['#FF9933', '#ffffff', '#138808'], // Indian Flag Colors
        ticks: 200 // Approx 3s lifetime to ensure they clear nicely after the 2s perception
      })
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        angle: 120,
        colors: ['#FF9933', '#ffffff', '#138808'],
        ticks: 200
      })
    }
  }, [loading, processedProfiles])

  // Current Data
  const today = new Date()
  const currentMonthIndex = today.getMonth() // 0-11
  const todayDate = today.getDate()

  // State for Selected Month (Defaults to Current)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex)

  // 1. Force 12-Month Array (Rotated)
  const rotatedMonths = useMemo(() => {
    const months = []
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonthIndex + i) % 12
      months.push({ index: monthIndex, name: MONTHS[monthIndex] })
    }
    return months
  }, [currentMonthIndex])

  const currentDateFormatted = format(today, "EEEE, MMMM d")

  // Determine which list to show based on selection
  const selectedMonthData = useMemo(() => {
    // Filter profiles for the selected month
    const profiles = processedProfiles.filter(p => p.birthMonth === selectedMonth)
    const isCurrentMonth = selectedMonth === currentMonthIndex

    let sections = {
      today: [] as BirthdayProfile[],
      upcoming: [] as BirthdayProfile[],
      past: [] as BirthdayProfile[],
      all: [] as BirthdayProfile[]
    }

    if (isCurrentMonth) {
      profiles.forEach(profile => {
        const day = new Date(profile.dob!).getDate()
        if (day === todayDate) {
          sections.today.push(profile)
        } else if (day > todayDate) {
          sections.upcoming.push(profile)
        } else {
          sections.past.push(profile)
        }
      })
      // Sort
      sections.upcoming.sort((a, b) => new Date(a.dob!).getDate() - new Date(b.dob!).getDate())
      sections.past.sort((a, b) => new Date(b.dob!).getDate() - new Date(a.dob!).getDate()) // Descending
    } else {
      // Standard Sort for other months
      sections.all = [...profiles].sort((a, b) => new Date(a.dob!).getDate() - new Date(b.dob!).getDate())
    }

    return { sections, isCurrentMonth }
  }, [processedProfiles, selectedMonth, currentMonthIndex, todayDate])


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

  const { sections, isCurrentMonth } = selectedMonthData
  const hasBirthdays = isCurrentMonth
    ? (sections.today.length > 0 || sections.upcoming.length > 0 || sections.past.length > 0)
    : (sections.all.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Centered Header */}
      <div className="text-center space-y-4 mb-4">
        <div className="inline-flex p-3 bg-zinc-900 rounded-full mb-2 border border-zinc-800">
          <Gift className="h-6 w-6 text-[#FF9933]" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Birthdays</h1>
          <p className="text-zinc-400 text-lg">Celebrating our members all year round</p>
        </div>
      </div>

      {/* Horizontal Month Picker */}
      <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex space-x-2 min-w-max mx-auto">
          {rotatedMonths.map((m) => {
            const isSelected = selectedMonth === m.index
            const isCurrent = currentMonthIndex === m.index
            return (
              <button
                key={m.index}
                onClick={() => setSelectedMonth(m.index)}
                className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${isSelected
                    ? 'bg-[#FF9933] text-white shadow-lg shadow-[#FF9933]/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }
                        `}
              >
                {m.name}
                {isCurrent && !isSelected && <span className="ml-1 text-[#FF9933]">•</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vertical Content List */}
      <div className="min-h-[300px]">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          {MONTHS[selectedMonth]}
          {isCurrentMonth && <span className="text-xs font-normal bg-[#FF9933]/10 text-[#FF9933] px-2 py-1 rounded-full border border-[#FF9933]/20">Current Month</span>}
        </h2>

        {!hasBirthdays && (
          <div className="text-center py-16 text-zinc-400 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <Gift className="h-8 w-8 text-zinc-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-300">No birthdays this month</p>
                <p className="text-sm text-zinc-500 mt-1">Check other months to celebrate with members</p>
              </div>
            </div>
          </div>
        )}

        {isCurrentMonth ? (
          <div className="space-y-8">
            {/* TODAY */}
            {sections.today.length > 0 && (
              <section className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF9933]/10 to-violet-500/10 blur-3xl opacity-50" />
                <div className="relative p-6 rounded-2xl bg-[#FF9933]/5 border border-[#FF9933]/20 shadow-[0_0_30px_-10px_rgba(255,153,51,0.3)]">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9933] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF9933]"></span>
                    </span>
                    <h2 className="text-lg font-bold text-[#FF9933] uppercase tracking-wider">Today</h2>
                  </div>

                  <div className="grid gap-4">
                    {sections.today.map((profile) => (
                      <BirthdayCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* UPCOMING */}
            {sections.upcoming.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-zinc-500 font-medium text-sm uppercase tracking-wider pl-2 border-l-2 border-[#FF9933]">
                  Upcoming
                </h3>
                <div className="grid gap-4">
                  {sections.upcoming.map((profile) => (
                    <BirthdayCard key={profile.id} profile={profile} />
                  ))}
                </div>
              </section>
            )}

            {/* PAST */}
            {sections.past.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-dashed border-zinc-800/50">
                <h3 className="text-zinc-600 font-medium text-sm uppercase tracking-wider pl-2 border-l-2 border-zinc-700">
                  Past
                </h3>
                <div className="grid gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  {sections.past.map((profile) => (
                    <BirthdayCard key={profile.id} profile={profile} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          // Other Months View
          <div className="grid gap-4">
            {sections.all.map((profile) => (
              <BirthdayCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
