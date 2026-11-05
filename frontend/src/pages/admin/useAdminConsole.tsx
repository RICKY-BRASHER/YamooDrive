import { useOutletContext } from 'react-router-dom'
import type { AdminReservation, ReservationStatus } from '../../components/admin/adminData'
import type { AgencyClient, AgencyOffer, AgencyVehicle } from '../../components/admin/agencyData'
import type { AuthUser } from '../../services/api'

export type AdminConsoleContext = {
  user: AuthUser
  reservations: AdminReservation[]
  clients: AgencyClient[]
  vehicles: AgencyVehicle[]
  offers: AgencyOffer[]
  onProfileUpdated: (user: AuthUser) => void
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>
  onCreateReservation: (reservation: AdminReservation) => Promise<void>
  onRecordPayment: (reservation: AdminReservation, type: 'location' | 'caution', amount: number, method: 'cb' | 'espece' | 'mobile') => Promise<void>
  onRecordReturn: (reservation: AdminReservation, mileage: number, fuel: 'vide' | 'quart' | 'moitie' | 'trois_quarts' | 'plein', damage: string, extraFees: number) => Promise<void>
  onRefreshReservations: () => Promise<void>
  onVehiclesChange: (vehicles: AgencyVehicle[]) => void
  onClientsChange: (clients: AgencyClient[]) => void
  onOffersChange: (offers: AgencyOffer[]) => void
}

export function useAdminConsole() {
  return useOutletContext<AdminConsoleContext>()
}
