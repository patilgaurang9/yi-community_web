"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, User } from "lucide-react"

// Dummy data for vertical contacts
const verticalContacts = [
  {
    name: "Tech Vertical",
    contact: "Gaurang",
    email: "tech@yi.org",
    phone: "+91 98765 43210",
  },
  {
    name: "Social Vertical",
    contact: "Sarah",
    email: "social@yi.org",
    phone: "+91 98765 43211",
  },
  {
    name: "Membership Vertical",
    contact: "Rajesh",
    email: "membership@yi.org",
    phone: "+91 98765 43212",
  },
  {
    name: "Yuva Vertical",
    contact: "Priya",
    email: "yuva@yi.org",
    phone: "+91 98765 43213",
  },
  {
    name: "Thalir Vertical",
    contact: "Amit",
    email: "thalir@yi.org",
    phone: "+91 98765 43214",
  },
  {
    name: "Rural Initiatives",
    contact: "Kavita",
    email: "rural@yi.org",
    phone: "+91 98765 43215",
  },
  {
    name: "Masoom Vertical",
    contact: "Vikram",
    email: "masoom@yi.org",
    phone: "+91 98765 43216",
  },
  {
    name: "Climate Change",
    contact: "Anjali",
    email: "climate@yi.org",
    phone: "+91 98765 43217",
  },
  {
    name: "Entrepreneurship",
    contact: "Rohit",
    email: "entrepreneurship@yi.org",
    phone: "+91 98765 43218",
  },
  {
    name: "Health Vertical",
    contact: "Neha",
    email: "health@yi.org",
    phone: "+91 98765 43219",
  },
]

export default function HostEventPage() {
  const [formData, setFormData] = useState({
    eventTitle: "",
    proposedDate: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Proposal Sent! We'll get back to you soon.")
    // Reset form
    setFormData({
      eventTitle: "",
      proposedDate: "",
      description: "",
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Host an Event with Yi
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Have an idea for a workshop, trek, or meetup? Reach out to the Vertical Chairs to get started.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Who to Contact */}
        <div>
          <Card className="bg-zinc-900 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground">
                Who to Contact
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Reach out to the Vertical Chairs for your event proposal:
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {verticalContacts.map((vertical, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card hover:border-[#FF9933]/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {vertical.name}
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 text-[#FF9933]" />
                      <span>
                        Contact: <span className="text-foreground font-medium">{vertical.contact}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-[#FF9933]" />
                      <a
                        href={`mailto:${vertical.email}`}
                        className="text-[#FF9933] hover:text-[#FF9933]/80 hover:underline transition-colors"
                      >
                        {vertical.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-[#FF9933]" />
                      <a
                        href={`tel:${vertical.phone}`}
                        className="text-foreground hover:text-[#FF9933] hover:underline transition-colors"
                      >
                        {vertical.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
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
                Fill out the form below and we'll get back to you:
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={formData.eventTitle}
                    onChange={handleChange}
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
                    value={formData.proposedDate}
                    onChange={handleChange}
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
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="bg-card border-border focus:border-[#FF9933] focus:ring-[#FF9933] resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
                >
                  Submit Proposal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
