import { z } from "zod"
import { isValidPhoneNumber } from "react-phone-number-input"

export const profileSchema = z.object({
  // Identity
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().optional().or(z.literal("")),
  phone_number: z.string()
    .min(1, "Phone number is required")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Invalid phone number format",
    }),
  dob: z.date().optional(),
  secondary_email: z.string().email("Invalid email").optional().or(z.literal("")),
  secondary_phone: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || isValidPhoneNumber(val), {
      message: "Invalid phone number format",
    }),

  // Location
  address_line_1: z.string().min(1, "Address is required"),
  address_line_2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),

  // Professional
  company: z.string().min(1, "This field is required"),
  job_title: z.string().min(1, "This field is required"),
  industry: z.string().min(1, "This field is required"),
  business_bio: z.string().optional().or(z.literal("")),
  yi_vertical: z.string().optional().or(z.literal("")),
  yi_position: z.string().optional().or(z.literal("")),

  // Social
  // Social
  linkedin_url: z.string().min(1, "LinkedIn URL is required").regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid URL format"),
  instagram_url: z.string().regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid URL format").optional().or(z.literal("")),
  twitter_url: z.string().regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid URL format").optional().or(z.literal("")),
  facebook_url: z.string().regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid URL format").optional().or(z.literal("")),

  // Personal
  bio: z.string().min(1, "Bio is required"),
  spouse_name: z.string().optional().or(z.literal("")),
  anniversary_date: z.date().optional(),

  // Tags
  business_tags: z.array(z.string()).min(1, "Select at least 1 business tag").max(3, "Maximum 3 business tags allowed"),
  hobby_tags: z.array(z.string()).min(1, "Select at least 1 hobby tag").max(3, "Maximum 3 hobby tags allowed"),

  // Avatar (optional - user can skip or upload later)
  avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Constants
export const YI_VERTICALS = [
  "verticals",
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
  "learning",
  "branding",
] as const

export const YI_POSITIONS = [
  "Chair",
  "Co-Chair",
  "Joint Chair",
  "EC Member",
  "Mentor",
] as const

export const BUSINESS_TAGS = [
  "Technology",
  "Finance",
  "Marketing",
  "Healthcare",
  "Real Estate",
  "Manufacturing",
  "Education",
  "Retail",
  "Consulting",
  "Legal",
  "Construction",
  "Logistics",
  "Media & Entertainment",
  "Hospitality",
  "Energy",
] as const

export const HOBBY_TAGS = [
  "Cricket",
  "Travel",
  "Reading",
  "Music",
  "Fitness",
  "Photography",
  "Cooking",
  "Movies",
  "Tech & Gadgets",
  "Art & Design",
  "Trekking",
  "Gaming",
  "Writing",
  "Social Service",
  "Networking",
] as const
