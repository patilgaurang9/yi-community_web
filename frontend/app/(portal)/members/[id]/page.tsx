"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Mail,
  Linkedin,
  MapPin,
  Building2,
  Calendar,
  Star,
  Gift,
  UserPlus,
  Briefcase,
  Heart,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import Link from "next/link"

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  yi_vertical: string | null
  yi_position: string | null
  job_title: string | null
  company: string | null
  industry: string | null
  avatar_url: string | null
  email: string | null
  linkedin_url: string | null
  location: string | null
  batch_year: string | null
  dob: string | null
  business_tags: string[] | null
  hobby_tags: string[] | null
  created_at: string | null
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        // Fetch profile
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", memberId)
          .single()

        if (fetchError) {
          console.error("❌ Error fetching profile:", fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        if (!data) {
          setError("Member not found")
          setLoading(false)
          return
        }

        setProfile(data)
        setLoading(false)
      } catch (err: any) {
        console.error("💥 Exception fetching profile:", err)
        setError(err.message || "Failed to fetch profile")
        setLoading(false)
      }
    }

    if (memberId) {
      fetchData()
    }
  }, [memberId])

  // Get initials for avatar fallback from full_name
  const getInitials = () => {
    if (!profile) return "??"
    if (profile.full_name) {
      const parts = profile.full_name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return profile.full_name.substring(0, 2).toUpperCase()
    }
    return "??"
  }

  // Format location
  const getLocation = () => {
    return profile?.location || "Not specified"
  }

  // Format birthday
  const getBirthday = () => {
    if (!profile?.dob) return "Not specified"
    try {
      return format(new Date(profile.dob), "MMMM d, yyyy")
    } catch {
      return "Not specified"
    }
  }

  // Format member since date
  const getMemberSince = () => {
    if (!profile?.created_at) return "Not specified"
    try {
      return format(new Date(profile.created_at), "MMMM yyyy")
    } catch {
      return "Not specified"
    }
  }

  // Parse tags (handle both string and array formats)
  const parseTags = (tags: string[] | string | null): string[] => {
    if (!tags) return []
    if (Array.isArray(tags)) return tags.filter((tag) => tag && tag.trim())
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags)
        return Array.isArray(parsed) ? parsed.filter((tag) => tag && tag.trim()) : []
      } catch {
        return tags.split(",").map((tag) => tag.trim()).filter((tag) => tag)
      }
    }
    return []
  }

  const businessTags = parseTags(profile?.business_tags)
  const hobbyTags = parseTags(profile?.hobby_tags)

  // Check if user can edit (own profile)
  const canEdit = currentUserId === memberId

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <p className="text-zinc-400">Loading profile...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">
            Error: {error || "Member not found"}
          </p>
          <Link
            href="/members"
            className="mt-4 inline-block text-[#FF9933] hover:underline"
          >
            ← Back to Members
          </Link>
        </div>
      </div>
    )
  }

  const displayName = profile.full_name || "Unknown"
  const role = profile.role || "Member"
  const isAdmin = role.toLowerCase() === "admin"
  const isHost =
    role.toLowerCase() === "host" || role.toLowerCase().includes("chair")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/members"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
        {canEdit && (
          <Link href="/complete-profile">
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Hero Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <Avatar className="h-[120px] w-[120px]">
              <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-zinc-800 text-white text-3xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Name + Role Badge */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">{displayName}</h1>
              {(isAdmin || isHost) && (
                <Badge
                  className={`text-xs uppercase px-3 py-1 ${
                    isAdmin
                      ? "bg-red-600 text-white"
                      : isHost
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {role}
                </Badge>
              )}
              {/* Vertical | Position */}
              {(profile.yi_vertical || profile.yi_position) && (
                <p className="text-base font-medium text-emerald-400">
                  {profile.yi_vertical && `${profile.yi_vertical} Vertical`}
                  {profile.yi_vertical && profile.yi_position && " | "}
                  {profile.yi_position}
                </p>
              )}
            </div>

            {/* Job Title + Company */}
            <div className="space-y-1">
              {profile.job_title && (
                <p className="text-lg text-zinc-300">{profile.job_title}</p>
              )}
              {profile.company && (
                <p className="text-base text-zinc-400">{profile.company}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-md pt-4">
              {profile.email && (
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  asChild
                >
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {profile.linkedin_url && (
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  asChild
                >
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-4">
          {/* Location */}
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                Location
              </p>
              <p className="text-base text-white">{getLocation()}</p>
            </div>
          </div>

          {/* Industry */}
          {profile.industry && (
            <div className="flex items-start gap-4 pt-4 border-t border-zinc-800">
              <Building2 className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                  Industry
                </p>
                <p className="text-base text-white">{profile.industry}</p>
              </div>
            </div>
          )}

          {/* Batch Year */}
          {profile.batch_year && (
            <div className="flex items-start gap-4 pt-4 border-t border-zinc-800">
              <Calendar className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                  Batch Year
                </p>
                <p className="text-base text-white">{profile.batch_year}</p>
              </div>
            </div>
          )}

          {/* Birthday */}
          {profile.dob && (
            <div className="flex items-start gap-4 pt-4 border-t border-zinc-800">
              <Gift className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                  Birthday
                </p>
                <p className="text-base text-white">{getBirthday()}</p>
              </div>
            </div>
          )}

          {/* Member Since */}
          {profile.created_at && (
            <div className="flex items-start gap-4 pt-4 border-t border-zinc-800">
              <UserPlus className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                  Member Since
                </p>
                <p className="text-base text-white">{getMemberSince()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags & Interests Section */}
      {(businessTags.length > 0 || hobbyTags.length > 0) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 space-y-6">
            {/* Professional Skills */}
            {businessTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Professional Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {businessTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hobbies */}
            {hobbyTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Hobbies
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hobbyTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
