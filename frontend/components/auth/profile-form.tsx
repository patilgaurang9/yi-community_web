"use client"

import { Country, State, City } from "@/lib/country-state-city-utils"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { parsePhoneNumber } from "libphonenumber-js"
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
import { PhoneInput } from "@/components/ui/phone-input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { CalendarIcon, Upload, X, User, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { IdentityForm } from "./identity-form"


export function ProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("identity")
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<any>() // Store detected country code from phone number

  const {
    register,
    handleSubmit,
    formState,
    formState: { errors },
    setValue,
    watch,
    trigger, // For validation before moving to next tab
    control, // For controlled components like PhoneInput
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_tags: [],
      hobby_tags: [],
      avatar_url: "", // Initialize as empty string
    },
  })

  const [isMobile, setIsMobile] = useState(false)
  const [dobOpen, setDobOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

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
  }, [avatarUrl, uploading, avatarPreviewUrl])

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
        // Pre-fill all fields with Null Safety
        Object.keys(profile).forEach((key) => {
          const value = profile[key as keyof typeof profile]

          // 1. Handle Dates (DOB, Anniversary)
          if (["dob", "anniversary_date", "job_start_date"].includes(key)) {
            if (typeof value === "string") {
              const dateValue = new Date(value)
              if (!isNaN(dateValue.getTime())) {
                setValue(key as keyof ProfileFormData, dateValue)
              }
            } else if (value instanceof Date) {
              setValue(key as keyof ProfileFormData, value)
            }
          }
          // 2. Handle Arrays (Tags)
          else if (["business_tags", "hobby_tags"].includes(key)) {
            if (Array.isArray(value)) {
              const cleanArray = value.filter((item) => typeof item === "string" && item.trim() !== "")
              setValue(key as keyof ProfileFormData, cleanArray)
            } else if (value) {
              try {
                // Try parsing if stored as string
                const parsed = JSON.parse(value as string)
                if (Array.isArray(parsed)) {
                  const cleanArray = parsed.filter((item: unknown) => typeof item === "string" && item.trim() !== "")
                  setValue(key as keyof ProfileFormData, cleanArray)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
          // 3. Handle Phone Numbers (Ensure E.164 string and extract Country)
          else if (["phone_number", "secondary_phone"].includes(key)) {
            let phoneStr = (value as string) ?? ""

            // Normalize to E.164 format if not already
            if (phoneStr && !phoneStr.startsWith("+")) {
              // Assume Indian number if no country code
              phoneStr = `+91${phoneStr}`
            }

            setValue(key as keyof ProfileFormData, phoneStr)

            // Detect country from primary phone number and set it explicitly
            if (key === "phone_number" && phoneStr) {
              try {
                // Parse phone number if it starts with +
                if (phoneStr.startsWith("+")) {
                  const parsed = parsePhoneNumber(phoneStr)
                  if (parsed && parsed.country) {
                    // Set the country for the PhoneInput component
                    setPhoneCountry(parsed.country)
                  } else {
                    // Fallback to 'IN' if parsing succeeds but no country found
                    setPhoneCountry("IN")
                  }
                } else {
                  // Fallback to 'IN' if no + prefix (shouldn't happen after normalization)
                  setPhoneCountry("IN")
                }
              } catch (e) {
                // Fallback to 'IN' on parsing errors
                setPhoneCountry("IN")
              }
            }
          }
          // 4. Handle Standard Fields (Null Safety)
          else {
            // Skip fields not in schema or special handled ones
            if (key === "id" || key === "email" || key === "created_at" || key === "updated_at") return

            // Apply Null Safety: Use empty string if value is null/undefined
            // This prevents "uncontrolled to controlled" warnings
            const safeValue = value === null || value === undefined ? "" : value
            setValue(key as keyof ProfileFormData, safeValue as any)

            // Handle avatar preview
            if (key === "avatar_url" && typeof value === 'string' && value) {
              setAvatarPreviewUrl(value)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar")
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

  // Creatable tag inputs
  const [businessInput, setBusinessInput] = useState("")
  const [hobbyInput, setHobbyInput] = useState("")
  const businessInputRef = useRef<HTMLInputElement | null>(null)
  const hobbyInputRef = useRef<HTMLInputElement | null>(null)

  const addBusinessTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/g, "")
    if (!tag) return
    // case-insensitive dedupe
    if ((businessTags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      setError("Tag already added")
      setTimeout(() => setError(null), 2000)
      return
    }
    if ((businessTags || []).length >= 3) {
      setError("Maximum 3 business tags allowed. Remove one before adding another.")
      setTimeout(() => setError(null), 3000)
      return
    }
    setValue("business_tags", [...(businessTags || []), tag])
    setBusinessInput("")
    setError(null)
  }

  const addHobbyTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/g, "")
    if (!tag) return
    if ((hobbyTags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      setError("Tag already added")
      setTimeout(() => setError(null), 2000)
      return
    }
    if ((hobbyTags || []).length >= 3) {
      setError("Maximum 3 hobby tags allowed. Remove one before adding another.")
      setTimeout(() => setError(null), 3000)
      return
    }
    setValue("hobby_tags", [...(hobbyTags || []), tag])
    setHobbyInput("")
    setError(null)
  }

  const handleBusinessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addBusinessTag(businessInput)
    }
  }

  const handleHobbyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addHobbyTag(hobbyInput)
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
      const payload = {
        id: user.id, // REQUIRED for upsert
        email: user.email || "", // REQUIRED field
        full_name: generatedFullName, // Auto-generated from first_name and last_name
        phone_number: values.phone_number,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2?.trim() || null,
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
        avatar_url: values.avatar_url?.trim() || null,
        dob: dobString,
        anniversary_date: anniversaryDateString,
        secondary_email: values.secondary_email?.trim() || null,
        secondary_phone: values.secondary_phone?.trim() || null,
        business_bio: values.business_bio?.trim() || null,
        yi_vertical: values.yi_vertical?.trim() || null,
        yi_position: values.yi_position?.trim() || null,
        instagram_url: values.instagram_url?.trim() || null,
        twitter_url: values.twitter_url?.trim() || null,
        facebook_url: values.facebook_url?.trim() || null,
        spouse_name: values.spouse_name?.trim() || null,
        is_profile_complete: true,
        created_at: new Date().toISOString(), // For new users
        updated_at: new Date().toISOString(),
      }

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
    } catch (err) {
      console.error("Supabase Error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile"
      setError(errorMessage)
      setLoading(false)
    }
  }

  // Handle form validation errors
  const onError = (errors: unknown) => {
    console.log("❌ DETAILED ERRORS:", errors)
    console.log("❌ Form State Errors:", formState.errors)

    if (typeof errors === 'object' && errors !== null) {
      console.log("❌ Error count:", Object.keys(errors).length)
      console.log("❌ Error details:", JSON.stringify(errors, null, 2))

      // Get first error message for user display
      const firstErrorKey = Object.keys(errors)[0]
      const firstError = (errors as Record<string, { message?: string }>)[firstErrorKey]
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
  }


  // --- Render Functions for Form Sections ---

  const renderAvatarUpload = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative group cursor-pointer">
        <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border shadow-[0_0_15px_rgba(255,255,255,0.2)] md:shadow-none">
          {avatarPreviewUrl || watch("avatar_url") ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarPreviewUrl || watch("avatar_url") || ""}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-white" />
        </div>

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setError(null)
              handleAvatarUpload(file)
            }
          }}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-20"
        />
      </div>

      <div className="text-center space-y-1">
        <Button variant="outline" type="button" className="pointer-events-none relative z-10 hidden md:inline-flex">
          {uploading ? "Uploading..." : "Change Photo"}
        </Button>
        <Button variant="ghost" type="button" className="pointer-events-none relative z-10 md:hidden text-primary">
          {uploading ? "Uploading..." : "Tap to Change Photo"}
        </Button>

        {errors.avatar_url && (
          <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
        )}
      </div>
    </div>
  )



  const renderLocation = () => (
    <div className="grid grid-cols-1 gap-6">
      {/* Three-column grid: Country, State, City - NOW AT TOP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1">
          <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <select
                id="country"
                {...field}
                className={cn("w-full h-12 md:h-10 p-2 px-4 border rounded rounded-lg bg-background text-foreground text-base md:text-sm", errors.country && "border-destructive")}
                onChange={e => {
                  field.onChange(e);
                  setValue("state", "");
                  setValue("city", "");
                }}
              >
                <option value="">Select Country</option>
                {Country.getAllCountries().map(country => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.country && (
            <p className="text-sm text-[#FF8A80]">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="state" className="text-sm font-medium">State *</Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <select
                id="state"
                {...field}
                className={cn("w-full h-12 md:h-10 p-2 px-4 border rounded rounded-lg bg-background text-foreground text-base md:text-sm", errors.state && "border-destructive")}
                disabled={!watch("country")}
                onChange={e => {
                  field.onChange(e);
                  setValue("city", "");
                }}
              >
                <option value="">Select State</option>
                {watch("country") &&
                  State.getStatesOfCountry(watch("country")).map(state => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
              </select>
            )}
          />
          {errors.state && (
            <p className="text-sm text-[#FF8A80]">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="city" className="text-sm font-medium">City *</Label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <select
                id="city"
                {...field}
                className={cn("w-full h-12 md:h-10 p-2 px-4 border rounded rounded-lg bg-background text-foreground text-base md:text-sm", errors.city && "border-destructive")}
                disabled={!watch("state")}
              >
                <option value="">Select City</option>
                {watch("state") &&
                  City.getCitiesOfState(watch("country"), watch("state")).map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
              </select>
            )}
          />
          {errors.city && (
            <p className="text-sm text-[#FF8A80]">{errors.city.message}</p>
          )}
        </div>
      </div>

      {/* Full-width field: Address Line 1 */}
      <div className="space-y-1">
        <Label htmlFor="address_line_1" className="text-sm font-medium">Address Line 1 *</Label>
        <Input
          id="address_line_1"
          {...register("address_line_1")}
          className={cn("h-12 md:h-10 text-base md:text-sm", errors.address_line_1 && "border-destructive")}
        />
        {errors.address_line_1 && (
          <p className="text-sm text-[#FF8A80]">{errors.address_line_1.message}</p>
        )}
      </div>

      {/* Full-width field: Address Line 2 */}
      <div className="space-y-1">
        <Label htmlFor="address_line_2" className="text-sm font-medium">Address Line 2</Label>
        <Input
          id="address_line_2"
          {...register("address_line_2")}
          className="h-12 md:h-10 text-base md:text-sm"
        />
      </div>
    </div>
  )

  const renderProfessional = () => (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-1">
        <Label htmlFor="company" className="text-sm font-medium">Company Name *</Label>
        <Input
          id="company"
          {...register("company")}
          className={cn("h-12 md:h-10 text-base md:text-sm", errors.company && "border-destructive")}
          placeholder="e.g. Google or NA if not applicable"
        />
        {errors.company && (
          <p className="text-sm text-[#FF8A80]">{errors.company.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <Label htmlFor="job_title" className="text-sm font-medium">Job Title *</Label>
          <Input
            id="job_title"
            {...register("job_title")}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.job_title && "border-destructive")}
            placeholder="e.g. Software Engineer or NA if not applicable"
          />
          {errors.job_title && (
            <p className="text-sm text-[#FF8A80]">{errors.job_title.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="industry" className="text-sm font-medium">Industry *</Label>
          <Input
            id="industry"
            {...register("industry")}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.industry && "border-destructive")}
            placeholder="e.g. Technology or NA if not applicable"
          />
          {errors.industry && (
            <p className="text-sm text-[#FF8A80]">{errors.industry.message}</p>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="-mt-3 text-xs text-muted-foreground">
        Enter "NA" if these do not apply to you.
      </div>

      <div className="space-y-1">
        <Label htmlFor="business_bio" className="text-sm font-medium">Business Bio</Label>
        <Textarea
          id="business_bio"
          {...register("business_bio")}
          className="focus-visible:ring-[#FF9933] text-base md:text-sm min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <Label htmlFor="yi_vertical" className="text-sm font-medium">Yi Vertical</Label>
          <Select
            value={watch("yi_vertical") || ""}
            onValueChange={(value) => setValue("yi_vertical", value)}
          >
            <SelectTrigger id="yi_vertical" className="focus:ring-[#FF9933] h-12 md:h-10">
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

        <div className="space-y-1">
          <Label htmlFor="yi_position" className="text-sm font-medium">Yi Position</Label>
          <Select
            value={watch("yi_position") || ""}
            onValueChange={(value) => setValue("yi_position", value)}
          >
            <SelectTrigger id="yi_position" className="focus:ring-[#FF9933] h-12 md:h-10">
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
    </div>
  )

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: keyof ProfileFormData) => {
    const value = e.target.value
    if (value && value.trim() !== "" && !/^https?:\/\//i.test(value)) {
      setValue(fieldName, `https://${value}`, { shouldValidate: true })
    }
  }

  const renderSocial = () => {
    const linkedinReg = register("linkedin_url")
    const instagramReg = register("instagram_url")
    const twitterReg = register("twitter_url")
    const facebookReg = register("facebook_url")

    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-1">
          <Label htmlFor="linkedin_url" className="text-sm font-medium">LinkedIn URL *</Label>
          <Input
            id="linkedin_url"
            type="text"
            {...linkedinReg}
            onBlur={(e) => {
              linkedinReg.onBlur(e)
              handleUrlBlur(e, "linkedin_url")
            }}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.linkedin_url && "border-destructive")}
            placeholder="linkedin.com/in/username"
          />
          {errors.linkedin_url && (
            <p className="text-sm text-[#FF8A80]">{errors.linkedin_url.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="instagram_url" className="text-sm font-medium">Instagram URL</Label>
          <Input
            id="instagram_url"
            type="text"
            {...instagramReg}
            onBlur={(e) => {
              instagramReg.onBlur(e)
              handleUrlBlur(e, "instagram_url")
            }}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.instagram_url && "border-destructive")}
            placeholder="instagram.com/username"
          />
          {errors.instagram_url && (
            <p className="text-sm text-[#FF8A80]">{errors.instagram_url.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="twitter_url" className="text-sm font-medium">Twitter URL</Label>
          <Input
            id="twitter_url"
            type="text"
            {...twitterReg}
            onBlur={(e) => {
              twitterReg.onBlur(e)
              handleUrlBlur(e, "twitter_url")
            }}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.twitter_url && "border-destructive")}
            placeholder="twitter.com/username"
          />
          {errors.twitter_url && (
            <p className="text-sm text-[#FF8A80]">{errors.twitter_url.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="facebook_url" className="text-sm font-medium">Facebook URL</Label>
          <Input
            id="facebook_url"
            type="text"
            {...facebookReg}
            onBlur={(e) => {
              facebookReg.onBlur(e)
              handleUrlBlur(e, "facebook_url")
            }}
            className={cn("h-12 md:h-10 text-base md:text-sm", errors.facebook_url && "border-destructive")}
            placeholder="facebook.com/username"
          />
          {errors.facebook_url && (
            <p className="text-sm text-[#FF8A80]">{errors.facebook_url.message}</p>
          )}
        </div>


        <div className="space-y-1">
          <Label htmlFor="bio" className="text-sm font-medium">Personal Bio *</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            className={cn("focus-visible:ring-[#FF9933] text-base md:text-sm min-h-[100px]", errors.bio && "border-destructive")}
            placeholder="Tell us about yourself..."
          />
          {errors.bio && (
            <p className="text-sm text-[#FF8A80]">{errors.bio.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="spouse_name" className="text-sm font-medium">Spouse Name</Label>
          <Input
            id="spouse_name"
            {...register("spouse_name")}
            className="h-12 md:h-10 text-base md:text-sm"
          />
        </div>

        {
          spouseName && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Anniversary Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 md:h-10 justify-start text-left font-normal rounded-lg",
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
          )
        }
      </div >
    )
  }

  const renderTags = () => (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Business Tags ({businessTags.length}/3)</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(businessTags || []).map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="bg-[#FF9933] text-white cursor-default"
            >
              {tag}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBusinessTag(tag)
                }}
              />
            </Badge>
          ))}

          <Input
            ref={businessInputRef}
            value={businessInput}
            onChange={(e) => setBusinessInput(e.target.value)}
            onKeyDown={handleBusinessKeyDown}
            placeholder="Add a tag..."
            className="min-w-[140px] max-w-full h-10 text-base md:text-sm"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {BUSINESS_TAGS.filter((t) => !(businessTags || []).some((b) => b.toLowerCase() === t.toLowerCase())).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer"
              onClick={() => addBusinessTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {businessTags.length >= 3 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Maximum 3 tags selected
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Hobby Tags ({hobbyTags.length}/3)</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(hobbyTags || []).map((tag) => (
            <Badge key={tag} variant="default" className="bg-[#FF9933] text-white cursor-default">
              {tag}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleHobbyTag(tag)
                }}
              />
            </Badge>
          ))}

          <Input
            ref={hobbyInputRef}
            value={hobbyInput}
            onChange={(e) => setHobbyInput(e.target.value)}
            onKeyDown={handleHobbyKeyDown}
            placeholder="Add a tag..."
            className="min-w-[140px] max-w-full h-10 text-base md:text-sm"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {HOBBY_TAGS.filter((t) => !(hobbyTags || []).some((b) => b.toLowerCase() === t.toLowerCase())).map((tag) => (
            <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => addHobbyTag(tag)}>
              {tag}
            </Badge>
          ))}
        </div>

        {hobbyTags.length >= 3 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Maximum 3 tags selected
          </p>
        )}
      </div>
    </div>
  )

  const mobileSections = [
    { id: "identity", label: "Identity", render: () => <IdentityForm register={register} errors={errors} control={control} setValue={setValue} dob={dob} /> },
    { id: "location", label: "Location", render: renderLocation },
    { id: "professional", label: "Professional", render: renderProfessional },
    { id: "social", label: "Social & Personal", render: renderSocial },
    { id: "tags", label: "Tags", render: renderTags },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex h-full flex-col">
      {/* --- DESKTOP VIEW (Hidden on Mobile) --- */}
      <div className="hidden md:flex h-full flex-col">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex h-full flex-col">
          {/* Header Section - Fixed at top */}
          <div className="flex-shrink-0 border-b border-border px-5 md:px-6 pt-6 pb-4">
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

            <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-1">
              <TabsTrigger value="identity" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Identity</TabsTrigger>
              <TabsTrigger value="location" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Location</TabsTrigger>
              <TabsTrigger value="professional" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Professional</TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Social & Personal</TabsTrigger>
              <TabsTrigger value="tags" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Tags</TabsTrigger>
            </TabsList>
          </div>

          {/* Body Section - Scrollable */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 md:px-6 py-6">
            <TabsContent value="identity" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Identity</CardTitle>
                  <CardDescription>Your basic information</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAvatarUpload()}
                  <IdentityForm register={register} errors={errors} control={control} setValue={setValue} dob={dob} defaultCountry={phoneCountry} />
                </CardContent>
              </Card>
            </TabsContent>
            {/* Same generic wrapper for other tabs for simplicity or direct mapped */}
            <TabsContent value="location" className="space-y-6 mt-0">
              <Card><CardHeader><CardTitle>Location</CardTitle><CardDescription>Your address information</CardDescription></CardHeader><CardContent>{renderLocation()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="professional" className="space-y-6 mt-0">
              <Card><CardHeader><CardTitle>Professional</CardTitle><CardDescription>Your work info</CardDescription></CardHeader><CardContent>{renderProfessional()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="social" className="space-y-6 mt-0">
              <Card><CardHeader><CardTitle>Social & Personal</CardTitle><CardDescription>Social links</CardDescription></CardHeader><CardContent>{renderSocial()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="tags" className="space-y-6 mt-0">
              <Card><CardHeader><CardTitle>Tags</CardTitle><CardDescription>Interests</CardDescription></CardHeader><CardContent>{renderTags()}</CardContent></Card>
            </TabsContent>
          </div>

          {/* Footer Section */}
          <div className="flex-shrink-0 border-t border-border px-5 md:px-6 py-4">
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              {isLastTab ? (
                <Button type="submit" className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white" disabled={loading}>
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              ) : (
                <Button type="button" className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white" onClick={handleNext}>Next</Button>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="flex md:hidden flex-col h-full w-full relative">
        {/* Mobile Header - Fixed */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-5 pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold tracking-tight">User Profile</h2>
              <div className="text-sm font-medium text-muted-foreground">
                Step {currentTabIndex + 1} of {tabs.length}
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[#FF9933] transition-all duration-300 ease-out"
              style={{ width: `${((currentTabIndex + 1) / tabs.length) * 100}%` }}
            />
          </div>
          {/* Section Label Bar */}
          <div className="bg-muted/30 px-5 py-2">
            <div className="text-sm font-medium text-[#FF9933]">
              {mobileSections[currentTabIndex]?.label}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="w-full pb-40 pt-0">
          {/* Show Avatar only on first step (Identity) */}
          {currentTab === 'identity' && (
            <div className="mb-6 px-5">
              {renderAvatarUpload()}
            </div>
          )}

          <div className="space-y-6 px-5">
            {/* Render ONLY the current section using direct conditionals to preserve focus */}
            {currentTab === 'identity' && (
              <IdentityForm
                register={register}
                errors={errors}
                control={control}
                setValue={setValue}
                dob={dob}
                defaultCountry={phoneCountry}
              />
            )}
            {currentTab === 'location' && renderLocation()}
            {currentTab === 'professional' && renderProfessional()}
            {currentTab === 'social' && renderSocial()}
            {currentTab === 'tags' && renderTags()}
          </div>
        </div>

        {/* Sticky Footer Navigation - Fixed to corners */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-30 flex justify-between items-center">
          {/* Previous Button (Left Corner) */}
          <div className="w-[120px]"> {/* Fixed width container for alignment */}
            {currentTabIndex > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const prevTab = tabs[currentTabIndex - 1]
                  if (prevTab) setCurrentTab(prevTab)
                }}
                className="h-10 text-base font-normal px-0 hover:bg-transparent hover:text-foreground/80 justify-start"
              >
                <span className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Back
                </span>
              </Button>
            ) : <div />}
          </div>

          {/* Next/Finish Button (Right Corner) */}
          <div className="w-[140px] flex justify-end">
            {isLastTab ? (
              <Button
                type="submit"
                className="h-10 rounded-full text-sm bg-[#FF9933] hover:bg-[#FF9933]/90 text-white font-semibold shadow-md px-6"
                disabled={loading}
              >
                {loading ? "..." : "Finish"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 rounded-full text-sm bg-[#FF9933] hover:bg-[#FF9933]/90 text-white font-semibold shadow-md px-6"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
