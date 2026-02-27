import { MOUDirectory } from "@/components/mou/mou-directory"

export const metadata = {
    title: "Memorandums of Understanding | Young Indians",
    description: "Official partnerships and agreements with schools, colleges, and organizations.",
}

export default function MOUPage() {
    return (
        <div className="container max-w-7xl py-6 md:py-10 px-4 md:px-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Memorandums of Understanding
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Explore our official partnerships and agreements with leading institutions and organizations.
                </p>
            </div>

            <MOUDirectory />
        </div>
    )
}
