"use client"

import { useState, useRef } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, ArrowLeft, Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import { submitHostRequest } from "@/app/actions/host-event"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

export default function HostEventPage() {
  const [state, formAction, isPending] = useActionState(submitHostRequest, {})
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("event-covers")
        .getPublicUrl(fileName)

      setCoverPhoto(publicUrl)
      toast.success("Cover photo uploaded!")
    } catch (error: any) {
      toast.error("Failed to upload cover photo: " + error.message)
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (galleryPhotos.length + files.length > 10) {
      toast.error("Maximum 10 photos allowed in gallery.")
      return
    }

    setIsUploadingGallery(true)
    try {
      const newUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("event-galleries")
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from("event-galleries")
          .getPublicUrl(fileName)

        newUrls.push(publicUrl)
      }

      setGalleryPhotos(prev => [...prev, ...newUrls])
      toast.success(`${newUrls.length} photos added to gallery!`)
    } catch (error: any) {
      toast.error("Failed to upload gallery photos: " + error.message)
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    }
  }

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos(prev => prev.filter((_, i) => i !== index))
  }

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
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500/10">
                        <Mail className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Email Us</span>
                        <a href="mailto:events@yikanpur.org" className="text-foreground font-medium hover:text-emerald-500 transition-colors">
                          events@yikanpur.org
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500/10">
                        <Phone className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Call Us</span>
                        <a href="tel:+919876543210" className="text-foreground font-medium hover:text-emerald-500 transition-colors">
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
                  Fill out the details below. Once approved, your event will be live!
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

                    {/* Hidden Inputs for File URLs */}
                    <input type="hidden" name="coverPhotoUrl" value={coverPhoto || ""} />
                    <input type="hidden" name="galleryPhotoUrls" value={JSON.stringify(galleryPhotos)} />

                    {/* Cover Photo Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cover Photo</Label>
                      <div
                        className="border-2 border-dashed border-zinc-700 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors relative min-h-[150px]"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {coverPhoto ? (
                          <div className="relative w-full h-[200px] rounded-md overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {isUploadingCover ? (
                              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                            )}
                            <p className="text-sm text-muted-foreground">Click to upload cover photo</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Single file, max 5MB</p>
                          </>
                        )}
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={isUploadingCover}
                        />
                      </div>
                    </div>

                    {/* Basic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventTitle" className="text-sm font-medium">Event Title</Label>
                        <Input
                          id="eventTitle"
                          name="eventTitle"
                          placeholder="e.g., Tech Workshop"
                          defaultValue={state.fields?.eventTitle}
                          className="bg-card border-border focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                        <Select name="category" defaultValue="Learning">
                          <SelectTrigger className="bg-card border-border focus:ring-emerald-500">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Learning">Learning</SelectItem>
                            <SelectItem value="Social">Social</SelectItem>
                            <SelectItem value="Innovation">Innovation</SelectItem>
                            <SelectItem value="Yuva">Yuva</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Logistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time" className="text-sm font-medium">Start Time</Label>
                        <Input
                          id="start_time"
                          name="start_time"
                          type="datetime-local"
                          min={new Date().toISOString().slice(0, 16)}
                          className="bg-card border-border focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time" className="text-sm font-medium">End Time</Label>
                        <Input
                          id="end_time"
                          name="end_time"
                          type="datetime-local"
                          min={new Date().toISOString().slice(0, 16)}
                          className="bg-card border-border focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locationName" className="text-sm font-medium">Location Name</Label>
                      <Input
                        id="locationName"
                        name="locationName"
                        placeholder="e.g., DoubleTree by Hilton, or 'Online'"
                        className="bg-card border-border focus:border-emerald-500"
                        required
                      />
                    </div>

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
                        pattern="^\+?[1-9]\d{1,14}$"
                        className="bg-card border-border focus:border-emerald-500"
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
                        placeholder="Tell us about your event idea..."
                        defaultValue={state.fields?.description}
                        rows={4}
                        className="bg-card border-border focus:border-emerald-500 resize-none"
                        required
                      />
                    </div>

                    {/* Gallery Photos Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Gallery Photos (Max 10)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {galleryPhotos.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryPhoto(index)}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {galleryPhotos.length < 10 && (
                          <div
                            className="aspect-square border-2 border-dashed border-zinc-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors"
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            {isUploadingGallery ? (
                              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            ) : (
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={handleGalleryUpload}
                        disabled={isUploadingGallery}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
