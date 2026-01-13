export interface Benefit {
  id: string
  title: string
  description: string | null
  type: 'offer' | 'partner' | string
  organization_name?: string | null
  logo_url?: string | null
  promo_code?: string | null
  code?: string | null
  expiration_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface OfferBenefit extends Benefit {
  type: 'offer'
  promo_code: string
}

export interface PartnerBenefit extends Benefit {
  type: 'partner'
  organization_name: string
}
