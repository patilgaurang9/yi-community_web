"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { HeroCarousel } from "@/components/events/hero-carousel"
import { EventFilters, type EventFilters as EventFiltersType } from "@/components/events/event-filters"
import { EventCard } from "@/components/events/event-card"
import Link from "next/link"

interface Event {
  id: string
  title: string | null
  description: string | null
  start_time: string
  end_time: string | null
  location_name: string | null
  image_url: string | null
  category: string | null
  is_featured: boolean | null
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EventFiltersType>({
    vertical: "All",
    date: "Any Date",
    mode: "All",
  })

  // Fetch ALL events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()
        
        // Fetch ALL events - no filters, no date restrictions
        const { data, error: fetchError } = await supabase
          .from("events")
          .select("*")
          .order("start_time", { ascending: false })

        if (fetchError) {
          console.error("❌ Error fetching events:", fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        // Console log for debugging
        console.log("✅ Total Events Fetched:", data?.length || 0)
        console.log("📋 Events Data:", data)

        setEvents(data || [])
        setLoading(false)
      } catch (err) {
        console.error("💥 Exception fetching events:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch events"
        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Split events into featured and regular based on is_featured flag
  const { featuredEvents, regularEvents } = useMemo(() => {
    const featured = events.filter((event) => event.is_featured === true)
    const regular = events.filter((event) => event.is_featured === false || event.is_featured === null)
    
    console.log("🎯 Featured Events:", featured.length)
    console.log("📋 Regular Events:", regular.length)
    
    return {
      featuredEvents: featured,
      regularEvents: regular,
    }
  }, [events])

  // Filter regular events based on search query and filters
  const filteredRegularEvents = useMemo(() => {
    let filtered = regularEvents

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.location_name?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query)
      )
    }

    // Vertical filter (using category field)
    if (filters.vertical !== "All") {
      filtered = filtered.filter((event) => {
        return event.category === filters.vertical
      })
    }

    // Date filter
    if (filters.date !== "Any Date") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_time)
        
        if (filters.date === "This Week") {
          const nextWeek = new Date(today)
          nextWeek.setDate(today.getDate() + 7)
          return eventDate >= today && eventDate <= nextWeek
        } else if (filters.date === "This Month") {
          const sameMonth = eventDate.getMonth() === today.getMonth()
          const sameYear = eventDate.getFullYear() === today.getFullYear()
          return sameMonth && sameYear && eventDate >= today
        }
        
        return true
      })
    }

    // Mode filter (Location)
    if (filters.mode !== "All") {
      filtered = filtered.filter((event) => {
        const location = event.location_name?.toLowerCase() || ""
        
        if (filters.mode === "Online") {
          return location.includes("online") || location.includes("zoom") || location.includes("virtual")
        } else if (filters.mode === "In-Person") {
          return !location.includes("online") && !location.includes("zoom") && !location.includes("virtual")
        }
        
        return true
      })
    }

    return filtered
  }, [searchQuery, regularEvents, filters])



  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check the browser console for details.
          </p>
        </div>
      </div>
    )
  }

  // Debug log before rendering
  console.log("PAGE DEBUG: Featured Count:", featuredEvents.length, "Regular Count:", regularEvents.length)

  return (
    <div className="w-full space-y-6">
      {/* Featured Hero Carousel */}
      {featuredEvents.length > 0 && (
        <HeroCarousel events={featuredEvents} />
      )}

      {/* Sticky Utility Bar */}
      <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 px-6 py-5 backdrop-blur-md md:px-8">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 pl-9 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-[#FF9933]"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <EventFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClear={() => setFilters({ vertical: "All", date: "Any Date", mode: "All" })}
            />
            <Button 
              className="h-12 bg-[#FF9933] hover:bg-[#FF9933]/90 text-white px-6 whitespace-nowrap" 
              asChild
            >
              <Link href="/host-event" className="flex items-center justify-center h-full w-full">
                <Plus className="mr-2 h-4 w-4" />
                Host Event
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="w-full px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredRegularEvents.length} event{filteredRegularEvents.length !== 1 ? "s" : ""} found
              {regularEvents.length > 0 && ` (${regularEvents.length} total)`}
            </p>
          </div>
        </div>

        {filteredRegularEvents.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {regularEvents.length === 0
                ? "No events found in database."
                : "No events found matching your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredRegularEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
