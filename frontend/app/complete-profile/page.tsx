"use client"

import { ProfileForm } from "@/components/auth/profile-form"

export default function CompleteProfilePage() {
  return (
    <div className="flex min-h-screen items-start justify-center p-0 md:items-center md:p-8">
      <div className="flex w-full flex-col bg-background md:h-[700px] md:max-w-4xl md:bg-card md:rounded-xl md:border md:shadow-sm md:overflow-hidden">
        <ProfileForm />
      </div>
    </div>
  )
}
