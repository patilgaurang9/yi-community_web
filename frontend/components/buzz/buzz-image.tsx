"use client"

import Image from "next/image"

interface BuzzImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

export function BuzzImage({ src, alt, className }: BuzzImageProps) {
  // Simply render the image without error handling to avoid serialization issues
  // Browser will handle broken images naturally
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={800}
      height={400}
      unoptimized
    />
  )
}
