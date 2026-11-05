export type ReservationStatus = 'Confirmée' | 'En attente' | 'En cours' | 'Terminée' | 'Annulée'

export type AdminReservation = {
  id: string
  recordId?: number
  createdAt?: string
  clientId?: string
  customer: string
  email: string
  phone: string
  licenseNumber?: string
  carId: number
  start: string
  end: string
  amount: number
  offerTitle?: string | null
  offerId?: string | null
  vehicleDeposit?: number
  departureMileage?: number | null
  returnMileage?: number | null
  returnFuel?: string | null
  returnDamage?: string | null
  returnFees?: number
  payments?: Array<{ type: string; amount: number; method: string; status: string }>
  status: ReservationStatus
  payment: 'Payé' | 'Partiellement payé' | 'En attente' | 'Remboursé'
}

export const formatAdminPrice = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`

export const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(new Date(date))

export function getCollectedRentalRevenue(reservations: AdminReservation[]): number {
  return reservations.reduce((total, reservation) => total + (reservation.payments ?? [])
    .filter((payment) => payment.type === 'location' && payment.status === 'paye')
    .reduce((paid, payment) => paid + payment.amount, 0), 0)
}

export function isAdminReservationArray(value: unknown): value is AdminReservation[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const reservation = item as Record<string, unknown>
    return typeof reservation.id === 'string'
      && typeof reservation.customer === 'string'
      && typeof reservation.email === 'string'
      && typeof reservation.phone === 'string'
      && typeof reservation.carId === 'number'
      && typeof reservation.start === 'string'
      && typeof reservation.end === 'string'
      && typeof reservation.amount === 'number'
      && Number.isFinite(reservation.amount)
      && ['En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée'].includes(String(reservation.status))
      && ['Payé', 'Partiellement payé', 'En attente', 'Remboursé'].includes(String(reservation.payment))
  })
}
