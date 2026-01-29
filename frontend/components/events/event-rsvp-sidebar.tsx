"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart } from "lucide-react"
import { useRSVP } from "@/hooks/useRSVP"
import { AttendeesList } from "@/components/events/attendees-list"

interface EventRSVPSidebarProps {
    eventId: string
}

export function EventRSVPSidebar({ eventId }: EventRSVPSidebarProps) {
    const { status, count, toggleRSVP, loading } = useRSVP(eventId)

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">RSVP</h3>

                {/* Attendee Count */}
                {count > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-[#138808]" />
                        <span>
                            {count} {count === 1 ? "person is" : "people are"} going
                        </span>
                    </div>
                )}

                {/* RSVP Now Button */}
                <Button
                    onClick={() => toggleRSVP("going")}
                    disabled={loading}
                    className={`w-full ${status === "going"
                            ? "bg-[#138808] hover:bg-[#138808]/90 text-white"
                            : "bg-[#138808] hover:bg-[#138808]/90 text-white"
                        }`}
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {status === "going" ? "RSVP Confirmed" : "RSVP Now"}
                </Button>

                {/* Interested Button */}
                <Button
                    onClick={() => toggleRSVP("interested")}
                    disabled={loading}
                    variant={status === "interested" ? "default" : "outline"}
                    className={`w-full ${status === "interested"
                            ? "bg-[#FF9933] hover:bg-[#FF9933]/90 text-white border-[#FF9933]"
                            : "border-border hover:bg-muted"
                        }`}
                >
                    <Heart className="mr-2 h-4 w-4" />
                    {status === "interested" ? "Interested ✓" : "Interested"}
                </Button>

                {/* View Attendees Button */}
                <AttendeesList eventId={eventId} attendeeCount={count} />

                {loading && (
                    <p className="text-xs text-muted-foreground text-center">Updating...</p>
                )}
            </CardContent>
        </Card>
    )
}
