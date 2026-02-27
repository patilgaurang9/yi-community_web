"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ExternalLink, Search, Filter } from "lucide-react"

// Mock Data for MOUs (Expanded for directory)
const MOCK_MOUS = [
    {
        id: "1",
        name: "K.J. Somaiya College",
        category: "COLLEGE",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Mumbai",
    },
    {
        id: "2",
        name: "Tech Solutions Inc.",
        category: "CORPORATE",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Bangalore",
    },
    {
        id: "3",
        name: "City High School",
        category: "SCHOOL",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Delhi",
    },
    {
        id: "4",
        name: "Green Earth NGO",
        category: "NGO",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Pune",
    },
    {
        id: "5",
        name: "Global Innovation Hub",
        category: "CORPORATE",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Hyderabad",
    },
    {
        id: "6",
        name: "National Arts College",
        category: "COLLEGE",
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        location: "Chennai",
    },
]

const CATEGORIES = ["ALL", "COLLEGE", "SCHOOL", "CORPORATE", "NGO"]

export function MOUDirectory() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("ALL")
    const [selectedMOU, setSelectedMOU] = useState<{ name: string; url: string } | null>(null)

    // Filter Logic
    const filteredMOUs = MOCK_MOUS.filter((mou) => {
        const matchesSearch = mou.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mou.location.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "ALL" || mou.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or location..."
                        className="pl-9 bg-background/50 border-border/50 focus-visible:ring-[#FF9933]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {/* Desktop Select / Mobile Scrollable Chips could be better but sticking to Select for consistency with grid */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px] bg-background/50 border-border/50 focus:ring-[#FF9933]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter Category" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat === "ALL" ? "All Categories" : cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Directory Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMOUs.map((mou) => (
                    <Card
                        key={mou.id}
                        className="group cursor-pointer overflow-hidden border-border/50 bg-card/50 transition-all hover:border-[#FF9933]/50 hover:bg-muted/50 hover:shadow-md"
                        onClick={() => setSelectedMOU({ name: mou.name, url: mou.pdf_url })}
                    >
                        <CardContent className="flex flex-col p-5 gap-4 h-full">
                            <div className="flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF9933]/10 text-[#FF9933] group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <Badge variant="premium" className="text-[10px]">
                                    {mou.category}
                                </Badge>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-[#FF9933] transition-colors">
                                    {mou.name}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {mou.location}
                                </p>
                            </div>

                            <div className="mt-auto pt-2 flex items-center text-xs font-medium text-[#FF9933] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                View Document <ExternalLink className="ml-1 h-3 w-3" />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredMOUs.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No MOUs found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filter.</p>
                    </div>
                )}
            </div>

            {/* PDF Viewer Dialog */}
            <Dialog open={!!selectedMOU} onOpenChange={(open) => !open && setSelectedMOU(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
                    <DialogHeader className="p-4 border-b bg-background z-10 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                            <FileText className="h-5 w-5 text-[#FF9933]" />
                            <span className="line-clamp-1">{selectedMOU?.name}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full bg-muted/20 relative">
                        {selectedMOU && (
                            <iframe
                                src={selectedMOU.url}
                                className="w-full h-full border-none"
                                title={`MOU - ${selectedMOU.name}`}
                            />
                        )}
                    </div>
                    <div className="p-3 border-t bg-background flex justify-end">
                        <Button variant="outline" size="sm" asChild className="gap-2 border-[#FF9933]/20 text-[#FF9933] hover:text-[#FF9933] hover:bg-[#FF9933]/10">
                            <a href={selectedMOU?.url} target="_blank" rel="noopener noreferrer">
                                Open in New Tab <ExternalLink className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
