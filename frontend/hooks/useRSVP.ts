"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export type RSVPStatus = "going" | "interested" | null

interface UseRSVPReturn {
  status: RSVPStatus
  count: number
  loading: boolean
  toggleRSVP: (newStatus: "going" | "interested") => Promise<void>
}

export function useRSVP(eventId: string): UseRSVPReturn {
  const [status, setStatus] = useState<RSVPStatus>(null)
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch RSVP status and count
  const fetchRSVPData = useCallback(async () => {
    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus(null)
        // Still fetch count even if user is not logged in
        const { count: goingCount, error: countError } = await supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "going")

        if (countError) {
          console.error("❌ Error fetching RSVP count:", countError)
          setCount(0)
        } else {
          setCount(goingCount || 0)
        }
        setLoading(false)
        return
      }

      // Fetch user's RSVP status
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (rsvpError) {
        console.error("❌ Error fetching RSVP status:", rsvpError)
        setStatus(null)
      } else {
        setStatus((rsvpData?.status as RSVPStatus) || null)
      }

      // Fetch count of users with status 'going'
      const { count: goingCount, error: countError } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "going")

      if (countError) {
        console.error("❌ Error fetching RSVP count:", countError)
        setCount(0)
      } else {
        setCount(goingCount || 0)
      }

      setLoading(false)
    } catch (err) {
      console.error("💥 Exception fetching RSVP data:", err)
      setStatus(null)
      setCount(0)
      setLoading(false)
    }
  }, [eventId])

  // Fetch on mount
  useEffect(() => {
    if (eventId) {
      void fetchRSVPData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Toggle RSVP function
  const toggleRSVP = useCallback(
    async (newStatus: "going" | "interested") => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          alert("Please login first")
          return
        }

        // Optimistic update for count
        const wasGoing = status === "going"
        const willBeGoing = newStatus === "going"

        // If clicking the same status, remove RSVP
        if (status === newStatus) {
          // Optimistic update: decrease count if removing 'going'
          if (wasGoing) {
            setCount((prev) => Math.max(0, prev - 1))
          }
          setStatus(null)

          // Delete RSVP
          const { error: deleteError } = await supabase
            .from("event_rsvps")
            .delete()
            .eq("event_id", eventId)
            .eq("user_id", user.id)

          if (deleteError) {
            console.error("❌ Error deleting RSVP:", deleteError)
            // Revert optimistic update
            if (wasGoing) {
              setCount((prev) => prev + 1)
            }
            setStatus(status) // Revert status
            alert("Failed to remove RSVP. Please try again.")
            return
          }
        } else {
          // Upsert RSVP
          // Optimistic update for count
          if (wasGoing && !willBeGoing) {
            // Was going, now not going
            setCount((prev) => Math.max(0, prev - 1))
          } else if (!wasGoing && willBeGoing) {
            // Was not going, now going
            setCount((prev) => prev + 1)
          }

          setStatus(newStatus)

          const { error: upsertError } = await supabase
            .from("event_rsvps")
            .upsert(
              {
                event_id: eventId,
                user_id: user.id,
                status: newStatus,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: "event_id,user_id",
              }
            )

          if (upsertError) {
            console.error("❌ Error upserting RSVP:", upsertError)
            // Revert optimistic update
            if (wasGoing && !willBeGoing) {
              setCount((prev) => prev + 1)
            } else if (!wasGoing && willBeGoing) {
              setCount((prev) => Math.max(0, prev - 1))
            }
            setStatus(status) // Revert status
            alert("Failed to update RSVP. Please try again.")
            return
          }
        }

        // Re-fetch to confirm (for count accuracy)
        await fetchRSVPData()
      } catch (err) {
        console.error("💥 Exception toggling RSVP:", err)
        alert("Failed to update RSVP. Please try again.")
        // Re-fetch to sync state
        await fetchRSVPData()
      }
    },
    [eventId, status, fetchRSVPData]
  )

  return {
    status,
    count,
    loading,
    toggleRSVP,
  }
}
