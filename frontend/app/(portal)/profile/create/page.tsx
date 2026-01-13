"use client"

import { ProfileForm } from "@/components/auth/profile-form"
import { Card } from "@/components/ui/card"

export default function CreateProfilePage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-8">
      <Card className="flex h-[700px] w-full max-w-4xl flex-col overflow-hidden">
        <ProfileForm />
      </Card>
    </div>
  )
}
