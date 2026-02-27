"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  Phone,
  MapPin,
  Edit,
  Building2,
  Briefcase,
  Globe,
  Heart,
  Droplet,
  ExternalLink,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/app/(portal)/actions"

// Premium animations & styles
const styles = `
  @keyframes avatarPulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 153, 51, 0.3), 0 0 40px rgba(34, 197, 94, 0.15);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 153, 51, 0.5), 0 0 60px rgba(34, 197, 94, 0.25);
    }
  }

  @keyframes cardLift {
    0% {
      transform: translateY(0px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 30px rgba(0, 0, 0, 0.3);
    }
    100% {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15), 0 0 50px rgba(255, 153, 51, 0.15);
    }
  }

  @keyframes glowFade {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes subtleFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  .premium-card {
    position: relative;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(113, 113, 122, 0.4);
    background: linear-gradient(135deg, rgba(24, 24, 27, 0.7) 0%, rgba(39, 39, 42, 0.5) 100%);
    backdrop-filter: blur(10px);
  }

  .premium-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255, 153, 51, 0.1), rgba(34, 197, 94, 0.05));
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .premium-card:hover {
    animation: cardLift 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .premium-card:hover::before {
    opacity: 1;
  }

  .avatar-ring {
    animation: avatarPulse 4s ease-in-out infinite;
  }

  .radial-glow {
    position: relative;
  }

  .radial-glow::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 153, 51, 0.08) 0%, rgba(34, 197, 94, 0.04) 40%, transparent 70%);
    border-radius: inherit;
    pointer-events: none;
  }

  .glass-effect {
    background: rgba(24, 24, 27, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(113, 113, 122, 0.3);
  }

  .section-title {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(228, 228, 231, 0.85) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .text-premium {
    letter-spacing: 0.03em;
  }

  .saffron-accent {
    color: #FF9933;
  }

  .green-accent {
    color: #22C55E;
  }

  .hover-scale {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .hover-scale:hover {
    transform: scale(1.05);
  }

  @supports (backdrop-filter: blur(20px)) {
    .glass-effect {
      background: rgba(24, 24, 27, 0.5);
    }
  }
`
interface ProfileData {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  email: string
  avatar_url?: string | null
  yi_vertical?: string | null
  vertical_id?: string | null
  yi_position?: string | null
  role?: string | null
  phone_number?: string | null
  secondary_phone?: string | null
  secondary_email?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  location?: string | null
  location_name?: string | null
  company?: string | null
  job_title?: string | null
  industry?: string | null
  business_website?: string | null
  business_bio?: string | null
  dob?: string | null
  blood_group?: string | null
  spouse_name?: string | null
  anniversary_date?: string | null
  bio?: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  twitter_url?: string | null
  facebook_url?: string | null
  business_tags?: string[] | null
  hobby_tags?: string[] | null
  created_at?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Not authenticated")
          setLoading(false)
          return
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError(profileError.message)
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-zinc-400">{error || "Profile not found"}</p>
          <Link href="/complete-profile" className="text-sm text-zinc-500 hover:text-zinc-300 mt-2 inline-block">
            Complete your profile →
          </Link>
        </div>
      </div>
    )
  }

  // Helper Functions
  const fullName = profile.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile.full_name || "Unknown User"

  const getInitials = () => {
    if (profile.first_name) {
      return `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    }
    return fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate chapter name from city
  const getChapterName = () => {
    if (!profile.city) return null
    const city = profile.city.trim()
    // Check if it already starts with "Yi " or "YI "
    if (city.match(/^Yi\s/i)) {
      return city
    }
    // Prepend "Yi " to the city name
    return `Yi ${city}`
  }

  const chapterName = getChapterName()
  const cleanVertical = profile.yi_vertical?.replace(/vertical/gi, '').trim()

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), "MMMM d, yyyy")
    } catch {
      return null
    }
  }

  const dob = formatDate(profile.dob)
  const anniversary = formatDate(profile.anniversary_date)

  const parseTags = (tags: string[] | string | null | undefined): string[] => {
    if (!tags) return []
    if (Array.isArray(tags)) return tags.filter(Boolean)
    return []
  }

  const businessTags = parseTags(profile?.business_tags)
  const hobbyTags = parseTags(profile?.hobby_tags)

  const getFullAddress = () => {
    const parts: string[] = []
    if (profile?.address_line_1) parts.push(profile.address_line_1)
    if (profile?.address_line_2) parts.push(profile.address_line_2)
    const cityState = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ')
    if (cityState) parts.push(cityState)
    if (parts.length > 0) return parts
    if (profile?.location) return [profile.location]
    return []
  }

  const addressLines = getFullAddress()
  const hasSocials = profile.linkedin_url || profile.instagram_url || profile.twitter_url || profile.facebook_url

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen">
        {/* Header - Responsive, constrained on desktop */}
        <div className="w-full flex justify-center">
          <div
            className="w-full max-w-6xl flex items-center justify-between bg-zinc-900 shadow-md rounded-2xl
              px-4 py-4
              md:px-8 md:py-4
              lg:px-8 lg:py-3
              xl:px-10 xl:py-2
              mt-0 mb-8
              sticky top-0 z-40
            "
            style={{
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <h1 className="text-xl md:text-2xl font-bold text-white">Profile</h1>
            <Link href="/complete-profile">
              <Button size="sm" className="bg-orange-600 text-white font-semibold shadow-md">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content - Responsive Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* LEFT COLUMN - Identity + Communication */}
          <div className="xl:col-span-2 space-y-6">
            {/* Profile Card (avatar, name, role) */}
            <div className="rounded-3xl p-8 bg-zinc-800 shadow-md">

              {/* Avatar with Premium Ring */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-40 w-40 border-2 border-zinc-700">
                    <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
                    <AvatarFallback className="bg-orange-600 text-white text-5xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Name */}
              <div className="text-center space-y-2">
                <h2 className="text-base font-semibold text-white">
                  {fullName}
                </h2>

                {/* Chapter Name */}
                {chapterName && (
                  <h2 className="text-base font-semibold text-white">
                    {chapterName}
                  </h2>
                )}

                {/* Vertical (clean) */}
                {cleanVertical && (
                  <div className="pt-2">
                    <Badge variant="premium">
                      {cleanVertical}
                    </Badge>
                  </div>
                )}

                {/* Position */}
                {profile.yi_position && (
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-500 pt-2 pb-2">
                    {profile.yi_position}
                  </p>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="space-y-2 border-t border-zinc-700/50 pt-4">
                  <p className="text-sm text-zinc-300 leading-relaxed text-center">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                </div>
              )}

              {/* Social Links - Icon Only */}
              {hasSocials && (
                <div className="flex justify-center gap-3 pt-2">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-zinc-800/60 hover:bg-blue-600/30 rounded-xl transition-all duration-300 hover-scale border border-zinc-700/50 hover:border-blue-500/50"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-blue-400" />
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-zinc-800/60 hover:bg-pink-600/30 rounded-xl transition-all duration-300 hover-scale border border-zinc-700/50 hover:border-pink-500/50"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-zinc-800/60 hover:bg-sky-600/30 rounded-xl transition-all duration-300 hover-scale border border-zinc-700/50 hover:border-sky-500/50"
                      title="Twitter"
                    >
                      <Twitter className="w-4 h-4 text-sky-400" />
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-zinc-800/60 hover:bg-blue-700/30 rounded-xl transition-all duration-300 hover-scale border border-zinc-700/50 hover:border-blue-600/50"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4 text-blue-500" />
                    </a>
                  )}
                </div>
              )}

            </div>

            {/* Logout Action */}
            <div className="rounded-2xl p-6 bg-zinc-800 shadow-md">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm text-red-400 font-medium transition-all duration-300 hover-scale border border-red-500/20 hover:border-red-500/40"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </form>
            </div>

            {/* Contact Details */}
            {(profile.email || profile.secondary_email || profile.phone_number || profile.secondary_phone) && (
              <div className="rounded-2xl p-6 bg-zinc-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg border border-emerald-500/30">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white section-title">Contact</h3>
                </div>

                {profile.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Email</p>
                      <a
                        href={`mailto:${profile.email}`}
                        className="text-sm text-zinc-300 hover:text-emerald-400 transition-colors break-all text-premium"
                      >
                        {profile.email}
                      </a>
                    </div>
                  </div>
                )}

                {profile.secondary_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-600 mb-0.5 font-semibold tracking-wider">Email (Alt)</p>
                      <a
                        href={`mailto:${profile.secondary_email}`}
                        className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors break-all text-premium"
                      >
                        {profile.secondary_email}
                      </a>
                    </div>
                  </div>
                )}

                {profile.phone_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Phone</p>
                      <p className="text-sm text-zinc-300 text-premium">{profile.phone_number}</p>
                    </div>
                  </div>
                )}

                {profile.secondary_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-600 mb-0.5 font-semibold tracking-wider">Phone (Alt)</p>
                      <p className="text-sm text-zinc-400 text-premium">{profile.secondary_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Information */}
          <div className="xl:col-span-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Professional Card */}
              {(profile.company || profile.job_title || profile.industry || profile.business_website || profile.business_bio) && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md md:col-span-1 xl:col-span-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white section-title">Work & Business</h3>
                  </div>

                  {profile.job_title && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1 font-semibold tracking-wider">Role</p>
                      <p className="text-sm font-semibold text-white text-premium">{profile.job_title}</p>
                    </div>
                  )}

                  {profile.company && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1 font-semibold tracking-wider">Company</p>
                      <p className="text-sm text-zinc-300 text-premium">{profile.company}</p>
                    </div>
                  )}

                  {profile.industry && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1 font-semibold tracking-wider">Industry</p>
                      <p className="text-sm text-zinc-300 text-premium">{profile.industry}</p>
                    </div>
                  )}

                  {profile.business_website && (
                    <a
                      href={profile.business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 rounded-lg text-xs text-blue-300 transition-all duration-300 hover-scale border border-blue-500/20 hover:border-blue-500/40"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {profile.business_bio && (
                    <div className="pt-3 border-t border-zinc-700/50">
                      <p className="text-xs text-zinc-400 leading-relaxed text-premium italic">{profile.business_bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* About Card (Bio) */}
              {profile.bio && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md md:col-span-1 xl:col-span-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-zinc-700 rounded-lg">
                      <Droplet className="w-5 h-5 text-rose-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white section-title">About</h3>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                </div>
              )}

              {/* Personal Card - moved to right column, spans full width */}
              {(dob || anniversary || profile.spouse_name || profile.blood_group) && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md w-full md:col-span-2 xl:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-zinc-700 rounded-lg">
                      <Heart className="w-5 h-5 text-rose-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Personal</h3>
                  </div>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {dob && (
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Date of Birth</span>
                        <span className="text-sm text-zinc-300">{dob}</span>
                      </div>
                    )}
                    {anniversary && (
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Anniversary</span>
                        <span className="text-sm text-zinc-300">{anniversary}</span>
                      </div>
                    )}
                    {profile.spouse_name && (
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Spouse</span>
                        <span className="text-sm text-zinc-300">{profile.spouse_name}</span>
                      </div>
                    )}
                    {profile.blood_group && (
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-zinc-500 mb-0.5 font-semibold tracking-wider">Blood Group</span>
                        <span className="text-sm font-bold text-red-400">{profile.blood_group}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location Card */}
              {addressLines && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md md:col-span-2 xl:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gradient-to-br from-violet-500/20 to-violet-600/20 rounded-lg border border-violet-500/30 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white section-title mb-3">Location</h3>
                      <div className="space-y-1.5">
                        {addressLines.map((line, idx) => (
                          <p key={idx} className="text-sm text-zinc-300 text-premium">{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Card */}
              {businessTags.length > 0 && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md md:col-span-2 xl:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg border border-cyan-500/30">
                      <Briefcase className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white section-title">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {businessTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 text-cyan-300 text-xs font-medium rounded-lg border border-cyan-500/20 hover-scale transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hobbies Card */}
              {hobbyTags.length > 0 && (
                <div className="rounded-2xl p-6 bg-zinc-800 shadow-md md:col-span-2 xl:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg border border-amber-500/30">
                      <Heart className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white section-title">Hobbies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hobbyTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/20 hover-scale transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
