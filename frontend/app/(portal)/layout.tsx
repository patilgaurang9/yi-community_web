import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileGuard } from "@/components/auth/profile-guard"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if profile is complete (for TopNav display)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_profile_complete")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        user={{ id: user.id, email: user.email }}
        profile={profile}
      />
      <main className="w-full px-6 pt-2 pb-24 md:px-8 md:pb-8">
        <ProfileGuard>{children}</ProfileGuard>
      </main>
      <BottomNav />
    </div>
  )
}
