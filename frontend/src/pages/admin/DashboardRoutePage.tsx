import { useNavigate } from 'react-router-dom'
import AdminDashboard from '../../components/admin/AdminDashboard'
import type { AdminPage } from '../../components/admin/AdminSidebar'
import { useAdminConsole } from './useAdminConsole'

function DashboardRoutePage() {
  const { user, reservations, clients, vehicles } = useAdminConsole()
  const navigate = useNavigate()

  const handleNavigate = (page: Extract<AdminPage, 'reservations' | 'fleet'>) => {
    navigate(`/admin/${page}`)
  }

  return (
    <AdminDashboard
      adminName={user.name}
      reservations={reservations}
      clients={clients}
      vehicles={vehicles}
      onNavigate={handleNavigate}
    />
  )
}

export default DashboardRoutePage
