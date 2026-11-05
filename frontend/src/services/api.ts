import axios from 'axios'
import type { CarCategory, CarListing } from '../components/carData'
import type { AdminReservation, ReservationStatus } from '../components/admin/adminData'
import type { AgencyClient, AgencyVehicle } from '../components/admin/agencyData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const API_ORIGIN = new URL(API_URL, window.location.origin).origin

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

export type AuthUser = {
  id: number
  name: string
  email: string
  role: 'admin' | 'client'
  licenseNumber: string | null
}

export type ClientReservation = {
  id: number
  createdAt: string
  start: string
  end: string
  status: 'En attente' | 'Confirmée' | 'En cours' | 'Terminée' | 'Annulée'
  total: number
  deposit: number
  vehicle: {
    name: string
    registration: string
    image: string | null
  }
  offerName: string | null
  payments: Array<{ type: string; amount: number; status: string }>
  returnDetails: {
    mileage: number
    fuel: string
    damage: string | null
    extraFees: number
  } | null
}

export type ProfileUpdate = {
  name: string
  email: string
  current_password?: string
  password?: string
  password_confirmation?: string
}

type ProfileUpdateResult = {
  user: AuthUser
  emailVerificationRequired: boolean
}

export type AdminVehicleInput = Pick<
  AgencyVehicle,
  'brand' | 'name' | 'category' | 'price' | 'priceHour' | 'seats' | 'transmission' | 'fuel'
> & {
  registration: string
  imageFile: File | null
  deposit: number
  mileage: number
}

export type AdminClientInput = Pick<AgencyClient, 'name' | 'email' | 'phone' | 'licenseNumber' | 'birthDate'>

export type AdminOfferInput = {
  title: string
  detail: string
  price: number
  durationHours: number
  minDurationHours: number
  vehicleIds: number[]
}

type AdminVehicleRecord = {
  id: number
  marque: string
  modele: string
  immatriculation: string
  categorie: CarCategory
  image: string | null
  places: number
  carburant: 'essence' | 'diesel' | 'hybride' | 'electrique' | 'gpl'
  boite: 'manuelle' | 'automatique'
  prix_heure: string | number
  prix_jour: string | number
  statut: 'active' | 'maintenance' | 'hors_service'
  active_rentals_count?: number
}

type AdminOfferRecord = {
  id: number
  nom: string
  description: string | null
  duree_forfait_heures: number
  duree_minimum_heures: number
  prix_forfait: string | number
  actif: boolean
  reservations_count?: number
  voiture_ids?: number[]
  voitures?: Array<{ id: number }>
  voiture?: { id: number } | null
}

type AdminClientRecord = {
  id: number
  nom: string
  email: string
  telephone: string
  numero_permis: string | null
  date_naissance: string | null
  reservations_count: number
  created_at: string
}

type AdminReservationRecord = {
  id: number
  created_at: string
  client_id: number
  voiture_id: number
  bon_plan_id: number | null
  bon_plan_nom_applique: string | null
  date_debut: string
  date_fin: string
  caution_appliquee: string | number
  km_depart: number | null
  total_prix: string | number
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee'
  client: { id: number; nom: string; email: string; telephone: string; numero_permis: string | null }
  voiture: { marque: string; modele: string; km_actuel: number }
  paiements: Array<{ type: string; montant: string | number; methode: string; statut: string }>
  retour: {
    km_retour: number
    carburant_retour: string
    degats: string | null
    frais_supplementaires: string | number
  } | null
}

type Credentials = {
  email: string
  password: string
}

const fuelLabels: Record<AdminVehicleRecord['carburant'], string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  hybride: 'Hybride',
  electrique: 'Électrique',
  gpl: 'GPL',
}

const transmissionLabels: Record<AdminVehicleRecord['boite'], CarListing['transmission']> = {
  manuelle: 'Manuelle',
  automatique: 'Automatique',
}

function mapAdminVehicle(vehicle: AdminVehicleRecord): AgencyVehicle {
  const image = vehicle.image
    ? /^https?:\/\//i.test(vehicle.image)
      ? vehicle.image
      : `${API_ORIGIN}/storage/${vehicle.image.replace(/^\/+/, '')}`
    : ''

  return {
    id: -vehicle.id,
    brand: vehicle.marque,
    name: vehicle.modele,
    registration: vehicle.immatriculation,
    category: vehicle.categorie,
    image,
    price: Number(vehicle.prix_jour),
    priceHour: Number(vehicle.prix_heure),
    seats: vehicle.places,
    transmission: transmissionLabels[vehicle.boite],
    fuel: fuelLabels[vehicle.carburant],
    status: vehicle.statut === 'active'
      ? vehicle.active_rentals_count ? 'En location' : 'Disponible'
      : vehicle.statut === 'maintenance' ? 'Entretien' : 'Hors service',
    isNew: true,
  }
}

function mapAdminOffer(offer: AdminOfferRecord) {
  const vehicleIds = offer.voiture_ids
    ?? offer.voitures?.map((vehicle) => vehicle.id)
    ?? (offer.voiture ? [offer.voiture.id] : [])

  return {
    id: `db-offer-${offer.id}`,
    title: offer.nom,
    detail: offer.description ?? `Forfait de ${offer.duree_forfait_heures} heure(s)`,
    price: Number(offer.prix_forfait),
    durationHours: offer.duree_forfait_heures,
    minDurationHours: offer.duree_minimum_heures,
    vehicleIds: vehicleIds.map((id) => -id),
    enabled: offer.actif,
    uses: offer.reservations_count ?? 0,
  }
}

const reservationStatuses: Record<AdminReservationRecord['statut'], ReservationStatus> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}

function mapAdminReservation(reservation: AdminReservationRecord): AdminReservation {
  const paidRentalAmount = reservation.paiements
    .filter((item) => item.type === 'location')
    .reduce((total, item) => total + (item.statut === 'paye' ? Number(item.montant) : item.statut === 'rembourse' ? -Number(item.montant) : 0), 0)
  const payment = paidRentalAmount >= Number(reservation.total_prix)
    ? 'Payé'
    : paidRentalAmount > 0
      ? 'Partiellement payé'
      : reservation.paiements.some((item) => item.statut === 'rembourse')
        ? 'Remboursé'
        : 'En attente'

  return {
    id: `YD-${new Date(reservation.date_debut).getFullYear()}-${String(reservation.id).padStart(3, '0')}`,
    recordId: reservation.id,
    createdAt: reservation.created_at,
    clientId: `db-client-${reservation.client_id}`,
    customer: reservation.client.nom,
    email: reservation.client.email,
    phone: reservation.client.telephone,
    licenseNumber: reservation.client.numero_permis ?? '',
    carId: -reservation.voiture_id,
    start: reservation.date_debut,
    end: reservation.date_fin,
    amount: Number(reservation.total_prix),
    vehicleDeposit: Number(reservation.caution_appliquee),
    departureMileage: reservation.km_depart,
    returnMileage: reservation.retour?.km_retour ?? null,
    returnFuel: reservation.retour?.carburant_retour ?? null,
    returnDamage: reservation.retour?.degats ?? null,
    returnFees: Number(reservation.retour?.frais_supplementaires ?? 0),
    payments: reservation.paiements.map((item) => ({
      type: item.type,
      amount: Number(item.montant),
      method: item.methode,
      status: item.statut,
    })),
    offerTitle: reservation.bon_plan_nom_applique,
    offerId: reservation.bon_plan_id ? `db-offer-${reservation.bon_plan_id}` : null,
    status: reservationStatuses[reservation.statut],
    payment,
  }
}

function getDatabaseId(value: number | string, prefix: string): number {
  const rawValue = String(value)
  const id = Number(rawValue.startsWith(prefix) ? rawValue.slice(prefix.length) : Math.abs(Number(rawValue)))
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Cet élément doit être enregistré dans la base avant de pouvoir continuer.')
  }
  return id
}

function toApiDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) throw new Error('Choisissez une date et une heure valides.')
  return parsed.toISOString()
}

function mapAdminClient(client: AdminClientRecord): AgencyClient {
  return {
    id: `db-client-${client.id}`,
    name: client.nom,
    email: client.email,
    phone: client.telephone,
    licenseNumber: client.numero_permis ?? '',
    birthDate: client.date_naissance ?? '',
    bookings: client.reservations_count ?? 0,
    since: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(client.created_at)),
    state: 'Actif',
  }
}

export async function getAdminVehicles(): Promise<AgencyVehicle[]> {
  const { data } = await api.get<{ vehicles: AdminVehicleRecord[] }>('/admin/vehicles')
  return data.vehicles.map(mapAdminVehicle)
}

export async function createAdminVehicle(vehicle: AdminVehicleInput): Promise<AgencyVehicle> {
  const fuelValues: Record<string, AdminVehicleRecord['carburant']> = {
    Essence: 'essence',
    Diesel: 'diesel',
    Hybride: 'hybride',
    'Électrique': 'electrique',
    GPL: 'gpl',
  }
  const transmissionValues: Record<CarListing['transmission'], AdminVehicleRecord['boite']> = {
    Manuelle: 'manuelle',
    Automatique: 'automatique',
  }
  const payload = new FormData()
  payload.set('marque', vehicle.brand)
  payload.set('modele', vehicle.name)
  payload.set('immatriculation', vehicle.registration)
  payload.set('categorie', vehicle.category)
  payload.set('places', String(vehicle.seats))
  payload.set('carburant', fuelValues[vehicle.fuel])
  payload.set('boite', transmissionValues[vehicle.transmission])
  payload.set('prix_heure', String(vehicle.priceHour))
  payload.set('prix_jour', String(vehicle.price))
  payload.set('caution', String(vehicle.deposit))
  payload.set('km_actuel', String(vehicle.mileage))
  if (vehicle.imageFile) payload.set('image', vehicle.imageFile)
  const { data } = await api.post<{ vehicle: AdminVehicleRecord }>('/admin/vehicles', payload)

  return mapAdminVehicle(data.vehicle)
}

export async function getPublicCatalog(): Promise<{ vehicles: AgencyVehicle[]; offers: ReturnType<typeof mapAdminOffer>[] }> {
  const { data } = await api.get<{ vehicles: AdminVehicleRecord[]; offers: AdminOfferRecord[] }>('/catalog')
  return {
    vehicles: data.vehicles.map(mapAdminVehicle),
    offers: data.offers.map(mapAdminOffer),
  }
}

export async function getAdminOffers(): Promise<ReturnType<typeof mapAdminOffer>[]> {
  const { data } = await api.get<{ offers: AdminOfferRecord[] }>('/admin/offers')
  return data.offers.map(mapAdminOffer)
}

export async function createAdminOffer(offer: AdminOfferInput) {
  const payload = {
    nom: offer.title,
    description: offer.detail,
    duree_forfait_heures: offer.durationHours,
    duree_minimum_heures: offer.minDurationHours,
    prix_forfait: offer.price,
    voiture_ids: offer.vehicleIds.map((id) => Math.abs(id)),
  }
  const { data } = await api.post<{ offer: AdminOfferRecord }>('/admin/offers', payload)
  return mapAdminOffer(data.offer)
}

export async function updateAdminOfferStatus(offerId: string, enabled: boolean) {
  const id = getDatabaseId(offerId, 'db-offer-')
  const { data } = await api.patch<{ offer: AdminOfferRecord }>(`/admin/offers/${id}/status`, { actif: enabled })
  return mapAdminOffer(data.offer)
}

export async function updateAdminVehicleStatus(vehicleId: number, status: AgencyVehicle['status']) {
  const statusValues: Record<AgencyVehicle['status'], AdminVehicleRecord['statut']> = {
    Disponible: 'active',
    'En location': 'active',
    Entretien: 'maintenance',
    'Hors service': 'hors_service',
  }
  const id = Math.abs(vehicleId)
  const { data } = await api.patch<{ vehicle: AdminVehicleRecord }>(`/admin/vehicles/${id}/status`, {
    statut: statusValues[status],
  })
  return mapAdminVehicle(data.vehicle) 
}

export async function getAdminClients(): Promise<AgencyClient[]> {
  const { data } = await api.get<{ clients: AdminClientRecord[] }>('/admin/clients')
  return data.clients.map(mapAdminClient)
}

export async function createAdminClient(client: AdminClientInput): Promise<AgencyClient> {
  const { data } = await api.post<{ client: AdminClientRecord }>('/admin/clients', {
    nom: client.name,
    email: client.email,
    telephone: client.phone,
    numero_permis: client.licenseNumber,
    date_naissance: client.birthDate || null,
  })

  return mapAdminClient(data.client)
}

export async function getAdminReservations(): Promise<AdminReservation[]> {
  const { data } = await api.get<{ reservations: AdminReservationRecord[] }>('/admin/reservations')
  return data.reservations.map(mapAdminReservation)
}

export async function createAdminReservation(reservation: AdminReservation): Promise<AdminReservation> {
  const payload = {
    client_id: getDatabaseId(reservation.clientId ?? '', 'db-client-'),
    voiture_id: Math.abs(reservation.carId),
    bon_plan_id: reservation.offerId ? getDatabaseId(reservation.offerId, 'db-offer-') : null,
    date_debut: toApiDateTime(reservation.start),
    date_fin: toApiDateTime(reservation.end),
    numero_permis: reservation.licenseNumber,
  }
  const { data } = await api.post<{ reservation: AdminReservationRecord }>('/admin/reservations', payload)
  return mapAdminReservation(data.reservation)
}

export async function updateAdminReservationStatus(reservation: AdminReservation, status: ReservationStatus) {
  const statusValues: Record<ReservationStatus, AdminReservationRecord['statut']> = {
    'En attente': 'en_attente',
    Confirmée: 'confirmee',
    'En cours': 'en_cours',
    Terminée: 'terminee',
    Annulée: 'annulee',
  }
  const { data } = await api.patch<{ reservation: AdminReservationRecord }>(
    `/admin/reservations/${reservation.recordId ?? getDatabaseId(reservation.id, 'reservation-')}/status`,
    { statut: statusValues[status] },
  )
  return mapAdminReservation(data.reservation)
}

export async function createPublicReservation(input: {
  vehicleId: number
  start: string
  end: string
  licenseNumber: string
  offerId: string | null
}): Promise<AdminReservation> {
  const { data } = await api.post<{ reservation: AdminReservationRecord }>('/reservations', {
    voiture_id: Math.abs(input.vehicleId),
    date_debut: toApiDateTime(input.start),
    date_fin: toApiDateTime(input.end),
    numero_permis: input.licenseNumber,
    bon_plan_id: input.offerId ? getDatabaseId(input.offerId, 'db-offer-') : null,
  })
  return mapAdminReservation(data.reservation)
}

export async function recordAdminPayment(input: {
  reservation: AdminReservation
  type: 'location' | 'caution'
  amount: number
  method: 'cb' | 'espece' | 'mobile'
}): Promise<void> {
  if (!input.reservation.recordId) throw new Error('Cette réservation ne possède pas d’identifiant de base de données.')
  await api.post(`/admin/reservations/${input.reservation.recordId}/payments`, {
    type: input.type,
    montant: input.amount,
    methode: input.method,
  })
}

export async function recordAdminReturn(input: {
  reservation: AdminReservation
  mileage: number
  fuel: 'vide' | 'quart' | 'moitie' | 'trois_quarts' | 'plein'
  damage: string
  extraFees: number
}): Promise<void> {
  if (!input.reservation.recordId) throw new Error('Cette réservation ne possède pas d’identifiant de base de données.')
  await api.post(`/admin/reservations/${input.reservation.recordId}/return`, {
    km_retour: input.mileage,
    carburant_retour: input.fuel,
    degats: input.damage || null,
    frais_supplementaires: input.extraFees,
  })
}

export async function registerUser(
  credentials: Credentials & { name: string; telephone: string },
): Promise<void> {
  await api.get('/csrf-cookie')
  await api.post('/register', credentials)
}

export async function loginUser(credentials: Credentials): Promise<AuthUser> {
  await api.get('/csrf-cookie')
  const { data } = await api.post<{ user: AuthUser }>('/login', credentials)
  return data.user
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{ user: AuthUser }>('/user')
    return data.user
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null
    }

    throw error 
  }
}

export async function updateUserProfile(profile: ProfileUpdate): Promise<ProfileUpdateResult> {
  await api.get('/csrf-cookie')
  const { data } = await api.patch<ProfileUpdateResult>('/profile', profile)
  return data
}

export async function logoutUser(): Promise<void> {
  await api.get('/csrf-cookie')
  await api.post('/logout')
}

export async function getClientReservations(): Promise<ClientReservation[]> {
  const { data } = await api.get<{ reservations: Array<{
    id: number
    created_at: string
    date_debut: string
    date_fin: string
    statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee'
    total_prix: string | number
    caution_appliquee: string | number
    bon_plan_nom_applique: string | null
    voiture: { marque: string; modele: string; immatriculation: string; image: string | null }
    paiements: Array<{ type: string; montant: string | number; statut: string }>
    retour: {
      km_retour: number
      carburant_retour: string
      degats: string | null
      frais_supplementaires: string | number
    } | null
  }> }>('/my/reservations')
  const statuses: Record<'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee', ClientReservation['status']> = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  }

  return data.reservations.map((reservation) => ({
    id: reservation.id,
    createdAt: reservation.created_at,
    start: reservation.date_debut,
    end: reservation.date_fin,
    status: statuses[reservation.statut],
    total: Number(reservation.total_prix),
    deposit: Number(reservation.caution_appliquee),
    vehicle: {
      name: `${reservation.voiture.marque} ${reservation.voiture.modele}`,
      registration: reservation.voiture.immatriculation,
      image: reservation.voiture.image
        ? /^https?:\/\//i.test(reservation.voiture.image)
          ? reservation.voiture.image
          : `${API_ORIGIN}/storage/${reservation.voiture.image.replace(/^\/+/, '')}`
        : null,
    },
    offerName: reservation.bon_plan_nom_applique,
    payments: reservation.paiements.map((payment) => ({
      type: payment.type,
      amount: Number(payment.montant),
      status: payment.statut,
    })),
    returnDetails: reservation.retour ? {
      mileage: reservation.retour.km_retour,
      fuel: reservation.retour.carburant_retour,
      damage: reservation.retour.degats,
      extraFees: Number(reservation.retour.frais_supplementaires),
    } : null,
  }))
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    return 'Une erreur inattendue est survenue. Réessayez.'
  }

  if (!error.response) {
    return 'Le serveur est injoignable. Vérifiez que le backend Laravel est démarré.'
  }

  const validationMessage = Object.values(error.response.data?.errors ?? {})[0]?.[0]
  return validationMessage ?? error.response.data?.message ?? 'La requête a échoué. Réessayez.'
}

export default api
