import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Welcome
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Your journey begins here. Join us and experience something extraordinary.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login">
            <Button variant="outline" size="lg">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="default" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
