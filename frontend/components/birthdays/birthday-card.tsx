"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatBirthdayDate, type BirthdayProfile } from "@/lib/birthday-utils"
import { MessageCircle } from "lucide-react"

interface BirthdayCardProps {
  profile: BirthdayProfile
}

export function BirthdayCard({ profile }: BirthdayCardProps) {
  const displayName = profile.full_name || "Unknown"
  const isUpcoming = profile.daysUntil > 0 && profile.daysUntil <= 7

  // Get initials for fallback avatar
  const getInitials = () => {
    if (profile.full_name) {
      const parts = profile.full_name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return profile.full_name.substring(0, 2).toUpperCase()
    }
    return "??"
  }

  /* REMOVE UNUSED IMPORTS IF ANY, KEEP NECESSARY ONES */
  const initials = getInitials()
  const dateLabel = formatBirthdayDate(profile)

  // Construct WhatsApp Link
  const whatsappLink = profile.phone_number
    ? `https://wa.me/${profile.phone_number}?text=${encodeURIComponent(`Happy Birthday ${profile.full_name}! Wishing you a fantastic day ahead! -via Yi Kanpur Portal`)}`
    : null;

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${profile.isToday
        ? "bg-zinc-900 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
        }`}
    >
      <div className="flex items-center gap-4">
        {/* Left: Avatar */}
        <Link href={`/members/${profile.id}?from=birthdays`} className="flex-shrink-0">
          <Avatar className={`h-14 w-14 ${profile.isToday ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900' : ''}`}>
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-zinc-800 text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Middle: Name + Age Sentence */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-baseline gap-2 overflow-hidden w-full">
            <Link href={`/members/${profile.id}?from=birthdays`} className="truncate">
              <h3 className="text-white font-bold text-lg truncate hover:text-[#FF9933] transition-colors leading-tight">
                {displayName}
              </h3>
            </Link>

            {/* Age Sentence - Muted next to name */}
            {profile.isToday && (
              <span className="hidden sm:inline-block text-xs font-medium text-zinc-500 flex-shrink-0">
                Turning {profile.age} today
              </span>
            )}
          </div>

          {/* Mobile Age Sentence (below name if needed or just use logic) -> let's keep it clean. 
               The user asked for "next to the name". 
           */}
          {!profile.isToday && (
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Turning {profile.age}
            </p>
          )}
          {profile.isToday && (
            <p className="sm:hidden text-xs text-zinc-500 font-medium mt-0.5">
              Turning {profile.age} today
            </p>
          )}
        </div>

        {/* Right: Date Label (Text Only for Upcoming) */}
        {!profile.isToday && (
          <span className="text-xs font-medium text-zinc-400 whitespace-nowrap bg-zinc-800/50 px-2 py-1 rounded-md">
            {dateLabel}
          </span>
        )}
      </div>

      {/* Divider & WhatsApp Action for Today */}
      {profile.isToday && whatsappLink && (
        <div className="mt-4">
          <div className="h-px w-full bg-white/5 mb-3" />
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full h-9 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold rounded-lg transition-colors gap-2 shadow-sm"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            Wish on WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
