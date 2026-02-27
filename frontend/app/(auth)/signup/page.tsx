"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    // Check for internet connectivity first
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setError("No internet connection. Please check your network and try again.")
      return
    }

    setLoading(true)

    try {
      console.log("🚀 Starting signup process...")

      const supabase = createClient()

      // 1. Check if Supabase URL is reachable before proceeding
      // This is a quick check to avoid waiting for the full timeout if the project is obviously down
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors'
        })
        clearTimeout(timeoutId)
      } catch (e) {
        console.warn("⚠️ Connectivity check failed, but proceeding anyway...")
      }

      console.log("📤 Calling supabase.auth.signUp with 20s timeout...")

      // Implement a 20-second timeout for the network call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Your Supabase project might be paused or there's a significant network delay. Please check the Supabase dashboard.")), 20000)
      )

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile/create`,
        },
      })

      // Race the signup promise against the timeout
      const raceResult = await Promise.race([signUpPromise, timeoutPromise]) as any
      const { error: signUpError, data } = raceResult

      console.log("📥 Signup response received")

      if (signUpError && signUpError.message?.includes("Database error")) {
        console.warn("⚠️ Database error detected, checking if user was created anyway...")
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: { user: existingUser } } = await supabase.auth.getUser()

        if (existingUser) {
          console.log("✅ User created despite error, creating profile manually...")
          const userMetadata = existingUser.user_metadata || {}
          await supabase.from("profiles").upsert({
            id: existingUser.id,
            email: existingUser.email || email,
            first_name: userMetadata.first_name || firstName,
            last_name: userMetadata.last_name || lastName,
            full_name: userMetadata.full_name || `${firstName} ${lastName}`.trim(),
            is_profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          router.push("/profile/create")
          return
        }
        setError("Database error during signup. Please try again later.")
        return;
      } else if (signUpError) {
        setError(signUpError.message || "Failed to create account. Please check your credentials.")
        return;
      }

      // Create initial profile row if user was created successfully
      if (data?.user) {
        console.log("📝 Creating initial profile row...")
        const userMetadata = data.user.user_metadata || {}
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            email: data.user.email || email,
            first_name: userMetadata.first_name || firstName,
            last_name: userMetadata.last_name || lastName,
            is_profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error("⚠️ Profile creation error (non-critical):", profileError)
        }
      }

      console.log("✅ Signup Success!")
      router.push("/profile/create")
      router.refresh()
    } catch (err: any) {
      console.error("💥 Signup Exception:", err)

      const isTimeout = err.message?.includes("timed out")
      const isNetworkError = err.message?.includes("Failed to fetch") || err.name === "TypeError"

      let friendlyMessage = err.message || "An unexpected error occurred."

      if (isTimeout || isNetworkError) {
        friendlyMessage = "Connection failed. Please ensure your Supabase project is active and you have a stable internet connection."
      }

      setError(friendlyMessage)

      // Only attempt signOut if it's NOT a clear network timeout (to avoid hanging)
      if (!isTimeout && !isNetworkError) {
        try {
          const supabase = createClient()
          await supabase.auth.signOut()
        } catch (signOutErr) {
          console.error("Failed to clear session:", signOutErr)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/20 p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
