"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseMemberAttributesReturn {
  industries: string[]
  businessTags: string[]
  hobbyTags: string[]
  loading: boolean
}

export function useMemberAttributes(): UseMemberAttributesReturn {
  const [industries, setIndustries] = useState<string[]>([])
  const [businessTags, setBusinessTags] = useState<string[]>([])
  const [hobbyTags, setHobbyTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const supabase = createClient()

        // Fetch all profiles with the needed columns
        const { data, error } = await supabase
          .from("profiles")
          .select("industry, business_tags, hobby_tags")

        if (error) {
          console.error("❌ Error fetching member attributes:", error)
          setLoading(false)
          return
        }

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

        // Extract unique business tags
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
                tags = profile.business_tags.split(",").map((t) => t.trim())
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

        // Extract unique hobby tags
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
                tags = profile.hobby_tags.split(",").map((t) => t.trim())
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
        console.error("💥 Exception fetching member attributes:", err)
        setLoading(false)
      }
    }

    fetchAttributes()
  }, [])

  return {
    industries,
    businessTags,
    hobbyTags,
    loading,
  }
}
