"use client"

import { useState, useEffect } from "react"
import { ListFilter, X, Search, Check, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useMemberFilters } from "@/hooks/useMemberFilters"
import type { MemberFiltersState } from "@/types/members"

interface MemberFiltersProps {
  filters: MemberFiltersState
  setFilters: (filters: MemberFiltersState) => void
}

export function MemberFilters({
  filters,
  setFilters,
}: MemberFiltersProps) {
  const [open, setOpen] = useState(false)
  const {
    verticals: availableVerticals = [],
    positions: availablePositions = [],
    industries: availableIndustries = [],
    businessTags: availableSkills = [],
    hobbyTags: availableHobbies = [],
  } = useMemberFilters()

  // Search states for dynamic filters
  const [industrySearch, setIndustrySearch] = useState("")
  const [skillSearch, setSkillSearch] = useState("")
  const [hobbySearch, setHobbySearch] = useState("")

  // Safety: Ensure arrays are never undefined
  const safeVerticals = filters.verticals || []
  const safePositions = filters.positions || []
  const safeIndustries = filters.industries || []
  const safeSkills = filters.skills || []
  const safeHobbies = filters.hobbies || []

  // Static Verticals List
  const STATIC_VERTICALS = [
    "YUVA",
    "THALIR",
    "RURAL INITIATIVES",
    "MASOOM",
    "ROAD SAFETY",
    "HEALTH",
    "ACCESSIBILITY",
    "CLIMATE CHANGE",
    "ENTREPRENEURSHIP",
    "INNOVATION",
  ]

  // Priority Skills to Ensure
  const PRIORITY_SKILLS = ["Learning", "Branding", "Innovation"]

  // Merge priority skills with available skills, deduplicating
  const displaySkills = Array.from(new Set([...PRIORITY_SKILLS, ...availableSkills]))

  const handleVerticalToggle = (vertical: string) => {
    const newVerticals = safeVerticals.includes(vertical)
      ? safeVerticals.filter((v) => v !== vertical)
      : [...safeVerticals, vertical]
    setFilters({ ...filters, verticals: newVerticals })
  }

  const handlePositionToggle = (position: string) => {
    const newPositions = safePositions.includes(position)
      ? safePositions.filter((p) => p !== position)
      : [...safePositions, position]
    setFilters({ ...filters, positions: newPositions })
  }

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = safeIndustries.includes(industry)
      ? safeIndustries.filter((i) => i !== industry)
      : [...safeIndustries, industry]
    setFilters({ ...filters, industries: newIndustries })
    setIndustrySearch("")
  }

  const handleSkillToggle = (skill: string) => {
    const newSkills = safeSkills.includes(skill)
      ? safeSkills.filter((s) => s !== skill)
      : [...safeSkills, skill]
    setFilters({ ...filters, skills: newSkills })
    setSkillSearch("")
  }

  const handleHobbyToggle = (hobby: string) => {
    const newHobbies = safeHobbies.includes(hobby)
      ? safeHobbies.filter((h) => h !== hobby)
      : [...safeHobbies, hobby]
    setFilters({ ...filters, hobbies: newHobbies })
    setHobbySearch("")
  }

  const handleClear = () => {
    setFilters({
      ...filters,
      verticals: [],
      positions: [],
      industries: [],
      skills: [],
      hobbies: [],
    })
  }

  const hasActiveFilters =
    safeVerticals.length > 0 ||
    safePositions.length > 0 ||
    safeIndustries.length > 0 ||
    safeSkills.length > 0 ||
    safeHobbies.length > 0

  // Responsive Check for Sheet Side
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.matchMedia("(min-width: 768px)").matches)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Filter options by search (with safety checks)
  const filteredIndustries = (availableIndustries || []).filter((ind) =>
    ind?.toLowerCase().includes(industrySearch.toLowerCase())
  )

  const filteredSkills = (displaySkills || []).filter((skill) =>
    skill?.toLowerCase().includes(skillSearch.toLowerCase())
  )

  const filteredHobbies = (availableHobbies || []).filter((hobby) =>
    hobby?.toLowerCase().includes(hobbySearch.toLowerCase())
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={`h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 whitespace-nowrap ${hasActiveFilters ? "border-[#FF9933] bg-[#FF9933]/10" : ""
            }`}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF9933] text-xs font-semibold text-white">
              {safeVerticals.length +
                safePositions.length +
                safeIndustries.length +
                safeSkills.length +
                safeHobbies.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full max-w-md h-full border-l border-zinc-800 bg-zinc-900 p-0"
            : "w-full h-[80vh] rounded-t-[20px] border-t border-zinc-800 bg-zinc-900 p-0 focus:outline-none"
        }
      >
        <div className="flex flex-col h-full">
          {/* Mobile Drag Handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-zinc-700/50 sm:hidden flex-none" />

          {/* Fixed Header */}
          <SheetHeader className="px-6 pt-2 pb-4 border-b border-zinc-800 text-left sm:pt-6">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-400" />
                Filter Members
              </SheetTitle>
            </div>
            <SheetDescription className="text-zinc-400">
              Refine the directory by vertical, industry, or interests.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
            <div className="space-y-6">
              {/* Section 1: Yi Verticals (Static List) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Yi Verticals</Label>
                <div className="flex flex-wrap gap-2">
                  {STATIC_VERTICALS.map((vertical) => {
                    const isSelected = safeVerticals.includes(vertical)
                    return (
                      <button
                        key={vertical}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleVerticalToggle(vertical)
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${isSelected
                          ? "bg-[#3B82F6] text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          }`}
                      >
                        {vertical}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: Position (Fixed - Rounded Pills) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Position</Label>
                <div className="flex flex-wrap gap-2">
                  {(availablePositions || []).map((position) => {
                    const isSelected = safePositions.includes(position)
                    return (
                      <button
                        key={position}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePositionToggle(position)
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${isSelected
                          ? "bg-[#3B82F6] text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          }`}
                      >
                        {position}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Industry (Dynamic - Chip Cloud) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Industry</Label>
                <div className="space-y-3">
                  {/* Selected Badges Summary */}
                  {safeIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeIndustries.map((industry) => (
                        <Badge
                          key={industry}
                          className="bg-[#3B82F6] text-white px-2 py-1 text-xs flex items-center gap-1 rounded-full border-none"
                        >
                          {industry}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleIndustryToggle(industry)
                            }}
                            className="ml-1 hover:text-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Search industries..."
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500 rounded-lg focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                  {/* Chip Cloud Container */}
                  <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-lg p-3 bg-zinc-900/50">
                    {filteredIndustries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredIndustries.map((industry) => {
                          const isSelected = safeIndustries.includes(industry)
                          return (
                            <button
                              key={industry}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                handleIndustryToggle(industry)
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isSelected
                                ? "bg-[#3B82F6] text-white shadow-md transform scale-105"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                }`}
                            >
                              {industry}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        No industries found
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Professional Skills (Dynamic - Chip Cloud) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Professional Skills
                </Label>
                <div className="space-y-3">
                  {/* Selected Badges */}
                  {safeSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeSkills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-[#3B82F6] text-white px-2 py-1 text-xs flex items-center gap-1 rounded-full border-none"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSkillToggle(skill)
                            }}
                            className="ml-1 hover:text-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Search skills..."
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500 rounded-lg focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                  {/* Chip Cloud Container */}
                  <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-lg p-3 bg-zinc-900/50">
                    {filteredSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredSkills.map((skill) => {
                          const isSelected = safeSkills.includes(skill)
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                handleSkillToggle(skill)
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isSelected
                                ? "bg-[#3B82F6] text-white shadow-md transform scale-105"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                }`}
                            >
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        No skills found
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Hobbies (Dynamic - Chip Cloud) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Interests</Label>
                <div className="space-y-3">
                  {/* Selected Badges */}
                  {safeHobbies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeHobbies.map((hobby) => (
                        <Badge
                          key={hobby}
                          className="bg-[#3B82F6] text-white px-2 py-1 text-xs flex items-center gap-1 rounded-full border-none"
                        >
                          {hobby}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleHobbyToggle(hobby)
                            }}
                            className="ml-1 hover:text-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Search interests..."
                      value={hobbySearch}
                      onChange={(e) => setHobbySearch(e.target.value)}
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500 rounded-lg focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                  {/* Chip Cloud Container */}
                  <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-lg p-3 bg-zinc-900/50">
                    {filteredHobbies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredHobbies.map((hobby) => {
                          const isSelected = safeHobbies.includes(hobby)
                          return (
                            <button
                              key={hobby}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                handleHobbyToggle(hobby)
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isSelected
                                ? "bg-[#3B82F6] text-white shadow-md transform scale-105"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                }`}
                            >
                              {hobby}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        No interests found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex-none p-6 border-t border-zinc-800 bg-zinc-900 mt-auto pb-8 sm:pb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm uppercase tracking-wide"
                onClick={handleClear}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 h-11 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm uppercase tracking-wide shadow-lg shadow-blue-500/20"
                onClick={() => setOpen(false)}
              >
                Show Results
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
