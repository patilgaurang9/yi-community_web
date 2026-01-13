"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseMemberFiltersReturn {
  verticals: string[]
  positions: string[]
  industries: string[]
  businessTags: string[]
  hobbyTags: string[]
  loading: boolean
}

export function useMemberFilters(): UseMemberFiltersReturn {
  const [verticals, setVerticals] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [businessTags, setBusinessTags] = useState<string[]>([])
  const [hobbyTags, setHobbyTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const supabase = createClient()

        // Fetch all profiles with the needed columns
        const { data, error } = await supabase
          .from("profiles")
          .select("yi_vertical, yi_position, industry, business_tags, hobby_tags")

        if (error) {
          console.error("❌ Error fetching member filters:", error)
          setLoading(false)
          return
        }

        // Extract unique verticals
        const uniqueVerticals = new Set<string>()
        data?.forEach((profile) => {
          if (profile.yi_vertical && profile.yi_vertical.trim()) {
            uniqueVerticals.add(profile.yi_vertical.trim())
          }
        })
        const sortedVerticals = Array.from(uniqueVerticals).sort((a, b) =>
          a.localeCompare(b)
        )
        setVerticals(sortedVerticals)

        // Extract unique positions
        const uniquePositions = new Set<string>()
        data?.forEach((profile) => {
          if (profile.yi_position && profile.yi_position.trim()) {
            uniquePositions.add(profile.yi_position.trim())
          }
        })
        const sortedPositions = Array.from(uniquePositions).sort((a, b) =>
          a.localeCompare(b)
        )
        setPositions(sortedPositions)

        // Extract unique industries
        const uniqueIndustries = new Set<string>()
        data?.forEach((profile) => {
          if (profile.industry && profile.industry.trim()) {
            uniqueIndustries.add(profile.industry.trim())
          }
        })
        const sortedIndustries = Array.from(uniqueIndustries).sort((a, b) =>
          a.localeCompare(b)
        )
        setIndustries(sortedIndustries)

        // Extract unique business tags (parse JSON strings)
        const uniqueBusinessTags = new Set<string>()
        data?.forEach((profile) => {
          if (profile.business_tags) {
            let tags: string[] = []
            if (Array.isArray(profile.business_tags)) {
              tags = profile.business_tags
            } else if (typeof profile.business_tags === "string") {
              try {
                const parsed = JSON.parse(profile.business_tags)
                tags = Array.isArray(parsed) ? parsed : []
              } catch {
                // If not JSON, treat as comma-separated
                const stringValue = profile.business_tags as string
                tags = stringValue.split(",").map((t: string) => t.trim())
              }
            }
            tags.forEach((tag) => {
              if (tag && tag.trim()) {
                uniqueBusinessTags.add(tag.trim())
              }
            })
          }
        })
        const sortedBusinessTags = Array.from(uniqueBusinessTags).sort((a, b) =>
          a.localeCompare(b)
        )
        setBusinessTags(sortedBusinessTags)

        // Extract unique hobby tags (parse JSON strings)
        const uniqueHobbyTags = new Set<string>()
        data?.forEach((profile) => {
          if (profile.hobby_tags) {
            let tags: string[] = []
            if (Array.isArray(profile.hobby_tags)) {
              tags = profile.hobby_tags
            } else if (typeof profile.hobby_tags === "string") {
              try {
                const parsed = JSON.parse(profile.hobby_tags)
                tags = Array.isArray(parsed) ? parsed : []
              } catch {
                // If not JSON, treat as comma-separated
                const stringValue = profile.hobby_tags as string
                tags = stringValue.split(",").map((t: string) => t.trim())
              }
            }
            tags.forEach((tag) => {
              if (tag && tag.trim()) {
                uniqueHobbyTags.add(tag.trim())
              }
            })
          }
        })
        const sortedHobbyTags = Array.from(uniqueHobbyTags).sort((a, b) =>
          a.localeCompare(b)
        )
        setHobbyTags(sortedHobbyTags)

        setLoading(false)
      } catch (err) {
        console.error("💥 Exception fetching member filters:", err)
        setLoading(false)
      }
    }

    fetchFilters()
  }, [])

  return {
    verticals: verticals || [],
    positions: positions || [],
    industries: industries || [],
    businessTags: businessTags || [],
    hobbyTags: hobbyTags || [],
    loading,
  }
}
