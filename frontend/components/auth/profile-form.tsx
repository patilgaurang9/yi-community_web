"use client"

import { Country, State, City } from "@/lib/country-state-city-utils"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { parsePhoneNumberWithError } from "libphonenumber-js"
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
import { CalendarIcon, Upload, X, User, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { IdentityForm } from "./identity-form"


const MOBILE_SECTIONS_CONFIG = [
  { id: "identity", label: "Identity" },
  { id: "location", label: "Location" },
  { id: "professional", label: "Professional" },
  { id: "social", label: "Social & Personal" },
  { id: "tags", label: "Tags" },
]

export function ProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentTab, setCurrentTab] = useState("identity")
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<string | undefined>(undefined) // Store detected country code from phone number
  const hasLoaded = useRef(false) // <--- CRITICAL FIX: Prevent re-fetching overwrites
  const [showValidation, setShowValidation] = useState(false)
  const [verticals, setVerticals] = useState<{ id: string, name: string }[]>([])

  // Fetch verticals from database
  useEffect(() => {
    async function fetchVerticals() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("yi_verticals")
          .select("id, name")
          .order("name")

        if (error) {
          console.error("❌ Error fetching verticals:", error.message, "[Status:", error.code, "]")
          return
        }

        if (data) {
          setVerticals(data)
        }
      } catch (err) {
        console.error("💥 Unexpected error fetching verticals:", err)
      }
    }
    fetchVerticals()
  }, [])

  const {
    register,
    handleSubmit,
    formState,
    formState: { errors },
    setValue,
    watch,
    trigger,
    control,
    getValues,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    shouldUnregister: false,
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      business_tags: [],
      hobby_tags: [],
      avatar_url: "",
    },
  })

  // Store setValue in ref to avoid useEffect dependency issues
  const setValueRef = useRef(setValue)
  useEffect(() => {
    setValueRef.current = setValue
  }, [setValue])

  const businessTags = watch("business_tags") || []
  const hobbyTags = watch("hobby_tags") || []
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
  const handleNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()

    if (currentTab === "identity") {
      setShowValidation(true)
      const result = await trigger(["first_name", "last_name", "dob", "phone_number"], { shouldFocus: false })
      if (!result) return
    }

    if (!isLastTab) {
      setShowValidation(false)
      setCurrentTab(tabs[currentTabIndex + 1])
    }
  }

  // Helper functions to reduce complexity
  const handleDateField = (key: string, value: unknown) => {
    if (typeof value === "string") {
      const dateValue = new Date(value)
      if (!Number.isNaN(dateValue.getTime())) {
        setValueRef.current(key as keyof ProfileFormData, dateValue, { shouldDirty: false, shouldValidate: false })
      }
    } else if (value instanceof Date) {
      setValueRef.current(key as keyof ProfileFormData, value, { shouldDirty: false, shouldValidate: false })
    }
  }

  const handleArrayField = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      const cleanArray = value.filter((item) => typeof item === "string" && item.trim() !== "")
      setValueRef.current(key as keyof ProfileFormData, cleanArray, { shouldDirty: false, shouldValidate: false })
    } else if (value) {
      try {
        const parsed = JSON.parse(value as string)
        if (Array.isArray(parsed)) {
          const cleanArray = parsed.filter((item: unknown) => typeof item === "string" && item.trim() !== "")
          setValueRef.current(key as keyof ProfileFormData, cleanArray, { shouldDirty: false, shouldValidate: false })
        }
      } catch {
        // JSON parse failed, skip
      }
    }
  }

  const handlePhoneField = (key: string, value: unknown) => {
    let phoneStr = (value as string) ?? ""
    if (phoneStr && !phoneStr.startsWith("+")) {
      phoneStr = `+91${phoneStr}`
    }
    setValueRef.current(key as keyof ProfileFormData, phoneStr, { shouldDirty: false, shouldValidate: false })

    if (key === "phone_number" && phoneStr?.startsWith("+")) {
      try {
        const parsed = parsePhoneNumberWithError(phoneStr)
        setPhoneCountry(parsed?.country || "IN")
      } catch {
        setPhoneCountry("IN")
      }
    }
  }

  const handleStandardField = (key: string, value: unknown) => {
    if (key === "id" || key === "email" || key === "created_at" || key === "updated_at") return
    const safeValue = value ?? ""
    setValueRef.current(key as keyof ProfileFormData, safeValue as any, { shouldDirty: false, shouldValidate: false })
    if (key === "avatar_url" && typeof value === 'string' && value) {
      setAvatarPreviewUrl(value)
    }
  }

  // Fetch existing profile data
  useEffect(() => {
    if (hasLoaded.current) return

    async function loadProfile() {
      try {
        hasLoaded.current = true
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error("❌ Auth error loading profile:", authError.message, "[Status:", authError.status, "]")
          router.push("/login")
          return
        }

        if (!user) {
          router.push("/login")
          return
        }

        if (user.user_metadata?.full_name) {
          const nameParts = user.user_metadata.full_name.split(" ")
          setValueRef.current("first_name", nameParts[0] || "", { shouldDirty: false, shouldValidate: false })
          setValueRef.current("last_name", nameParts.slice(1).join(" ") || "", { shouldDirty: false, shouldValidate: false })
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          if (profileError.code !== 'PGRST116') {
            console.error("❌ Error loading profile record:", profileError.message, "[Status:", profileError.code, "]")
          }
        }

        if (profile) {
          Object.keys(profile).forEach((key) => {
            const value = profile[key as keyof typeof profile]
            if (["dob", "anniversary_date", "job_start_date"].includes(key)) {
              handleDateField(key, value)
            } else if (["business_tags", "hobby_tags"].includes(key)) {
              handleArrayField(key, value)
            } else if (["phone_number", "secondary_phone"].includes(key)) {
              handlePhoneField(key, value)
            } else {
              handleStandardField(key, value)
            }
          })
        }
      } catch (err) {
        console.error("💥 Unexpected error in loadProfile:", err)
      }
    }

    loadProfile()
  }, [router])

  // Avatar upload handler
  const handleAvatarUpload = async (file: File) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setUploading(true)

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

      // Clean up local preview URL after successful upload
      URL.revokeObjectURL(localPreviewUrl)
    } catch {
      setAvatarPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const toggleBusinessTag = (tag: string) => {
    const current = businessTags
    if (current.includes(tag)) {
      setValue("business_tags", current.filter((t) => t !== tag))
    } else {
      if (current.length >= 3) {
        return
      }
      setValue("business_tags", [...current, tag])
    }
  }

  const toggleHobbyTag = (tag: string) => {
    const current = hobbyTags
    if (current.includes(tag)) {
      setValue("hobby_tags", current.filter((t) => t !== tag))
    } else {
      if (current.length >= 3) {
        return
      }
      setValue("hobby_tags", [...current, tag])
    }
  }

  // Creatable tag inputs
  const [businessInput, setBusinessInput] = useState("")
  const [hobbyInput, setHobbyInput] = useState("")
  const businessInputRef = useRef<HTMLInputElement | null>(null)
  const hobbyInputRef = useRef<HTMLInputElement | null>(null)

  const addBusinessTag = (raw: string) => {
    const tag = raw.trim().replaceAll(/,+$/g, "")
    if (!tag) return
    // case-insensitive dedupe
    if ((businessTags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      return
    }
    if ((businessTags || []).length >= 3) {
      return
    }
    setValue("business_tags", [...(businessTags || []), tag])
    setBusinessInput("")
  }

  const addHobbyTag = (raw: string) => {
    const tag = raw.trim().replaceAll(/,+$/g, "")
    if (!tag) return
    if ((hobbyTags || []).some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      return
    }
    if ((hobbyTags || []).length >= 3) {
      return
    }
    setValue("hobby_tags", [...(hobbyTags || []), tag])
    setHobbyInput("")
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
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("❌ Auth error during submit:", authError.message, "[Status:", authError.status, "]")
        router.push("/login")
        return
      }

      if (!user) {
        router.push("/login")
        return
      }

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
        first_name: values.first_name,
        last_name: values.last_name,
        phone_number: values.phone_number,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2?.trim() || null,
        city: values.city,
        state: values.state,
        country: values.country,
        company: values.company,
        job_title: values.job_title,
        industry: values.industry,
        business_tags: businessTagsArray,
        hobby_tags: hobbyTagsArray,
        linkedin_url: values.linkedin_url,
        bio: values.bio,
        avatar_url: values.avatar_url?.trim() || null,
        dob: dobString,
        anniversary_date: anniversaryDateString,
        secondary_email: values.secondary_email?.trim() || null,
        secondary_phone: values.secondary_phone?.trim() || null,
        business_bio: values.business_bio?.trim() || null,
        vertical_id: values.vertical_id?.trim() || null,
        yi_position: values.yi_position?.trim() || null,
        instagram_url: values.instagram_url?.trim() || null,
        twitter_url: values.twitter_url?.trim() || null,
        facebook_url: values.facebook_url?.trim() || null,
        spouse_name: values.spouse_name?.trim() || null,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      }

      // Execute upsert
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(payload, {
          onConflict: "id",
        })

      if (updateError) {
        console.error("❌ Profile update error:", updateError.message, "[Status:", updateError.code, "]")
        throw updateError
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("💥 Unexpected error in onSubmit:", err)
      setLoading(false)
    }
  }

  // Handle form validation errors
  const onError = () => { }

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
          <Label htmlFor="country" className="text-sm font-medium">Country</Label>
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
                  setValue("state", "", { shouldValidate: false });
                  setValue("city", "", { shouldValidate: false });
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
          <Label htmlFor="state" className="text-sm font-medium">State</Label>
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
                  setValue("city", "", { shouldValidate: false });
                }}
              >
                <option value="">Select State</option>
                {watch("country") &&
                  State.getStatesOfCountry(watch("country") || "").map(state => (
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
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
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
                  City.getCitiesOfState(watch("country") || "", watch("state") || "").map(city => (
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
        <Label htmlFor="address_line_1" className="text-sm font-medium">Address Line 1</Label>
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
        <Label htmlFor="company" className="text-sm font-medium">Company Name</Label>
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
          <Label htmlFor="job_title" className="text-sm font-medium">Job Title</Label>
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
          <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
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
          <Label htmlFor="vertical_id" className="text-sm font-medium">Vertical</Label>
          <Select
            value={watch("vertical_id") || ""}
            onValueChange={(value) => {
              setValue("vertical_id", value, { shouldValidate: true })
            }}
          >
            <SelectTrigger id="vertical_id" className="focus:ring-[#FF9933] h-12 md:h-10">
              <SelectValue placeholder="Select vertical" />
            </SelectTrigger>
            <SelectContent>
              {verticals.length > 0 && verticals.map((vertical) => (
                <SelectItem key={vertical.id} value={vertical.id}>
                  {vertical.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="yi_position" className="text-sm font-medium">Yi Position</Label>
          <Select
            value={watch("yi_position") || ""}
            onValueChange={(value) => setValue("yi_position", value, { shouldValidate: false })}
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
          <Label htmlFor="linkedin_url" className="text-sm font-medium">LinkedIn URL</Label>
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
          <Label htmlFor="bio" className="text-sm font-medium">Personal Bio</Label>
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
                    onSelect={(date) => setValue("anniversary_date", date, { shouldValidate: false, shouldDirty: true })}
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

            <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-1">
              <TabsTrigger value="identity" className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4">Identity</TabsTrigger>
              <TabsTrigger value="location" disabled={!watch("first_name") || !watch("last_name") || !watch("phone_number") || !watch("dob")} className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed">Location</TabsTrigger>
              <TabsTrigger value="professional" disabled={!watch("first_name") || !watch("last_name") || !watch("phone_number") || !watch("dob")} className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed">Professional</TabsTrigger>
              <TabsTrigger value="social" disabled={!watch("first_name") || !watch("last_name") || !watch("phone_number") || !watch("dob")} className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed">Social & Personal</TabsTrigger>
              <TabsTrigger value="tags" disabled={!watch("first_name") || !watch("last_name") || !watch("phone_number") || !watch("dob")} className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed">Tags</TabsTrigger>
            </TabsList>
          </div>

          {/* Body Section - Scrollable */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 md:px-6 py-6">
            <TabsContent value="identity" className="space-y-6 mt-0" forceMount hidden={currentTab !== "identity"}>
              <Card>
                <CardHeader>
                  <CardTitle>Identity</CardTitle>
                  <CardDescription>Your basic information</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAvatarUpload()}
                  <IdentityForm key="identity-form" register={register} errors={errors} control={control} defaultCountry={phoneCountry} showValidation={showValidation} />
                </CardContent>
              </Card>
            </TabsContent>
            {/* Same generic wrapper for other tabs for simplicity or direct mapped */}
            <TabsContent value="location" className="space-y-6 mt-0" forceMount hidden={currentTab !== "location"}>
              <Card><CardHeader><CardTitle>Location</CardTitle><CardDescription>Your address information</CardDescription></CardHeader><CardContent>{renderLocation()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="professional" className="space-y-6 mt-0" forceMount hidden={currentTab !== "professional"}>
              <Card><CardHeader><CardTitle>Professional</CardTitle><CardDescription>Your work info</CardDescription></CardHeader><CardContent>{renderProfessional()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="social" className="space-y-6 mt-0" forceMount hidden={currentTab !== "social"}>
              <Card><CardHeader><CardTitle>Social & Personal</CardTitle><CardDescription>Social links</CardDescription></CardHeader><CardContent>{renderSocial()}</CardContent></Card>
            </TabsContent>
            <TabsContent value="tags" className="space-y-6 mt-0" forceMount hidden={currentTab !== "tags"}>
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
              {MOBILE_SECTIONS_CONFIG[currentTabIndex]?.label}
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
            {/* Render all sections but hide inactive ones to preserve form state */}
            <div style={{ display: currentTab === 'identity' ? 'block' : 'none' }}>
              <IdentityForm
                key="identity-form-mobile"
                register={register}
                errors={errors}
                control={control}
                defaultCountry={phoneCountry}
                showValidation={showValidation}
              />
            </div>
            <div style={{ display: currentTab === 'location' ? 'block' : 'none' }}>
              {renderLocation()}
            </div>
            <div style={{ display: currentTab === 'professional' ? 'block' : 'none' }}>
              {renderProfessional()}
            </div>
            <div style={{ display: currentTab === 'social' ? 'block' : 'none' }}>
              {renderSocial()}
            </div>
            <div style={{ display: currentTab === 'tags' ? 'block' : 'none' }}>
              {renderTags()}
            </div>
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
