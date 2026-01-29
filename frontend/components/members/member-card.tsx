"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin } from "lucide-react"

interface Member {
  id: string
  full_name: string | null
  role: string | null
  yi_vertical: string | null
  yi_position: string | null
  job_title: string | null
  company: string | null
  avatar_url: string | null
  location: string | null
}

interface MemberCardProps {
  member: Member
}

export function MemberCard({ member }: MemberCardProps) {
  // Get initials for fallback avatar from full_name
  const getInitials = () => {
    if (member.full_name) {
      const parts = member.full_name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return member.full_name.substring(0, 2).toUpperCase()
    }
    return "??"
  }

  const initials = getInitials()
  const displayName = member.full_name || "Unknown"

  // Clean vertical name (remove "Vertical" word)
  const cleanVertical = member.yi_vertical?.replace(/vertical/gi, '').trim()

  // Format location
  const location = member.location || "Location TBD"

  // Format job title @ company
  const jobDisplay = member.job_title && member.company
    ? `${member.job_title} @ ${member.company}`
    : member.job_title || member.company || "Job Title @ Company"

  return (
    <Link href={`/members/${member.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/50 cursor-pointer">
        {/* Header: Avatar (Left) + Name/Details (Right) */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-14 w-14 flex-shrink-0">
            <AvatarImage src={member.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-zinc-800 text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white tracking-tight truncate">
              {displayName}
            </h3>
            {/* YI Vertical (Primary) */}
            {cleanVertical && (
              <span className="text-sm font-bold text-orange-400 mt-1 inline-block">
                {cleanVertical}
              </span>
            )}
            {/* YI Position (Secondary) */}
            {member.yi_position && (
              <span className="text-xs font-medium text-zinc-400 block mt-0.5">
                {member.yi_position}
              </span>
            )}
          </div>
        </div>

        {/* Body: Job Title @ Company */}
        <p className="text-sm text-zinc-300 truncate mb-3">{jobDisplay}</p>

        {/* Footer: Location */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
