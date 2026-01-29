
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { BuzzImage } from "@/components/buzz/buzz-image"
import { EventRSVPSidebar } from "@/components/events/event-rsvp-sidebar"

interface EventDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id: eventId } = await params
  const supabase = await createClient()

  // 1. Fetch Event Details
  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, description, start_time, end_time, location_name, image_url, category, is_featured, host_vertical, vertical_members")
    .eq("id", eventId)
    .single()

  if (error || !event) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold">Error: {error?.message || "Event not found"}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#FF9933] hover:underline">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  // 2. Hybrid Team Logic
  let organizingTeam: string[] = []

  // A. Check Snapshot first
  if (event.vertical_members && Array.isArray(event.vertical_members) && event.vertical_members.length > 0) {
    organizingTeam = event.vertical_members;
  }
  // B. Fallback: Dynamic Fetch
  else {
    const targetVertical = event.host_vertical || event.category;

    if (targetVertical) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("yi_vertical", targetVertical); // Ensure 'yi_vertical' matches exactly

      if (profiles) {
        organizingTeam = profiles.map(p => p.full_name).filter(Boolean) as string[];
      }
    }
  }

  // Format Helpers
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

  const imageUrl = event.image_url || "https://placehold.co/1200x500/18181b/ffffff?text=Event"
  const primaryVertical = event.host_vertical || event.category || "Yi Event"
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

          {/* Org Team Section - Hybrid Display */}
          {organizingTeam.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Organized by the {primaryVertical} Team
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {organizingTeam.map((member, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF9933]" />
                      {member}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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

        {/* Right Column - Sticky Sidebar (Client Component) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <EventRSVPSidebar eventId={eventId} />
          </div>
        </div>
      </div>
    </div>
  )
}
