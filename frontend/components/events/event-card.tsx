"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, ArrowRight, Users } from "lucide-react"
import { useRSVP } from "@/hooks/useRSVP"
import { format } from "date-fns"
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

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const { count } = useRSVP(event.id)

  // Format date for badge (Month/Day)
  const formatDateBadge = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const day = date.getDate()
      return { month, day }
    } catch {
      return { month: "N/A", day: "?" }
    }
  }

  // Format full date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy")
    } catch {
      return dateString
    }
  }

  const { month, day } = formatDateBadge(event.start_time)
  const imageUrl = event.image_url || "https://placehold.co/400x250/18181b/ffffff?text=Event"
  const primaryVertical = event.category || "Yi Event"

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-[#FF9933] hover:shadow-lg">
        {/* Image Section */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#FF9933]/20 to-[#138808]/20">
          <BuzzImage
            src={imageUrl}
            alt={event.title || "Event"}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            fallbackSrc="https://placehold.co/400x250/18181b/ffffff?text=Event"
          />
          {event.category && (
            <div className="absolute right-2 top-2 z-10">
              <Badge className="bg-[#FF9933] text-white">
                {event.category}
              </Badge>
            </div>
          )}
          {event.is_featured && (
            <div className="absolute left-2 top-2 z-10">
              <Badge className="bg-[#138808] text-white">
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Info Section */}
        <CardContent className="p-3 flex flex-col h-full">
          {/* Date Badge and Title */}
          <div className="mb-2 flex items-start gap-3">
            <div className="flex flex-col items-center rounded-lg border border-border bg-muted px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {month}
              </span>
              <span className="text-xl font-bold text-foreground">
                {day}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-[#FF9933] transition-colors">
                {event.title || "Untitled Event"}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {event.location_name || "Location TBD"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(event.start_time)}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {event.description}
            </p>
          )}

          {/* Organized by Vertical */}
          <div className="mb-2 flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Organized by</span>
            <span className="font-semibold text-[#FF9933] uppercase tracking-wider">
              {primaryVertical}
            </span>
          </div>

          {/* View Details Link - Premium Styling */}
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            {/* Attendee Count */}
            {count > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{count} going</span>
              </div>
            )}
            {count === 0 && <div />}
            
            {/* View Details Link */}
            <div className="flex items-center gap-1.5 text-[#FF9933] group-hover:text-[#FF9933]/80 transition-colors">
              <span className="text-sm font-semibold uppercase tracking-wide">
                View Details
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
