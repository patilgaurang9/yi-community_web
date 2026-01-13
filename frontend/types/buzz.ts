export interface MemberData {
  id: string
  full_name: string
  avatar_url?: string
  job_title?: string
  company?: string
}

export interface EventData {
  id: string
  title: string
  start_time: string
  location_name?: string
  image_url?: string
}

export interface OfferData {
  id: string
  title: string
  description?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  category?: 'members' | 'events' | 'offers' | 'general'
  data?: any[] // Holds MemberData[] | EventData[] | OfferData[]
  timestamp: Date
}
