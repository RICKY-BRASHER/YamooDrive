import type { CarListing } from '../carData'

export type AgencyClient = {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  birthDate: string
  bookings: number
  since: string
  state: 'Actif' | 'À vérifier'
}

export type VehicleState = 'Disponible' | 'En location' | 'Entretien' | 'Hors service'
export type AgencyVehicle = CarListing & { status: VehicleState; registration?: string }

export type AgencyOffer = {
  id: string
  title: string
  detail: string
  price: number
  durationHours: number
  minDurationHours: number
  vehicleIds: number[]
  enabled: boolean
  uses: number
}

export function isAgencyClientArray(value: unknown): value is AgencyClient[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const client = item as Record<string, unknown>
    return typeof client.id === 'string'
      && typeof client.name === 'string'
      && typeof client.email === 'string'
      && typeof client.phone === 'string'
      && typeof client.licenseNumber === 'string'
      && typeof client.birthDate === 'string'
      && typeof client.bookings === 'number'
      && Number.isFinite(client.bookings)
      && client.bookings >= 0
      && typeof client.since === 'string'
      && (client.state === 'Actif' || client.state === 'À vérifier')
  })
}

export function isAgencyVehicleArray(value: unknown): value is AgencyVehicle[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const vehicle = item as Record<string, unknown>
    return typeof vehicle.id === 'number'
      && typeof vehicle.name === 'string'
      && typeof vehicle.brand === 'string'
      && typeof vehicle.category === 'string'
      && typeof vehicle.image === 'string'
      && typeof vehicle.price === 'number'
      && Number.isFinite(vehicle.price)
      && vehicle.price > 0
      && typeof vehicle.priceHour === 'number'
      && Number.isFinite(vehicle.priceHour)
      && vehicle.priceHour > 0
      && typeof vehicle.seats === 'number'
      && Number.isFinite(vehicle.seats)
      && vehicle.seats > 0
      && typeof vehicle.transmission === 'string'
      && typeof vehicle.fuel === 'string'
      && (vehicle.registration === undefined || typeof vehicle.registration === 'string')
      && (vehicle.status === 'Disponible' || vehicle.status === 'En location' || vehicle.status === 'Entretien' || vehicle.status === 'Hors service')
  })
}

export function isAgencyOfferArray(value: unknown): value is AgencyOffer[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const offer = item as Record<string, unknown>
    return typeof offer.id === 'string'
      && typeof offer.title === 'string'
      && typeof offer.detail === 'string'
      && typeof offer.price === 'number'
      && Number.isFinite(offer.price)
      && offer.price > 0
      && typeof offer.durationHours === 'number'
      && Number.isFinite(offer.durationHours)
      && offer.durationHours > 0
      && typeof offer.minDurationHours === 'number'
      && Number.isFinite(offer.minDurationHours)
      && offer.minDurationHours > 0
      && Array.isArray(offer.vehicleIds)
      && offer.vehicleIds.every((vehicleId) => typeof vehicleId === 'number')
      && typeof offer.enabled === 'boolean'
      && typeof offer.uses === 'number'
      && Number.isFinite(offer.uses)
      && offer.uses >= 0
  })
}

export function getVehicle(vehicles: AgencyVehicle[], vehicleId: number): AgencyVehicle {
  return vehicles.find((vehicle) => vehicle.id === vehicleId) ?? {
    id: vehicleId,
    name: 'Véhicule indisponible',
    brand: '',
    category: 'Berline',
    image: '',
    price: 0,
    priceHour: 0,
    seats: 0,
    transmission: 'Manuelle',
    fuel: '',
    status: 'Hors service',
  }
}

/** Mirrors the server's lower hourly/daily rate so the live estimate matches the saved amount. */
export function calculateRentalPrice(vehicle: AgencyVehicle, hours: number) {
  // Keep the hourly/daily comparison aligned with the server-side reservation calculator.
  const fullDays = Math.floor(hours / 24)
  const extraHours = hours % 24
  return fullDays * Math.min(24 * vehicle.priceHour, vehicle.price)
    + Math.min(extraHours * vehicle.priceHour, vehicle.price)
}

/** Returns the cheapest combination of this offer and regular rental rates for the requested hours. */
export function calculateOfferPrice(vehicle: AgencyVehicle, offer: AgencyOffer, hours: number) {
  // Compare every package count, since several smaller packages can beat a single larger bundle.
  let bestPrice = calculateRentalPrice(vehicle, hours)
  const packageCount = Math.floor(hours / offer.durationHours)

  for (let count = 1; count <= packageCount; count += 1) {
    const remainingHours = hours - count * offer.durationHours
    const total = count * offer.price + calculateRentalPrice(vehicle, remainingHours)
    bestPrice = Math.min(bestPrice, total)
  }

  return bestPrice
}
