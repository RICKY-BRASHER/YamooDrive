import ReservationsPage from '../../components/admin/ReservationsPage'
import { useAdminConsole } from './useAdminConsole'

function ReservationsRoutePage() {
  const {
    reservations,
    clients,
    vehicles,
    offers,
    onUpdateReservationStatus,
    onCreateReservation,
    onRecordPayment,
    onRecordReturn,
    onRefreshReservations,
  } = useAdminConsole()

  return (
    <ReservationsPage
      reservations={reservations}
      clients={clients}
      vehicles={vehicles}
      offers={offers}
      onUpdateStatus={onUpdateReservationStatus}
      onCreateReservation={onCreateReservation}
      onRecordPayment={onRecordPayment}
      onRecordReturn={onRecordReturn}
      onRefreshReservations={onRefreshReservations}
    />
  )
}

export default ReservationsRoutePage
