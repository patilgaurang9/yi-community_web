import { z } from "zod"
import { isValidPhoneNumber } from "react-phone-number-input"

export const profileSchema = z.object({
  // Identity
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      if (!val || val.length === 0) return false
      return isValidPhoneNumber(val)
    }, {
      message: "Invalid phone number format",
    }),
  dob: z.date().refine((val) => val !== undefined, {
    message: "Date of birth is required",
  }),
  secondary_email: z.string().email("Invalid email").optional().or(z.literal("")),
  secondary_phone: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || isValidPhoneNumber(val), {
      message: "Invalid phone number format",
    }),

  // Location
  address_line_1: z.string().optional().or(z.literal("")),
  address_line_2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),

  // Professional
  company: z.string().optional().or(z.literal("")),
  job_title: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  business_bio: z.string().optional().or(z.literal("")),
  vertical_id: z.string().uuid().optional().or(z.literal("")),
  yi_position: z.string().optional().or(z.literal("")),

  // Social
  linkedin_url: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
      message: "Invalid URL format",
    }),
  instagram_url: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
      message: "Invalid URL format",
    }),
  twitter_url: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
      message: "Invalid URL format",
    }),
  facebook_url: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val === "" || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
      message: "Invalid URL format",
    }),

  // Personal
  bio: z.string().optional().or(z.literal("")),
  spouse_name: z.string().optional().or(z.literal("")),
  anniversary_date: z.date().optional(),

  // Tags
  business_tags: z.array(z.string()).optional(),
  hobby_tags: z.array(z.string()).optional(),

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
