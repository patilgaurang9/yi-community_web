"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Linkedin, Instagram, Twitter, Facebook, Mail, Phone, MapPin, Calendar, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
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

        // Fetch full profile
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
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">{error || "Profile not found"}</p>
      </div>
    )
  }

  const fullName = profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const dob = profile.dob ? format(new Date(profile.dob), "MMMM d, yyyy") : null
  const anniversary = profile.anniversary_date
    ? format(new Date(profile.anniversary_date), "MMMM d, yyyy")
    : null

  return (
    <div className="space-y-6">
      {/* Header Card with Banner and Avatar */}
      <Card className="relative overflow-hidden border-0">
        {/* Banner Gradient */}
        <div className="h-48 bg-gradient-to-r from-[#FF9933] to-[#138808]" />
        
        {/* Avatar Overlapping */}
        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
                {profile.yi_vertical && (
                  <Badge className="mt-2 bg-[#FF9933] text-white">
                    {profile.yi_vertical}
                  </Badge>
                )}
                {profile.yi_position && (
                  <Badge variant="outline" className="ml-2 mt-2">
                    {profile.yi_position}
                  </Badge>
                )}
              </div>
            </div>
            <Link href="/complete-profile">
              <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Professional & Bio */}
        <div className="space-y-6">
          {/* Professional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Professional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.company && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-foreground">{profile.company}</p>
                </div>
              )}
              {profile.job_title && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="text-foreground">{profile.job_title}</p>
                </div>
              )}
              {profile.industry && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-foreground">{profile.industry}</p>
                </div>
              )}
              {profile.business_bio && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Bio</p>
                  <p className="text-foreground whitespace-pre-wrap">{profile.business_bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Bio */}
          {profile.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Column 2: Contact & Details */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-foreground hover:text-[#FF9933]"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.secondary_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${profile.secondary_email}`}
                    className="text-foreground hover:text-[#FF9933]"
                  >
                    {profile.secondary_email}
                  </a>
                </div>
              )}
              {profile.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${profile.phone_number}`}
                    className="text-foreground hover:text-[#FF9933]"
                  >
                    {profile.phone_number}
                  </a>
                </div>
              )}
              {profile.secondary_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${profile.secondary_phone}`}
                    className="text-foreground hover:text-[#FF9933]"
                  >
                    {profile.secondary_phone}
                  </a>
                </div>
              )}
              {(profile.address_line_1 || profile.city || profile.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-foreground">
                    {profile.address_line_1 && <p>{profile.address_line_1}</p>}
                    {profile.address_line_2 && <p>{profile.address_line_2}</p>}
                    <p>
                      {[profile.city, profile.state, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dob && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-foreground">{dob}</p>
                  </div>
                </div>
              )}
              {anniversary && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Anniversary</p>
                    <p className="text-foreground">{anniversary}</p>
                  </div>
                </div>
              )}
              {profile.spouse_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Spouse</p>
                  <p className="text-foreground">{profile.spouse_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          {(profile.linkedin_url ||
            profile.instagram_url ||
            profile.twitter_url ||
            profile.facebook_url) && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:text-[#FF9933]"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:text-[#FF9933]"
                    >
                      <Instagram className="h-5 w-5" />
                      <span className="text-sm">Instagram</span>
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:text-[#FF9933]"
                    >
                      <Twitter className="h-5 w-5" />
                      <span className="text-sm">Twitter</span>
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:text-[#FF9933]"
                    >
                      <Facebook className="h-5 w-5" />
                      <span className="text-sm">Facebook</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tags Section */}
      {(profile.business_tags?.length > 0 || profile.hobby_tags?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.business_tags && profile.business_tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Business Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.business_tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.hobby_tags && profile.hobby_tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Hobby Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.hobby_tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
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
