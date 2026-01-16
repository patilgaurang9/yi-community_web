"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Loader2 } from "lucide-react"

interface Attendee {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
  company: string | null
}

interface AttendeesListProps {
  eventId: string
  attendeeCount: number
}

export function AttendeesList({ eventId, attendeeCount }: AttendeesListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttendees = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("event_rsvps")
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            job_title,
            company
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "going")

      if (error) {
        console.error("Error fetching attendees:", error)
        return
      }

      interface RsvpItem {
        profiles: Attendee | null
      }

      // Transform data to flatten profiles
      const transformedAttendees = data
        ?.map((item: RsvpItem) => item.profiles)
        .filter((profile): profile is Attendee => profile !== null) || []

      setAttendees(transformedAttendees)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && attendees.length === 0) {
      fetchAttendees()
    }
  }, [isOpen, attendees.length, eventId])

  const getInitials = (name: string | null) => {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (attendeeCount === 0) return null

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full border-zinc-800 hover:bg-zinc-900 hover:border-[#FF9933]/50"
      >
        <Users className="mr-2 h-4 w-4" />
        View Attendees ({attendeeCount})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Attendees ({attendeeCount})
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF9933]" />
              </div>
            ) : attendees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendees yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={attendee.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933]">
                        {getInitials(attendee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {attendee.full_name || "Unknown Member"}
                      </p>
                      {(attendee.job_title || attendee.company) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {attendee.job_title}
                          {attendee.job_title && attendee.company && " @ "}
                          {attendee.company}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
