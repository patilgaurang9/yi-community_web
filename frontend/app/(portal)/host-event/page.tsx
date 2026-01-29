"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, ArrowLeft, Loader2 } from "lucide-react"
import { submitHostRequest } from "@/app/actions/host-event"

export default function HostEventPage() {
  const [state, formAction, isPending] = useActionState(submitHostRequest, {})

  return (
    <div className="max-w-screen-2xl mx-auto px-0 md:px-8 relative min-h-screen pt-0">
      {/* Centered High-Impact Header */}
      <div className="flex items-center w-full px-4 pt-2 relative mb-4">
        <Link
          href="/dashboard"
          className="absolute left-4 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white transition-transform hover:scale-105 active:scale-95 border border-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="w-full text-center text-3xl font-bold text-white">
          Host an Event
        </h1>
      </div>

      <div className="px-6 pb-6 md:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - General Contact */}
          <div>
            <Card className="bg-zinc-900 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Contact Us
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Have questions before proposing? Reach out directly:
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-card/50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#FF9933]/10">
                        <Mail className="h-5 w-5 text-[#FF9933]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Email Us</span>
                        <a href="mailto:events@yikanpur.org" className="text-foreground font-medium hover:text-[#FF9933] transition-colors">
                          events@yikanpur.org
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#FF9933]/10">
                        <Phone className="h-5 w-5 text-[#FF9933]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Call Us</span>
                        <a href="tel:+919876543210" className="text-foreground font-medium hover:text-[#FF9933] transition-colors">
                          +91 98765 43210
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Interest Form */}
          <div>
            <Card className="bg-zinc-900 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Submit Event Proposal
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Fill out the form below and we&apos;ll get back to you:
                </p>
              </CardHeader>
              <CardContent>
                {state.success ? (
                  <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-500">
                    <p className="font-semibold">Success!</p>
                    <p className="text-sm">{state.success}</p>
                    <Button variant="outline" className="mt-4 w-full" onClick={() => window.location.reload()}>Submit Another</Button>
                  </div>
                ) : (
                  <form action={formAction} className="space-y-6">
                    {state.error && (
                      <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{state.error}</p>
                        {state.error.includes("Profile") && (
                          <Link href="/profile" className="text-sm underline mt-2 block hover:text-white">
                            Go to Profile
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Event Title */}
                    <div className="space-y-2">
                      <Label htmlFor="eventTitle" className="text-sm font-medium">
                        Event Title
                      </Label>
                      <Input
                        id="eventTitle"
                        name="eventTitle"
                        type="text"
                        placeholder="e.g., Tech Workshop: Introduction to AI"
                        defaultValue={state.fields?.eventTitle}
                        className="bg-card border-border focus:border-[#FF9933] focus:ring-[#FF9933]"
                        required
                      />
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber" className="text-sm font-medium">
                        Contact Number
                      </Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        placeholder="+91 98765 43210"
                        defaultValue={state.fields?.contactNumber}
                        className="bg-card border-border focus:border-[#FF9933] focus:ring-[#FF9933]"
                        required
                      />
                    </div>

                    {/* Proposed Date */}
                    <div className="space-y-2">
                      <Label htmlFor="proposedDate" className="text-sm font-medium">
                        Proposed Date
                      </Label>
                      <Input
                        id="proposedDate"
                        name="proposedDate"
                        type="date"
                        defaultValue={state.fields?.proposedDate}
                        className="bg-card border-border focus:border-[#FF9933] focus:ring-[#FF9933]"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Event Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Tell us about your event idea, target audience, and any special requirements..."
                        defaultValue={state.fields?.description}
                        rows={6}
                        className="bg-card border-border focus:border-[#FF9933] focus:ring-[#FF9933] resize-none"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Proposal"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
