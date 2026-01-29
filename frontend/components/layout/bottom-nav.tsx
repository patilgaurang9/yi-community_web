"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Cake, Gem, MessageSquareText } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    // Hide bottom nav on profile creation/setup pages
    if (pathname.startsWith("/profile/create") || pathname.startsWith("/complete-profile")) {
        return null
    }

    const navItems = [
        {
            label: "Events",
            icon: Calendar,
            href: "/dashboard",
        },
        {
            label: "Members",
            icon: Users,
            href: "/members",
        },
        {
            label: "Birthdays",
            icon: Cake,
            href: "/birthdays",
        },
        {
            label: "Privilege",
            icon: Gem,
            href: "/benefits",
        },
        {
            label: "Buzz",
            icon: MessageSquareText,
            href: "/buzz",
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md pb-safe md:hidden px-12 justify-between">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[56px] h-full transition-colors duration-200",
                                isActive ? "text-[#FF9933]" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "stroke-[#FF9933]")} strokeWidth={1.5} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
