export type CarCategory = 'Citadine' | 'SUV' | 'Berline' | 'Premium' | 'Électrique'

export type CarListing = {
  id: number
  name: string
  brand: string
  category: CarCategory
  image: string
  price: number
  priceHour: number
  seats: number
  transmission: 'Automatique' | 'Manuelle'
  fuel: string
  badge?: string
  accent?: string
  isNew?: boolean
}

export const imageUrl = (image: string, width = 900) => {
  if (!image) return '/car-placeholder.svg'
  return image.startsWith('http://') || image.startsWith('https://')
    ? image
    : `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`
}

export const formatPrice = (price: number) => `${new Intl.NumberFormat('fr-FR').format(price)} F`
