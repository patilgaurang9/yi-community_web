"use client"

import { ProfileForm } from "@/components/auth/profile-form"


export default function CreateProfilePage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] w-full items-start justify-start p-0 md:items-center md:justify-center md:px-4 md:py-8">
      <div className="flex w-full flex-col md:h-[700px] md:max-w-4xl md:bg-card md:rounded-xl md:border md:shadow-sm md:overflow-hidden">
        <ProfileForm />
      </div>
    </div>
  )
}
