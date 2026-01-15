"use client"

import { useState } from "react"
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

  // Filter options by search (with safety checks)
  const filteredIndustries = (availableIndustries || []).filter((ind) =>
    ind?.toLowerCase().includes(industrySearch.toLowerCase())
  )

  const filteredSkills = (availableSkills || []).filter((skill) =>
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
          className={`h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 whitespace-nowrap ${
            hasActiveFilters ? "border-[#FF9933] bg-[#FF9933]/10" : ""
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
        side="right"
        className="w-full sm:max-w-md bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-zinc-800 text-left">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-400" />
                Filter Members
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-3 text-zinc-400 hover:text-white"
              >
                Clear All
              </Button>
            </div>
            <SheetDescription className="text-zinc-400">
              Refine the directory by vertical, industry, or interests.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 h-[calc(100vh-120px)]">
            <div className="space-y-6">
              {/* Section 1: Yi Verticals (Fixed - Rounded Pills) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Yi Verticals</Label>
                <div className="flex flex-wrap gap-2">
                  {(availableVerticals || []).map((vertical) => {
                    const isSelected = safeVerticals.includes(vertical)
                    return (
                      <button
                        key={vertical}
                        onClick={() => handleVerticalToggle(vertical)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-white text-black"
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
                        onClick={() => handlePositionToggle(position)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {position}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Industry (Dynamic - Multi-Select Combobox) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Industry</Label>
                <div className="space-y-2">
                  {/* Selected Badges */}
                  {safeIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeIndustries.map((industry) => (
                        <Badge
                          key={industry}
                          className="bg-zinc-800 text-white px-2 py-1 text-xs flex items-center gap-1 rounded-md"
                        >
                          {industry}
                          <button
                            onClick={() => handleIndustryToggle(industry)}
                            className="ml-1 hover:text-zinc-400"
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
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  {/* Suggestions List */}
                  {(industrySearch || safeIndustries.length === 0) && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-800 rounded-md p-2">
                      {filteredIndustries.length > 0 ? (
                        filteredIndustries.map((industry) => {
                          const isSelected = safeIndustries.includes(industry)
                          return (
                            <button
                              key={industry}
                              onClick={() => handleIndustryToggle(industry)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? "bg-white text-black"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              }`}
                            >
                              {isSelected && <Check className="h-4 w-4" />}
                              <span>{industry}</span>
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-zinc-500 px-3 py-2">
                          No industries found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Professional Skills (Dynamic - Multi-Select Combobox) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Professional Skills
                </Label>
                <div className="space-y-2">
                  {/* Selected Badges */}
                  {safeSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeSkills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-zinc-800 text-white px-2 py-1 text-xs flex items-center gap-1 rounded-md"
                        >
                          {skill}
                          <button
                            onClick={() => handleSkillToggle(skill)}
                            className="ml-1 hover:text-zinc-400"
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
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  {/* Suggestions List */}
                  {(skillSearch || safeSkills.length === 0) && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-800 rounded-md p-2">
                      {filteredSkills.length > 0 ? (
                        filteredSkills.map((skill) => {
                          const isSelected = safeSkills.includes(skill)
                          return (
                            <button
                              key={skill}
                              onClick={() => handleSkillToggle(skill)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? "bg-white text-black"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              }`}
                            >
                              {isSelected && <Check className="h-4 w-4" />}
                              <span>{skill}</span>
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-zinc-500 px-3 py-2">
                          No skills found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Hobbies (Dynamic - Multi-Select Combobox) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Interests</Label>
                <div className="space-y-2">
                  {/* Selected Badges */}
                  {safeHobbies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {safeHobbies.map((hobby) => (
                        <Badge
                          key={hobby}
                          className="bg-zinc-800 text-white px-2 py-1 text-xs flex items-center gap-1 rounded-md"
                        >
                          {hobby}
                          <button
                            onClick={() => handleHobbyToggle(hobby)}
                            className="ml-1 hover:text-zinc-400"
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
                      className="h-10 bg-zinc-800 border-zinc-700 pl-9 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  {/* Suggestions List */}
                  {(hobbySearch || safeHobbies.length === 0) && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-800 rounded-md p-2">
                      {filteredHobbies.length > 0 ? (
                        filteredHobbies.map((hobby) => {
                          const isSelected = safeHobbies.includes(hobby)
                          return (
                            <button
                              key={hobby}
                              onClick={() => handleHobbyToggle(hobby)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? "bg-white text-black"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              }`}
                            >
                              {isSelected && <Check className="h-4 w-4" />}
                              <span>{hobby}</span>
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-zinc-500 px-3 py-2">
                          No interests found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
