
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { BuzzImage } from "@/components/buzz/buzz-image"
import { EventRSVPSidebar } from "@/components/events/event-rsvp-sidebar"
import { EventGalleryControls } from "@/components/events/event-gallery-controls"

interface EventDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id: eventId } = await params
  const supabase = await createClient()

  // 1. Fetch Event Details with Photos
  const { data: event, error } = await supabase
    .from("events")
    .select("*, event_photos(photo_url, caption)")
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

  // 2. Organizing Team Logic (Fetch by Verticals)
  let organizingTeam: any[] = []
  let canUpload = false

  // Fetch Current User for Access Check
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("vertical_access_level")
      .eq("id", user.id)
      .single()

    // Check if Chair (2) or higher
    if (currentUserProfile?.vertical_access_level && currentUserProfile.vertical_access_level >= 2) {
      canUpload = true
    }
  }

  if (event.verticals && Array.isArray(event.verticals) && event.verticals.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, yi_position")
      .in("yi_vertical", event.verticals)

    if (profiles) {
      // Sort by seniority
      const hierarchy: Record<string, number> = {
        "Chair": 1,
        "Co-Chair": 2,
        "Joint Chair": 3,
        "EC Member": 4,
        "Mentor": 5
      }

      organizingTeam = profiles.sort((a, b) => {
        const roleA = a.yi_position ? hierarchy[a.yi_position] || 99 : 99
        const roleB = b.yi_position ? hierarchy[b.yi_position] || 99 : 99
        return roleA - roleB
      })
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
      <div className="relative h-[500px] w-full overflow-hidden rounded-lg mb-8 group">
        <BuzzImage
          src={imageUrl}
          alt={event.title || "Event"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackSrc="https://placehold.co/1200x500/18181b/ffffff?text=Event"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

        {/* Gallery Controls (Client Component) */}
        <EventGalleryControls
          eventId={eventId}
          initialPhotos={event.event_photos || []}
          canUpload={canUpload}
        />
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
              <Badge variant="premium">
                {primaryVertical.replace(/vertical/gi, '').trim()}
              </Badge>
            </div>
          </div>

          {/* Metadata (Logistics) */}
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

          {/* About This Event (The Story) */}
          {event.description && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">About the Event</h2>
                <div
                  className="text-base text-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, "<br />") }}
                />
              </CardContent>
            </Card>
          )}

          {/* Organizing Team Section */}
          {organizingTeam.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Organizing Team</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organizingTeam.map((member, idx) => (
                    <Link
                      key={idx}
                      href={`/members/${member.id}?fromEvent=${eventId}`}
                      className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/70 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        <AvatarFallback className="text-zinc-400 bg-zinc-800 text-xs">
                          {member.full_name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">
                          {member.full_name}
                        </p>
                        {member.yi_position && (
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500 mt-0.5">
                            {member.yi_position}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
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
