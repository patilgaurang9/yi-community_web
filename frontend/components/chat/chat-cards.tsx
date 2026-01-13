'use client';

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Copy, Check } from "lucide-react"
import { format } from "date-fns"
import type { MemberData, EventData, OfferData } from "@/types/chat"
import { useState } from "react"
import { BuzzImage } from "@/components/buzz/buzz-image"

interface ChatCardsProps {
  data?: MemberData[] | EventData[] | OfferData[]
  category?: "members" | "events" | "offers" | "general"
}

// Member Card Component
function MemberChatCard({ member }: { member: MemberData }) {
  const getInitials = () => {
    const parts = member.full_name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return member.full_name.substring(0, 2).toUpperCase()
  }

  return (
    <Link href={`/members/${member.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-all flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={member.avatar_url} alt={member.full_name} />
          <AvatarFallback className="bg-zinc-800 text-white text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {member.full_name}
          </h4>
          {(member.job_title || member.company) && (
            <p className="text-xs text-zinc-400 truncate">
              {member.job_title && member.company
                ? `${member.job_title} @ ${member.company}`
                : member.job_title || member.company}
            </p>
          )}
          {member.match_reason && (
            <p className="text-xs text-zinc-500 mt-1">{member.match_reason}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={(e) => {
            e.preventDefault()
            window.location.href = `/members/${member.id}`
          }}
        >
          View
        </Button>
      </div>
    </Link>
  )
}

// Event Card Component
function EventChatCard({ event }: { event: EventData }) {
  const formatDateBadge = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const day = date.getDate()
      return { month, day, time: format(date, "h:mm a") }
    } catch {
      return { month: "N/A", day: "?", time: "" }
    }
  }

  const { month, day, time } = formatDateBadge(event.start_time)

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-all flex items-center gap-3">
        <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-800/50 px-2 py-1.5 min-w-[50px]">
          <span className="text-xs font-semibold text-zinc-400 uppercase">
            {month}
          </span>
          <span className="text-lg font-bold text-white">{day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {event.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            {time && (
              <>
                <Calendar className="h-3 w-3" />
                <span>{time}</span>
              </>
            )}
            {event.location_name && (
              <>
                <span>•</span>
                <span className="truncate">{event.location_name}</span>
              </>
            )}
          </div>
          {event.category && (
            <Badge className="mt-1 text-xs bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30">
              {event.category}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={(e) => {
            e.preventDefault()
            window.location.href = `/events/${event.id}`
          }}
        >
          RSVP
        </Button>
      </div>
    </Link>
  )
}

// Offer Card Component
function OfferChatCard({ offer }: { offer: OfferData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    if (offer.code) {
      navigator.clipboard.writeText(offer.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-white mb-2">{offer.title}</h4>
      {offer.description && (
        <p className="text-xs text-zinc-400 mb-3">{offer.description}</p>
      )}
      {offer.code && (
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-[#FF9933]">
            {offer.code}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Grid Wrapper Component
export function ChatCards({ data, category }: ChatCardsProps) {
  if (!data || data.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {category === "members" &&
        (data as MemberData[]).map((member) => (
          <MemberChatCard key={member.id} member={member} />
        ))}
      {category === "events" &&
        (data as EventData[]).map((event) => (
          <EventChatCard key={event.id} event={event} />
        ))}
      {category === "offers" &&
        (data as OfferData[]).map((offer) => (
          <OfferChatCard key={offer.id} offer={offer} />
        ))}
    </div>
  )
}
