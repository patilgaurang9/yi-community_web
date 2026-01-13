'use client'

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gift, Users, Copy, Check, ExternalLink, Calendar, Award } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Benefit } from "@/types/benefits"
import { format, isPast } from "date-fns"

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<Benefit | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch benefits from Supabase
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('benefits')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching benefits:', error)
          return
        }

        setBenefits(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBenefits()
  }, [])

  // Filter benefits by type using useMemo
  const offers = useMemo(() => 
    benefits.filter(benefit => benefit.type === 'offer'),
    [benefits]
  )

  const partners = useMemo(() => 
    benefits.filter(benefit => benefit.type === 'partner'),
    [benefits]
  )

  // Copy promo code to clipboard
  const handleCopyPromoCode = async (promoCode: string, benefitId: string) => {
    try {
      await navigator.clipboard.writeText(promoCode)
      setCopiedId(benefitId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Get promo code from benefit (handle both 'promo_code' and 'code' fields)
  const getPromoCode = (benefit: Benefit) => {
    return benefit.promo_code || benefit.code || null
  }

  // Get initials for partner placeholder
  const getInitials = (name: string) => {
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Check if offer is expired
  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    return isPast(new Date(expirationDate))
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <Gift className="h-6 w-6 text-[#FF9933]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Benefits Hub</h1>
        </div>
        <p className="text-muted-foreground">
          Exclusive offers and partner benefits for Yi members
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="offers" className="data-[state=active]:bg-[#FF9933]">
            <Gift className="h-4 w-4 mr-2" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-[#FF9933]">
            <Users className="h-4 w-4 mr-2" />
            Partners
          </TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers">
          {isLoading ? (
            <LoadingSkeleton />
          ) : offers.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No offers available"
              description="Check back soon for exclusive member offers and deals"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card
                  key={offer.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all"
                >
                  <CardContent className="p-5">
                    {/* Title */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white flex-1">
                        {offer.title}
                      </h3>
                      {offer.expiration_date && (
                        <Badge
                          variant="outline"
                          className={`ml-2 ${
                            isExpired(offer.expiration_date)
                              ? 'border-red-500 text-red-500'
                              : 'border-[#FF9933] text-[#FF9933]'
                          }`}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {isExpired(offer.expiration_date) ? 'Expired' : 
                            `Expires ${format(new Date(offer.expiration_date), 'MMM d')}`
                          }
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {offer.description && (
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Promo Code Section */}
                    {getPromoCode(offer) && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-zinc-400 block mb-1">
                            Promo Code
                          </span>
                          <code className="text-sm font-mono font-semibold text-[#FF9933]">
                            {getPromoCode(offer)}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPromoCode(getPromoCode(offer)!, offer.id)}
                          className="border-zinc-600 hover:border-[#FF9933] hover:bg-[#FF9933]/10"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1 text-green-500" />
                              <span className="text-green-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Organization Name */}
                    {offer.organization_name && (
                      <div className="mt-3 text-xs text-zinc-500">
                        Provided by {offer.organization_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners">
          {isLoading ? (
            <LoadingSkeleton />
          ) : partners.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No partners yet"
              description="We're working on bringing you amazing partnerships"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <Card
                  key={partner.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-[#FF9933] transition-all cursor-pointer group"
                  onClick={() => setSelectedPartner(partner)}
                >
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    {/* Logo or Initials */}
                    <div className="mb-4">
                      {partner.logo_url ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-[#FF9933] transition-all relative">
                          <Image
                            src={partner.logo_url}
                            alt={partner.organization_name || partner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-[#FF9933] transition-all flex items-center justify-center">
                          <span className="text-2xl font-bold text-zinc-400">
                            {getInitials(partner.organization_name || partner.title)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Organization Name */}
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {partner.organization_name || partner.title}
                    </h3>

                    {/* Short Description */}
                    {partner.description && (
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                        {partner.description}
                      </p>
                    )}

                    {/* Learn More Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-600 hover:border-[#FF9933] hover:bg-[#FF9933]/10 w-full"
                    >
                      Learn More
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Partner Modal */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              {/* Logo */}
              {selectedPartner?.logo_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 relative">
                  <Image
                    src={selectedPartner.logo_url}
                    alt={selectedPartner.organization_name || selectedPartner.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                  <span className="text-xl font-bold text-zinc-400">
                    {selectedPartner && getInitials(selectedPartner.organization_name || selectedPartner.title)}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <DialogTitle>
                  {selectedPartner?.organization_name || selectedPartner?.title}
                </DialogTitle>
                <Badge className="mt-1 bg-[#FF9933]/10 text-[#FF9933] border-[#FF9933]">
                  <Award className="h-3 w-3 mr-1" />
                  MOU Partner
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Full Description */}
          {selectedPartner?.description && (
            <DialogDescription className="text-base text-zinc-300 leading-relaxed">
              {selectedPartner.description}
            </DialogDescription>
          )}

          {/* Additional Info */}
          <div className="border-t border-zinc-800 pt-4 mt-4">
            <p className="text-sm text-zinc-500">
              This partnership provides exclusive benefits and opportunities for Yi members.
              Contact us to learn more about how to take advantage of this partnership.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="animate-pulse">
              <div className="h-6 bg-zinc-800 rounded w-3/4 mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-4" />
              <div className="h-12 bg-zinc-800 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-zinc-900 rounded-full mb-4">
        <Icon className="h-12 w-12 text-zinc-600" />
      </div>
      <h3 className="text-xl font-semibold text-zinc-400 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-md">{description}</p>
    </div>
  )
}
