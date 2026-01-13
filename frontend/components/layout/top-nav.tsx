"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, User, Edit, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fullName = profile?.full_name || user.email?.split("@")[0] || "User"
  const firstName = fullName.split(" ")[0]
  const avatarUrl = profile?.avatar_url || null
  const initials = firstName.charAt(0).toUpperCase()

  const navLinks = [
    { href: "/dashboard", label: "Events" },
    { href: "/members", label: "Members" },
    { href: "/buzz", label: "Buzz" },
    { href: "/birthdays", label: "Birthdays" },
    { href: "/benefits", label: "Benefits" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#FF9933] text-2xl font-extrabold text-white">
              Yi
            </div>
            <span className="hidden text-3xl font-extrabold tracking-tight text-foreground sm:block">
              Young Indians
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium transition-colors hover:text-[#FF9933] ${
                  isActive(link.href)
                    ? "text-[#FF9933]"
                    : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Desktop User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden h-auto gap-3 px-2 py-1.5 md:flex"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={avatarUrl || undefined} alt={firstName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-base font-semibold">{firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/complete-profile"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <DropdownMenuItem asChild>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6">
                  {/* Mobile User Info */}
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || undefined} alt={firstName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{firstName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-[#FF9933]/10 text-[#FF9933]"
                            : "text-foreground/70 hover:bg-accent"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile User Actions */}
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/complete-profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Link>
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </form>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
