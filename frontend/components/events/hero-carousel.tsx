"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { BuzzImage } from "@/components/buzz/buzz-image"

interface FeaturedEvent {
  id: string
  title: string | null
  start_time: string
  location_name: string | null
  description: string | null
  image_url: string | null
  image?: string | null
  cover_image?: string | null
  verticals: string[] | null
}

interface HeroCarouselProps {
  events: FeaturedEvent[]
}

export function HeroCarousel({ events }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Guard clause: Check if events exist and have length
  if (!events || events.length === 0) {
    console.log("⚠️ Hero Carousel: No events provided")
    return null
  }

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused || events.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, events.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length)
  }

  // Fix: Get current event without fallback object
  const currentEvent = events[currentIndex]
  
  // Guard clause: Check if currentEvent exists
  if (!currentEvent) {
    console.log("⚠️ Hero Carousel: currentEvent is undefined at index", currentIndex)
    return null
  }
  
  // Property check with fallbacks
  const imageUrl = currentEvent.image_url || currentEvent.image || currentEvent.cover_image || 'https://placehold.co/1200x600/18181b/ffffff?text=No+Image'
  const primaryVertical = currentEvent.verticals?.[0] || "Yi Event"

  // Critical debug logging (only if currentEvent exists)
  console.log("HERO DEBUG:", {
    title: currentEvent.title,
    url: currentEvent.image_url,
    image: currentEvent.image,
    cover_image: currentEvent.cover_image,
    finalImageUrl: imageUrl,
    eventId: currentEvent.id,
    verticals: currentEvent.verticals
  })

  return (
    <div
      className="group relative h-[600px] w-full overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Single Background Image - z-0 (background layer) */}
      <BuzzImage
        src={imageUrl}
        alt={currentEvent.title || "Featured Event"}
        className="absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-500"
        fallbackSrc="https://placehold.co/1200x600/18181b/ffffff?text=Image+Failed"
      />

      {/* Gradient Overlay for Text Readability - z-10 */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Content Overlay - z-10 (same as gradient, but flex container) */}
      <div className="absolute inset-0 z-10 flex h-full flex-col justify-end p-8 text-white">
        <div className="max-w-3xl">
          <Badge className="mb-4 bg-[#FF9933] text-white">
            Featured Event
          </Badge>
          {/* Vertical Badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              {primaryVertical} Vertical
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">
            {currentEvent.title || "Featured Event"}
          </h2>
          <div className="mb-4 flex flex-wrap items-center gap-6 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentEvent.start_time
                ? new Date(currentEvent.start_time).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date TBD"}
            </div>
            {currentEvent.location_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {currentEvent.location_name}
              </div>
            )}
          </div>
          {currentEvent.description && (
            <p className="mb-6 text-sm text-white/90 sm:text-base">
              {currentEvent.description}
            </p>
          )}
          <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90" asChild>
            <Link href={`/events/${currentEvent.id}`}>
              Learn More
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Arrows - z-20 */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dot Indicators - z-20 */}
      {events.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-[#FF9933]"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
