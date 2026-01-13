"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatBirthdayDate, type BirthdayProfile } from "@/lib/birthday-utils"

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

  const initials = getInitials()
  const dateLabel = formatBirthdayDate(profile)

  return (
    <Link href={`/members/${profile.id}`}>
      <div
        className={`bg-zinc-900 border rounded-xl p-4 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50 transition-all duration-300 flex items-center gap-4 ${
          profile.isToday
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-zinc-800"
        }`}
      >
        {/* Left: Avatar */}
        <Avatar className="h-14 w-14 flex-shrink-0">
          <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="bg-zinc-800 text-white text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Middle: Name + Age Badge */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate">{displayName}</h3>
          {/* Age Badge (only show if Today/Upcoming) */}
          {(profile.isToday || isUpcoming) && (
            <Badge className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 mt-1">
              {profile.age} {profile.age === 1 ? "year old" : "years old"}
            </Badge>
          )}
        </div>

        {/* Right: Date Badge */}
        <Badge
          className={`text-xs px-3 py-1 flex-shrink-0 ${
            profile.isToday
              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
              : isUpcoming
              ? "bg-violet-500/20 text-violet-500 border border-violet-500/30"
              : "bg-zinc-800 text-zinc-300"
          }`}
        >
          {dateLabel}
        </Badge>
      </div>
    </Link>
  )
}
