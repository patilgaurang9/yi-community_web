"use client"

import { useState, useRef } from "react"
import { Camera, X, ChevronLeft, ChevronRight, Upload, Loader2, ImagePlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"

interface EventPhoto {
    photo_url: string
    caption?: string | null
}

interface EventGalleryControlsProps {
    eventId: string
    initialPhotos: EventPhoto[]
    canUpload: boolean
}

export function EventGalleryControls({ eventId, initialPhotos, canUpload }: EventGalleryControlsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % initialPhotos.length)
    }

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + initialPhotos.length) % initialPhotos.length)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split(".").pop()
            const fileName = `${eventId}/${Date.now()}.${fileExt}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from("event-galleries")
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("event-galleries")
                .getPublicUrl(fileName)

            // 3. Insert into DB
            const { error: dbError } = await supabase
                .from("event_photos")
                .insert({
                    event_id: eventId,
                    photo_url: publicUrl,
                })

            if (dbError) throw dbError

            toast.success("Photo uploaded successfully!")
            router.refresh()
        } catch (error: any) {
            console.error("Upload failed:", error)
            toast.error(error.message || "Failed to upload photo")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    if (initialPhotos.length === 0 && !canUpload) return null

    return (
        <>
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                {/* View Gallery Button */}
                {initialPhotos.length > 0 && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105 border border-white/10 shadow-lg group"
                    >
                        <Camera className="w-4 h-4 group-hover:text-[#FF9933] transition-colors" />
                        <span className="text-sm font-medium">{initialPhotos.length} Photos</span>
                    </button>
                )}

                {/* Upload Button (Admin Only) */}
                {canUpload && (
                    <>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105 border border-emerald-400/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ImagePlus className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">Add Photos</span>
                        </button>
                    </>
                )}
            </div>

            {/* Lightbox Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
                    {/* Top Bar */}
                    <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                        <div className="text-white/80 text-sm font-medium">
                            {currentIndex + 1} / {initialPhotos.length}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 flex items-center justify-center relative w-full h-full p-4 md:p-10">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={initialPhotos[currentIndex].photo_url}
                                alt={initialPhotos[currentIndex].caption || `Photo ${currentIndex + 1}`}
                                className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                            />
                        </div>

                        {/* Navigation Arrows */}
                        {initialPhotos.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Caption / Bottom Bar */}
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center">
                        {initialPhotos[currentIndex].caption && (
                            <p className="text-white/90 text-sm md:text-base font-medium max-w-2xl mx-auto">
                                {initialPhotos[currentIndex].caption}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
