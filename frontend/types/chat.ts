export interface MemberData {
  id: string
  full_name: string
  avatar_url?: string
  job_title?: string
  company?: string
  match_reason?: string // Why the AI picked them
}

export interface EventData {
  id: string
  title: string
  start_time: string
  location_name?: string
  category?: string
}

export interface OfferData {
  id: string
  title: string
  code?: string
  description?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  category?: "members" | "events" | "offers" | "general"
  data?: MemberData[] | EventData[] | OfferData[]
  timestamp: Date
}

export interface ChatResponse {
  answer: string
  data?: MemberData[] | EventData[] | OfferData[]
  category?: "members" | "events" | "offers" | "general"
}
