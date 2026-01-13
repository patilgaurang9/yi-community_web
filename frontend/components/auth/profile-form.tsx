"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { profileSchema, type ProfileFormData, BUSINESS_TAGS, HOBBY_TAGS, YI_VERTICALS, YI_POSITIONS } from "@/lib/schemas/profile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { BuzzImage } from "@/components/buzz/buzz-image"

export function ProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("identity")
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState,
    formState: { errors },
    setValue,
    watch,
    trigger, // For validation before moving to next tab
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_tags: [],
      hobby_tags: [],
      avatar_url: "", // Initialize as empty string
    },
  })

  const businessTags = watch("business_tags") || []
  const hobbyTags = watch("hobby_tags") || []
  const dob = watch("dob")
  const anniversaryDate = watch("anniversary_date")
  const spouseName = watch("spouse_name")
  const avatarUrl = watch("avatar_url")
  
  // Sync preview URL with form value when it changes externally (but not during upload)
  useEffect(() => {
    // Only sync if we're not currently uploading (to avoid overriding local preview)
    if (!uploading) {
      if (avatarUrl) {
        setAvatarPreviewUrl(avatarUrl)
      } else if (!avatarUrl && avatarPreviewUrl) {
        // Clear preview if form value is cleared
        setAvatarPreviewUrl(null)
      }
    }
  }, [avatarUrl, uploading])

  // Tab order for navigation
  const tabs = ["identity", "location", "professional", "social", "tags"]
  const currentTabIndex = tabs.indexOf(currentTab)
  const isLastTab = currentTabIndex === tabs.length - 1

  // Handle Next button click
  const handleNext = async () => {
    // Validate current tab fields before moving
    let fieldsToValidate: (keyof ProfileFormData)[] = []
    
    switch (currentTab) {
      case "identity":
        // Don't validate avatar_url on tab navigation - it's optional
        // last_name is optional, so only validate first_name and phone_number
        fieldsToValidate = ["first_name", "phone_number"]
        break
      case "location":
        fieldsToValidate = ["address_line_1", "city", "state", "country"]
        break
      case "professional":
        fieldsToValidate = ["company", "job_title", "industry"]
        break
      case "social":
        fieldsToValidate = ["linkedin_url", "bio"]
        break
      case "tags":
        fieldsToValidate = ["business_tags", "hobby_tags"]
        break
    }

    const isValid = await trigger(fieldsToValidate)
    
    if (isValid && !isLastTab) {
      setCurrentTab(tabs[currentTabIndex + 1])
      setError(null) // Clear errors when moving to next tab
    }
  }

  // Fetch existing profile data
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Pre-fill email and name from user metadata
      if (user.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(" ")
        setValue("first_name", nameParts[0] || "")
        setValue("last_name", nameParts.slice(1).join(" ") || "")
      }

      // Fetch existing profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        // Pre-fill all fields
        Object.keys(profile).forEach((key) => {
          const value = profile[key as keyof typeof profile]
          if (value !== null && value !== undefined) {
            if (key === "dob" || key === "anniversary_date" || key === "job_start_date") {
              // Handle date strings from database
              try {
                const dateValue = typeof value === "string" ? new Date(value) : value
                if (!isNaN(dateValue.getTime())) {
                  setValue(key as any, dateValue)
                }
              } catch {
                // Skip invalid dates
              }
            } else if (key === "business_tags" || key === "hobby_tags") {
              // Handle array fields - ensure they're clean string arrays
              if (Array.isArray(value)) {
                const cleanArray = value.filter((item) => typeof item === "string" && item.trim() !== "")
                setValue(key as any, cleanArray)
              } else if (value) {
                // If it's not an array but has a value, try to parse it
                try {
                  const parsed = JSON.parse(value as string)
                  if (Array.isArray(parsed)) {
                    const cleanArray = parsed.filter((item: any) => typeof item === "string" && item.trim() !== "")
                    setValue(key as any, cleanArray)
                  }
                } catch {
                  // Skip if can't parse
                }
              }
            } else {
              // Handle other fields - convert empty strings to undefined for optional fields
              if (value === "" && (key.includes("secondary") || key.includes("optional") || key === "address_line_2" || key === "last_name")) {
                setValue(key as any, undefined)
              } else {
                setValue(key as any, value)
                // Set preview URL for avatar if it exists
                if (key === "avatar_url" && value) {
                  setAvatarPreviewUrl(value as string)
                }
              }
            }
          }
        })
      }
    }

    loadProfile()
  }, [router, setValue])

  // Avatar upload handler
  const handleAvatarUpload = async (file: File) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setUploading(true)
    setError(null)
    
    try {
      // Create a local preview URL immediately for instant feedback
      const localPreviewUrl = URL.createObjectURL(file)
      setAvatarPreviewUrl(localPreviewUrl)

      const timestamp = Date.now()
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${timestamp}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        // Clean up local preview on error
        URL.revokeObjectURL(localPreviewUrl)
        setAvatarPreviewUrl(null)
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Add cache-busting parameter to ensure fresh image load
      const publicUrlWithCache = `${publicUrl}?t=${timestamp}`

      // Update form value and preview URL
      setValue("avatar_url", publicUrl, { shouldValidate: true, shouldDirty: true })
      setAvatarPreviewUrl(publicUrlWithCache)
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar")
      setAvatarPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  // Tag handlers
  const toggleBusinessTag = (tag: string) => {
    const current = businessTags
    if (current.includes(tag)) {
      setValue("business_tags", current.filter((t) => t !== tag))
      setError(null) // Clear error when removing tag
    } else {
      if (current.length >= 3) {
        setError("Maximum 3 business tags allowed. Please remove one before adding another.")
        setTimeout(() => setError(null), 3000) // Clear error after 3 seconds
        return
      }
      setValue("business_tags", [...current, tag])
      setError(null) // Clear error when successfully adding tag
    }
  }

  const toggleHobbyTag = (tag: string) => {
    const current = hobbyTags
    if (current.includes(tag)) {
      setValue("hobby_tags", current.filter((t) => t !== tag))
      setError(null) // Clear error when removing tag
    } else {
      if (current.length >= 3) {
        setError("Maximum 3 hobby tags allowed. Please remove one before adding another.")
        setTimeout(() => setError(null), 3000) // Clear error after 3 seconds
        return
      }
      setValue("hobby_tags", [...current, tag])
      setError(null) // Clear error when successfully adding tag
    }
  }

  // Form submission
  const onSubmit = async (values: ProfileFormData) => {
    console.log("✅ Submit clicked - onSubmit fired!")
    console.log("Form values received:", values)
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Step 1: Console log form values (Zod output)
      console.log("Form Values:", values)

      // Step 2: Data transformation
      // Generate full_name from first_name and last_name (last_name is optional)
      const generatedFullName = values.last_name?.trim()
        ? `${values.first_name} ${values.last_name}`.trim()
        : values.first_name.trim()

      // Transform dates to YYYY-MM-DD format
      const dobString = values.dob ? values.dob.toISOString().split("T")[0] : null
      const anniversaryDateString = values.anniversary_date
        ? values.anniversary_date.toISOString().split("T")[0]
        : null

      // Ensure tags are clean arrays of strings (CRITICAL)
      const businessTagsArray: string[] = Array.isArray(values.business_tags)
        ? values.business_tags.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "")
        : []

      const hobbyTagsArray: string[] = Array.isArray(values.hobby_tags)
        ? values.hobby_tags.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "")
        : []

      // Build payload object - MUST include id and email for upsert
      const payload: Record<string, any> = {
        id: user.id, // REQUIRED for upsert
        email: user.email || "", // REQUIRED field
        full_name: generatedFullName, // Auto-generated from first_name and last_name
        first_name: values.first_name,
        last_name: values.last_name?.trim() || null, // Optional - convert empty string to null
        phone_number: values.phone_number,
        address_line_1: values.address_line_1,
        city: values.city,
        state: values.state,
        country: values.country,
        company: values.company,
        job_title: values.job_title,
        industry: values.industry,
        business_tags: businessTagsArray, // Array of strings
        hobby_tags: hobbyTagsArray, // Array of strings
        linkedin_url: values.linkedin_url,
        bio: values.bio,
        avatar_url: values.avatar_url,
        is_profile_complete: true,
        created_at: new Date().toISOString(), // For new users
        updated_at: new Date().toISOString(),
      }

      // Handle nullable optional fields
      payload.dob = dobString
      payload.anniversary_date = anniversaryDateString
      payload.secondary_email = values.secondary_email?.trim() || null
      payload.secondary_phone = values.secondary_phone?.trim() || null
      payload.address_line_2 = values.address_line_2?.trim() || null
      payload.business_bio = values.business_bio?.trim() || null
      payload.yi_vertical = values.yi_vertical?.trim() || null
      payload.yi_position = values.yi_position?.trim() || null
      payload.instagram_url = values.instagram_url?.trim() || null
      payload.twitter_url = values.twitter_url?.trim() || null
      payload.facebook_url = values.facebook_url?.trim() || null
      payload.spouse_name = values.spouse_name?.trim() || null
      // Handle avatar_url - convert empty string to null
      payload.avatar_url = values.avatar_url?.trim() || null

      // Step 3: Console log payload to DB
      console.log("Payload to DB:", payload)
      console.log("User ID:", user.id)
      console.log("Business Tags Type:", Array.isArray(payload.business_tags) ? "Array" : typeof payload.business_tags)
      console.log("Hobby Tags Type:", Array.isArray(payload.hobby_tags) ? "Array" : typeof payload.hobby_tags)
      console.log("DOB Format:", payload.dob)
      console.log("Anniversary Format:", payload.anniversary_date)

      // Step 4: Execute upsert (works for both new and existing users)
      const { error: updateError, data: result } = await supabase
        .from("profiles")
        .upsert(payload, {
          onConflict: "id", // Use id as the conflict resolution key
        })
        .select()

      // Step 5: Error handling with console.error
      if (updateError) {
        console.error("Supabase Error:", updateError)
        console.error("Error Code:", updateError.code)
        console.error("Error Message:", updateError.message)
        console.error("Error Details:", updateError.details)
        console.error("Error Hint:", updateError.hint)
        throw updateError
      }

      console.log("Success! Profile updated:", result)

      // Redirect on success
      router.refresh()
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Supabase Error:", err)
      const errorMessage =
        err?.message || err?.error_description || err?.details || "Failed to update profile"
      setError(errorMessage)
      setLoading(false)
    }
  }

  // Handle form validation errors
  const onError = (errors: any) => {
    console.log("❌ DETAILED ERRORS:", errors)
    console.log("❌ Form State Errors:", formState.errors)
    console.log("❌ Error count:", Object.keys(errors).length)
    console.log("❌ Error details:", JSON.stringify(errors, null, 2))
    
    // Get first error message for user display
    const firstErrorKey = Object.keys(errors)[0]
    const firstError = errors[firstErrorKey]
    const errorMessage = firstError?.message || "Please fix the validation errors before submitting."
    
    setError(`Validation Error: ${errorMessage}`)

    // Scroll to first error
    if (firstErrorKey) {
      const element = document.querySelector(`[name="${firstErrorKey}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex h-full flex-col">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex h-full flex-col">
        {/* Header Section - Fixed at top */}
        <div className="flex-shrink-0 border-b border-border px-6 pt-6 pb-4">
          <div className="mb-4">
            <h2 className="text-3xl font-semibold">Complete Your Profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please fill out your profile information to continue. You can navigate between sections using the tabs below.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 rounded-md bg-destructive/20 p-3 text-sm" style={{ color: "#FF8A80" }}>
              {error}
            </div>
          )}

          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="social">Social & Personal</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>
        </div>

        {/* Body Section - Scrollable, takes remaining space */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
          {/* Identity Tab */}
          <TabsContent value="identity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Your basic information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>Profile Photo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border cursor-pointer">
                    {/* Show preview URL first (immediate feedback), then fall back to form value */}
                    {avatarPreviewUrl || watch("avatar_url") ? (
                      <BuzzImage
                        key={avatarPreviewUrl || watch("avatar_url")} // Force re-render on URL change
                        src={avatarPreviewUrl || watch("avatar_url") || ""}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setError(null) // Clear any previous errors
                          handleAvatarUpload(file)
                        }
                      }}
                      disabled={uploading}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                    {errors.avatar_url && (
                      <p className="text-sm mt-1" style={{ color: "#FF8A80" }}>{errors.avatar_url.message}</p>
                    )}
                    {!avatarPreviewUrl && !watch("avatar_url") && !uploading && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Click the icon to upload a profile photo
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Half-width fields: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register("first_name")}
                    className={cn(errors.first_name && "border-destructive")}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-[#FF8A80]">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name (Optional)</Label>
                  <Input
                    id="last_name"
                    {...register("last_name")}
                    className={cn(errors.last_name && "border-destructive")}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-[#FF8A80]">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Full-width field: Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  {...register("phone_number")}
                  className={cn(errors.phone_number && "border-destructive")}
                />
                {errors.phone_number && (
                  <p className="text-sm text-[#FF8A80]">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Full-width field: Date of Birth */}
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal rounded-lg",
                        !dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-0 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={dob}
                      onSelect={(date) => setValue("dob", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Full-width field: Secondary Email */}
              <div className="space-y-2">
                <Label htmlFor="secondary_email">Secondary Email</Label>
                <Input
                  id="secondary_email"
                  type="email"
                  {...register("secondary_email")}
                  className={cn(errors.secondary_email && "border-destructive")}
                />
                {errors.secondary_email && (
                  <p className="text-sm text-[#FF8A80]">{errors.secondary_email.message}</p>
                )}
              </div>

              {/* Full-width field: Secondary Phone */}
              <div className="space-y-2">
                <Label htmlFor="secondary_phone">Secondary Phone</Label>
                <Input
                  id="secondary_phone"
                  {...register("secondary_phone")}
                  className={cn(errors.secondary_phone && "border-destructive")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Your address information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {/* Full-width field: Address Line 1 */}
              <div className="space-y-2">
                <Label htmlFor="address_line_1">Address Line 1 *</Label>
                <Input
                  id="address_line_1"
                  {...register("address_line_1")}
                  className={cn(errors.address_line_1 && "border-destructive")}
                />
                {errors.address_line_1 && (
                  <p className="text-sm text-[#FF8A80]">{errors.address_line_1.message}</p>
                )}
              </div>

              {/* Full-width field: Address Line 2 */}
              <div className="space-y-2">
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  {...register("address_line_2")}
                />
              </div>

              {/* Three-column grid: City, State, Country */}
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register("city")}
                    className={cn(errors.city && "border-destructive")}
                  />
                  {errors.city && (
                    <p className="text-sm text-[#FF8A80]">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register("state")}
                    className={cn(errors.state && "border-destructive")}
                  />
                  {errors.state && (
                    <p className="text-sm text-[#FF8A80]">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    {...register("country")}
                    className={cn(errors.country && "border-destructive")}
                  />
                  {errors.country && (
                    <p className="text-sm text-[#FF8A80]">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional</CardTitle>
              <CardDescription>Your work and Yi role information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {/* Full-width field: Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  {...register("company")}
                  className={cn(errors.company && "border-destructive")}
                />
                {errors.company && (
                  <p className="text-sm text-[#FF8A80]">{errors.company.message}</p>
                )}
              </div>

              {/* Full-width field: Job Title */}
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  {...register("job_title")}
                  className={cn(errors.job_title && "border-destructive")}
                />
                {errors.job_title && (
                  <p className="text-sm text-[#FF8A80]">{errors.job_title.message}</p>
                )}
              </div>

              {/* Full-width field: Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  className={cn(errors.industry && "border-destructive")}
                />
                {errors.industry && (
                  <p className="text-sm text-[#FF8A80]">{errors.industry.message}</p>
                )}
              </div>

              {/* Full-width field: Business Bio (Textarea) */}
              <div className="space-y-2">
                <Label htmlFor="business_bio">Business Bio</Label>
                <Textarea
                  id="business_bio"
                  {...register("business_bio")}
                  className="focus-visible:ring-[#FF9933]"
                />
              </div>

              {/* Half-width fields: Yi Vertical & Yi Position */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="yi_vertical">Yi Vertical</Label>
                  <Select
                    value={watch("yi_vertical") || ""}
                    onValueChange={(value) => setValue("yi_vertical", value)}
                  >
                    <SelectTrigger id="yi_vertical" className="focus:ring-[#FF9933]">
                      <SelectValue placeholder="Select vertical" />
                    </SelectTrigger>
                    <SelectContent>
                      {YI_VERTICALS.map((vertical) => (
                        <SelectItem key={vertical} value={vertical}>
                          {vertical}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yi_position">Yi Position</Label>
                  <Select
                    value={watch("yi_position") || ""}
                    onValueChange={(value) => setValue("yi_position", value)}
                  >
                    <SelectTrigger id="yi_position" className="focus:ring-[#FF9933]">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {YI_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Social & Personal Tab */}
          <TabsContent value="social" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social & Personal</CardTitle>
              <CardDescription>Your social links and personal information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {/* Full-width field: LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL *</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  {...register("linkedin_url")}
                  className={cn(errors.linkedin_url && "border-destructive")}
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.linkedin_url && (
                  <p className="text-sm text-[#FF8A80]">{errors.linkedin_url.message}</p>
                )}
              </div>

              {/* Full-width field: Instagram URL */}
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  type="url"
                  {...register("instagram_url")}
                  className={cn(errors.instagram_url && "border-destructive")}
                  placeholder="https://instagram.com/username"
                />
                {errors.instagram_url && (
                  <p className="text-sm text-[#FF8A80]">{errors.instagram_url.message}</p>
                )}
              </div>

              {/* Full-width field: Twitter URL */}
              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input
                  id="twitter_url"
                  type="url"
                  {...register("twitter_url")}
                  className={cn(errors.twitter_url && "border-destructive")}
                  placeholder="https://twitter.com/username"
                />
                {errors.twitter_url && (
                  <p className="text-sm text-[#FF8A80]">{errors.twitter_url.message}</p>
                )}
              </div>

              {/* Full-width field: Facebook URL */}
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook URL</Label>
                <Input
                  id="facebook_url"
                  type="url"
                  {...register("facebook_url")}
                  className={cn(errors.facebook_url && "border-destructive")}
                  placeholder="https://facebook.com/username"
                />
                {errors.facebook_url && (
                  <p className="text-sm text-[#FF8A80]">{errors.facebook_url.message}</p>
                )}
              </div>

              {/* Full-width field: Personal Bio (Textarea) */}
              <div className="space-y-2">
                <Label htmlFor="bio">Personal Bio *</Label>
                <Textarea
                  id="bio"
                  {...register("bio")}
                  className={cn("focus-visible:ring-[#FF9933]", errors.bio && "border-destructive")}
                  placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                  <p className="text-sm text-[#FF8A80]">{errors.bio.message}</p>
                )}
              </div>

              {/* Full-width field: Spouse Name */}
              <div className="space-y-2">
                <Label htmlFor="spouse_name">Spouse Name</Label>
                <Input
                  id="spouse_name"
                  {...register("spouse_name")}
                />
              </div>

              {/* Full-width field: Anniversary Date (conditional) */}
              {spouseName && (
                <div className="space-y-2">
                  <Label>Anniversary Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal rounded-lg",
                          !anniversaryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {anniversaryDate ? (
                          format(anniversaryDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-0 shadow-lg">
                      <Calendar
                        mode="single"
                        selected={anniversaryDate}
                        onSelect={(date) => setValue("anniversary_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Select up to 3 tags in each category</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label>Business Tags ({businessTags.length}/3)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BUSINESS_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={businessTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer",
                        businessTags.includes(tag) && "bg-[#FF9933] text-white"
                      )}
                      onClick={() => toggleBusinessTag(tag)}
                    >
                      {tag}
                      {businessTags.includes(tag) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                {businessTags.length >= 3 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Maximum 3 tags selected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Hobby Tags ({hobbyTags.length}/3)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HOBBY_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={hobbyTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer",
                        hobbyTags.includes(tag) && "bg-[#FF9933] text-white"
                      )}
                      onClick={() => toggleHobbyTag(tag)}
                    >
                      {tag}
                      {hobbyTags.includes(tag) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                {hobbyTags.length >= 3 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Maximum 3 tags selected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        </div>

        {/* Footer Section - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {isLastTab ? (
              <Button
                type="submit"
                className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </Tabs>
    </form>
  )
}
