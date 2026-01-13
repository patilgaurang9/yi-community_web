"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ProfileGuardProps {
  children: React.ReactNode
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const supabase = createClient()

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // If no session, let middleware handle redirect to login
        if (!session) {
          setIsChecking(false)
          return
        }

        // Don't redirect if already on profile creation page (prevent infinite loops)
        if (pathname === "/profile/create" || pathname === "/complete-profile") {
          setIsChecking(false)
          return
        }

        // Fetch user's profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_profile_complete")
          .eq("id", session.user.id)
          .single()

        // If profile doesn't exist or is not complete, redirect to profile creation
        if (!profile || !profile.is_profile_complete) {
          router.push("/profile/create")
          return
        }

        // Profile exists and is complete, render children
        setIsChecking(false)
      } catch (err) {
        console.error("Error checking profile:", err)
        // On error, allow access (fail open) to prevent blocking users
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [router, pathname])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Checking profile...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
