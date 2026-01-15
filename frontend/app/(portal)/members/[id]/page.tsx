"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Building2,
  Briefcase,
  Droplet,
  Gift,
  UserPlus,
  Heart,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

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
  dob: string | null
  business_tags: string[] | null
  hobby_tags: string[] | null
  created_at: string | null
  secondary_email: string | null
  secondary_phone: string | null
  business_website: string | null
  blood_group: string | null
  phone_number: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  country: string | null
  bio: string | null
  business_bio: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
}

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

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
      } catch (err) {
        console.error("💥 Exception fetching profile:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile"
        setError(errorMessage)
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

  const businessTags = parseTags(profile?.business_tags ?? null)
  const hobbyTags = parseTags(profile?.hobby_tags ?? null)

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

  // Clean vertical name (remove "Vertical" word)
  const cleanVertical = profile.yi_vertical?.replace(/vertical/gi, '').trim()
  
  // Get full address or fallback
  const getFullAddress = (): string[] | null => {
    const parts: string[] = []
    if (profile.address_line_1) parts.push(profile.address_line_1)
    if (profile.address_line_2) parts.push(profile.address_line_2)
    
    const cityState = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
    if (cityState) parts.push(cityState)
    
    if (parts.length > 0) return parts
    if (profile.location) return [profile.location]
    return null
  }
  
  const addressLines = getFullAddress()

  return (
    <div className="min-h-screen">
      {/* Back to Members Button */}
      <div className="w-full flex justify-start mb-4">
        <Link href="/members" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Members
        </Link>
      </div>
      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {/* LEFT COLUMN - Identity & Contact */}
        <div className="xl:col-span-2 space-y-5">
          {/* Avatar & Name Card */}
          <div className="rounded-3xl p-6 bg-zinc-800 shadow-md flex flex-col items-center text-center">
            <div className="flex flex-col items-center justify-center w-full">
              <Avatar className="h-32 w-32 mb-3 rounded-full border-2 border-zinc-700">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-zinc-800 text-white text-4xl font-semibold flex items-center justify-center h-full w-full rounded-full">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
              {/* YI Vertical (Primary) */}
              {cleanVertical && (
                <span className="mt-1 text-base font-bold text-orange-400">
                  {cleanVertical}
                </span>
              )}
              {/* YI Position (Secondary) */}
              {profile.yi_position && (
                <span className="mt-1 text-xs font-medium text-zinc-400">
                  {profile.yi_position}
                </span>
              )}
            </div>
          </div>
          {/* Contact Info Card */}
          <div className="rounded-2xl p-4 bg-zinc-800 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Contact</h3>
            <div className="flex flex-col gap-2">
              {/* Primary Email */}
              {profile.email && (
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Email</span>
                  <a href={`mailto:${profile.email}`} className="text-sm text-zinc-200 hover:text-blue-400 transition-colors break-all">
                    {profile.email}
                  </a>
                </div>
              )}
              {/* Secondary Email */}
              {profile.secondary_email && (
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Email (Alt)</span>
                  <a href={`mailto:${profile.secondary_email}`} className="text-sm text-zinc-200 hover:text-blue-400 transition-colors break-all">
                    {profile.secondary_email}
                  </a>
                </div>
              )}
              {/* Primary Phone */}
              {profile.phone_number && (
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Phone</span>
                  <span className="text-sm text-zinc-200">{profile.phone_number}</span>
                </div>
              )}
              {/* Secondary Phone */}
              {profile.secondary_phone && (
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Phone (Alt)</span>
                  <span className="text-sm text-zinc-200">{profile.secondary_phone}</span>
                </div>
              )}
              {/* Website */}
              {profile.business_website && (
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Website</span>
                  <a href={profile.business_website} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors break-all">
                    {profile.business_website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
              {/* Social Links */}
              {(profile.linkedin_url || profile.facebook_url || profile.twitter_url || profile.instagram_url) && (
                <div className="flex gap-2 mt-2">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors">
                      <Linkedin className="w-4 h-4 text-blue-500" />
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 hover:bg-blue-600/20 rounded transition-colors">
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-500/10 hover:bg-sky-500/20 rounded transition-colors">
                      <Twitter className="w-4 h-4 text-sky-500" />
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-500/10 hover:bg-pink-500/20 rounded transition-colors">
                      <Instagram className="w-4 h-4 text-pink-500" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Information */}
        <div className="xl:col-span-4 space-y-4">
          {/* Professional Info Card */}
          <div className="rounded-2xl p-4 bg-zinc-800 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Professional</h3>
            
            <div className="space-y-4">
              {/* Job Title */}
              {profile.job_title && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Role</p>
                  <p className="text-lg font-semibold text-white">{profile.job_title}</p>
                </div>
              )}

              {/* Company */}
              {profile.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Company</p>
                    <p className="text-base font-medium text-zinc-200">{profile.company}</p>
                  </div>
                </div>
              )}

              {/* Industry */}
              {profile.industry && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Industry</p>
                    <p className="text-base font-medium text-zinc-200">{profile.industry}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          {(profile.bio || profile.business_bio) && (
            <div className="rounded-2xl p-4 bg-zinc-800 shadow-md">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">About</h3>
              <div className="space-y-3">
                {profile.bio && (
                  <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>
                )}
                {profile.business_bio && profile.bio !== profile.business_bio && (
                  <>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mt-4 mb-2">Business</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{profile.business_bio}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Personal Info Card - grid layout */}
          <div className="rounded-2xl p-4 bg-zinc-800 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Blood Group */}
              {profile.blood_group && (
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Blood Group</p>
                    <p className="text-sm font-bold text-red-400">{profile.blood_group}</p>
                  </div>
                </div>
              )}
              {/* Birthday */}
              {profile.dob && (
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Birthday</p>
                    <p className="text-sm text-zinc-300">{getBirthday()}</p>
                  </div>
                </div>
              )}
              {/* Member Since */}
              {profile.created_at && (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-0.5">Member Since</p>
                    <p className="text-sm text-zinc-300">{getMemberSince()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location / Address Card */}
          {addressLines && (
            <div className="rounded-2xl p-4 bg-zinc-800 shadow-md">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Location</h3>
              <div className="space-y-0.5">
                {addressLines.map((line, idx) => (
                  <p key={idx} className="text-sm text-zinc-300">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Interests & Skills */}
          {(businessTags.length > 0 || hobbyTags.length > 0) && (
            <div className="rounded-2xl p-4 bg-zinc-800 shadow-md space-y-4">
              
              {/* Professional Skills */}
              {businessTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {businessTags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/10 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-500/20"
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
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hobbies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hobbyTags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-pink-500/10 text-pink-400 text-xs font-medium px-3 py-1.5 rounded-full border border-pink-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
