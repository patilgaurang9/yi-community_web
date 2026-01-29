"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { User, Edit, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(portal)/actions"

interface TopNavProps {
  user: {
    id: string
    email?: string | null
  }
  profile: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

export function TopNav({ user, profile }: TopNavProps) {
  const pathname = usePathname()

  const fullName = profile?.full_name || user.email?.split("@")[0] || "User"
  const firstName = fullName.split(" ")[0]
  const avatarUrl = profile?.avatar_url || null
  const initials = firstName.charAt(0).toUpperCase()

  const navLinks = [
    { href: "/dashboard", label: "Events" },
    { href: "/members", label: "Members" },
    { href: "/buzz", label: "Buzz" },
    { href: "/birthdays", label: "Birthdays" },
    { href: "/benefits", label: "Privilege" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="w-full px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 ml-8">
            <Image
              src="/Yi logo.png"
              alt="Young Indians Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-semibold transition-colors hover:text-[#FF9933] ${isActive(link.href)
                  ? "text-[#FF9933]"
                  : "text-white"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Unified User Profile (Visible on Mobile & Desktop) */}
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-sm font-semibold text-white hidden md:block">
              {firstName}
            </span>
            <span className="text-sm font-semibold text-white md:hidden">
              {firstName}
            </span>
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={avatarUrl || undefined} alt={firstName} />
              <AvatarFallback className="bg-[#FF9933] text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </nav>
  )
}
