"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle2, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { useRSVP } from "@/hooks/useRSVP"
import Link from "next/link"
import { BuzzImage } from "@/components/buzz/buzz-image"

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

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use RSVP hook
  const { status, count, toggleRSVP, loading: rsvpLoading } = useRSVP(eventId)

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const supabase = createClient()
        
        const { data, error: fetchError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single()

        if (fetchError) {
          console.error("❌ Error fetching event:", fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        if (!data) {
          setError("Event not found")
          setLoading(false)
          return
        }

        setEvent(data)
        setLoading(false)
      } catch (err) {
        console.error("💥 Exception fetching event:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch event"
        setError(errorMessage)
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])


  // Format date and time
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return {
        date: format(date, "EEEE, MMMM d, yyyy"),
        time: format(date, "h:mm a"),
      }
    } catch {
      return { date: dateString, time: "" }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold">Error: {error || "Event not found"}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#FF9933] hover:underline">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const imageUrl = event.image_url || "https://placehold.co/1200x500/18181b/ffffff?text=Event"
  const primaryVertical = event.category || "Yi Event"
  const { date: startDate, time: startTime } = formatDateTime(event.start_time)
  const { date: endDate, time: endTime } = event.end_time ? formatDateTime(event.end_time) : { date: "", time: "" }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-[#FF9933] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Hero Image */}
      <div className="relative h-[500px] w-full overflow-hidden rounded-lg mb-8">
        <BuzzImage
          src={imageUrl}
          alt={event.title || "Event"}
          className="h-full w-full object-cover"
          fallbackSrc="https://placehold.co/1200x500/18181b/ffffff?text=Event"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {event.title || "Untitled Event"}
            </h1>
            
            {/* Vertical Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Organized by</span>
              <Badge className="bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {primaryVertical} Vertical
              </Badge>
            </div>

            {/* Category Badge */}
            {event.category && (
              <Badge className="bg-[#FF9933] text-white mb-4">
                {event.category}
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#FF9933] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="text-base text-foreground">{startDate}</p>
                  <p className="text-sm text-muted-foreground">{startTime}</p>
                  {event.end_time && endTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Until {endDate !== startDate ? endDate + " " : ""}{endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location_name && (
                <div className="flex items-start gap-3 pt-4 border-t border-border">
                  <MapPin className="h-5 w-5 text-[#FF9933] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-base text-foreground">{event.location_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {event.description && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">About This Event</h2>
                <div 
                  className="text-base text-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, "<br />") }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">RSVP</h3>
                
                {/* Attendee Count */}
                {count > 0 && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[#138808]" />
                    <span>{count} {count === 1 ? "person is" : "people are"} going</span>
                  </div>
                )}
                
                {/* RSVP Now Button */}
                <Button
                  onClick={() => toggleRSVP("going")}
                  disabled={rsvpLoading}
                  className={`w-full ${
                    status === "going"
                      ? "bg-[#138808] hover:bg-[#138808]/90 text-white"
                      : "bg-[#138808] hover:bg-[#138808]/90 text-white"
                  }`}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {status === "going" ? "RSVP Confirmed" : "RSVP Now"}
                </Button>

                {/* Interested Button */}
                <Button
                  onClick={() => toggleRSVP("interested")}
                  disabled={rsvpLoading}
                  variant={status === "interested" ? "default" : "outline"}
                  className={`w-full ${
                    status === "interested"
                      ? "bg-[#FF9933] hover:bg-[#FF9933]/90 text-white border-[#FF9933]"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {status === "interested" ? "Interested ✓" : "Interested"}
                </Button>

                {rsvpLoading && (
                  <p className="text-xs text-muted-foreground text-center">Updating...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
