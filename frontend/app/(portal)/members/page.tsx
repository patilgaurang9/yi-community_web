"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MemberCard } from "@/components/members/member-card"
import { MemberFilters } from "@/components/members/member-filters"
import type { MemberFiltersState } from "@/types/members"

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
  batch_year: string | null
  created_at: string | null
  industry: string | null
  business_tags: string[] | null
  hobby_tags: string[] | null
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MemberFiltersState>({
    searchQuery: "",
    verticals: [],
    positions: [],
    industries: [],
    skills: [],
    hobbies: [],
  })

  // Fetch all members from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, role, yi_vertical, yi_position, job_title, company, location, batch_year, created_at, industry, business_tags, hobby_tags"
          )
          .order("full_name", { ascending: true })

        if (fetchError) {
          console.error("❌ Error fetching members:", fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        setMembers(data || [])
        setLoading(false)
      } catch (err: any) {
        console.error("💥 Exception fetching members:", err)
        setError(err.message || "Failed to fetch members")
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  // Helper function to parse tags (handle JSON arrays or strings)
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

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = [...members]

    // Safety: Ensure filter arrays are never undefined
    const safeVerticals = filters.verticals || []
    const safePositions = filters.positions || []
    const safeIndustries = filters.industries || []
    const safeSkills = filters.skills || []
    const safeHobbies = filters.hobbies || []

    // Search filter - match full_name only
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter((member) =>
        member.full_name?.toLowerCase().includes(query)
      )
    }

    // Vertical filter (multi-select - OR logic)
    if (safeVerticals.length > 0) {
      filtered = filtered.filter((member) => {
        if (!member.yi_vertical) return false
        return safeVerticals.includes(member.yi_vertical)
      })
    }

    // Position filter (multi-select - OR logic)
    if (safePositions.length > 0) {
      filtered = filtered.filter((member) => {
        if (!member.yi_position) return false
        return safePositions.includes(member.yi_position)
      })
    }

    // Industry filter (multi-select - OR logic)
    if (safeIndustries.length > 0) {
      filtered = filtered.filter((member) => {
        if (!member.industry) return false
        return safeIndustries.includes(member.industry)
      })
    }

    // Business Tag filter (multi-select - OR logic: member matches if they have at least one selected tag)
    if (safeSkills.length > 0) {
      filtered = filtered.filter((member) => {
        const memberTags = parseTags(member.business_tags)
        return safeSkills.some((skill) => memberTags.includes(skill))
      })
    }

    // Hobby Tag filter (multi-select - OR logic: member matches if they have at least one selected tag)
    if (safeHobbies.length > 0) {
      filtered = filtered.filter((member) => {
        const memberTags = parseTags(member.hobby_tags)
        return safeHobbies.some((hobby) => memberTags.includes(hobby))
      })
    }

    // Sort by name (A-Z)
    filtered.sort((a, b) => {
      const nameA = a.full_name || ""
      const nameB = b.full_name || ""
      return nameA.localeCompare(nameB)
    })

    return filtered
  }, [members, filters])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-zinc-400">Loading members...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Members</h1>
          <Badge className="bg-zinc-800 text-zinc-300 px-3 py-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
          <Input
            type="text"
            placeholder="Search members..."
            value={filters.searchQuery || ""}
            onChange={(e) =>
              setFilters({ ...filters, searchQuery: e.target.value })
            }
            className="h-12 w-full bg-zinc-900 border-zinc-800 pl-9 text-white placeholder:text-zinc-500 focus:bg-zinc-800 focus:border-[#FF9933]"
          />
        </div>

        {/* Filter Button */}
        <MemberFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-zinc-400">No members found matching your criteria.</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))
        )}
      </div>
    </div>
  )
}
