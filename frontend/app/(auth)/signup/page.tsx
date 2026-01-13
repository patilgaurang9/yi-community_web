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

    setLoading(true)

    try {
      console.log("🚀 Starting signup process...")
      console.log("Email:", email)
      
      const supabase = createClient()
      
      // Debug: Check if env vars are loaded
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      console.log("Environment Check:")
      console.log("  URL:", url ? `✅ Set (${url.substring(0, 30)}...)` : "❌ Missing")
      console.log("  Key:", key ? `✅ Set (${key.substring(0, 20)}...)` : "❌ Missing")
      
      console.log("📤 Calling supabase.auth.signUp...")
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile/create`,
        },
      })

      console.log("📥 Signup response received")
      console.log("  Error:", signUpError)
      console.log("  Data:", data)
      console.log("  User Created:", data.user ? "Yes" : "No")

      // Check if user was created despite the error (sometimes happens with DB triggers)
      if (signUpError && signUpError.message?.includes("Database error")) {
        console.warn("⚠️ Database error detected, checking if user was created anyway...")
        
        // Wait a moment for DB operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if user exists
        const { data: { user: existingUser } } = await supabase.auth.getUser()
        
        if (existingUser) {
          console.log("✅ User was created despite error! User ID:", existingUser.id)
          
          // Create profile manually
          console.log("📝 Creating profile row manually...")
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: existingUser.id,
              email: existingUser.email || email,
              full_name: existingUser.user_metadata?.full_name || email.split("@")[0],
              is_profile_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (profileError) {
            console.error("⚠️ Profile creation error:", profileError)
            setError("Account created but profile setup failed. Please try logging in and completing your profile.")
          } else {
            console.log("✅ Profile created successfully")
            // Redirect to profile creation after signup
            router.push("/profile/create")
            router.refresh()
            return
          }
        } else {
          // User wasn't created, show the error
          console.error("❌ Signup Error Details:")
          console.error("  Code:", signUpError.status || signUpError.code)
          console.error("  Message:", signUpError.message)
          console.error("  Full Error:", JSON.stringify(signUpError, null, 2))
          
          setError(
            "Database error during signup. " +
            "This might be due to a database trigger issue. " +
            "Please contact support or try again later."
          )
          setLoading(false)
          return
        }
      } else if (signUpError) {
        console.error("❌ Signup Error Details:")
        console.error("  Code:", signUpError.status || signUpError.code)
        console.error("  Message:", signUpError.message)
        console.error("  Full Error:", JSON.stringify(signUpError, null, 2))
        
        setError(signUpError.message || "Failed to create account. Please check your credentials.")
        setLoading(false)
        return
      }

      console.log("✅ Signup Success!")
      console.log("  User:", data.user?.id)
      console.log("  Session:", data.session ? "Created" : "Not created")

      // Create initial profile row if user was created
      if (data.user) {
        console.log("📝 Creating initial profile row...")
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split("@")[0],
            is_profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error("⚠️ Profile creation error (non-critical):", profileError)
          // Don't block signup if profile creation fails - user can complete it later
        } else {
          console.log("✅ Initial profile created")
        }
      }

      // Redirect to profile creation after signup
      // The ProfileGuard will handle redirecting to dashboard after profile is complete
      router.push("/profile/create")
      router.refresh()
    } catch (err: any) {
      console.error("💥 Signup Exception:")
      console.error("  Type:", err?.constructor?.name)
      console.error("  Message:", err?.message)
      console.error("  Stack:", err?.stack)
      console.error("  Full Error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
      
      const errorMessage = err?.message || "An unexpected error occurred. Please check the console for details."
      setError(errorMessage)
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
