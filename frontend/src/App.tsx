import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './layout/AdminRoute'
import AdminConsole from './layout/AdminConsole'
import ClientRoute from './layout/ClientRoute'
import PublicHomeRoute from './layout/PublicHomeRoute'
import YamooCatalog from './layout/YamooCatalog'
import ClientReservationsPage from './pages/ClientReservationsPage'
import ClientsRoutePage from './pages/admin/ClientsRoutePage'
import DashboardRoutePage from './pages/admin/DashboardRoutePage'
import FleetRoutePage from './pages/admin/FleetRoutePage'
import OffersRoutePage from './pages/admin/OffersRoutePage'
import ReservationsRoutePage from './pages/admin/ReservationsRoutePage'
import SettingsRoutePage from './pages/admin/SettingsRoutePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicHomeRoute />}>
          <Route path="/" element={<YamooCatalog />} />
        </Route>
        <Route element={<ClientRoute />}>
          <Route path="/mes-reservations" element={<ClientReservationsPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminConsole />}>
            <Route index element={<DashboardRoutePage />} />
            <Route path="reservations" element={<ReservationsRoutePage />} />
            <Route path="fleet" element={<FleetRoutePage />} />
            <Route path="clients" element={<ClientsRoutePage />} />
            <Route path="offers" element={<OffersRoutePage />} />
            <Route path="settings" element={<SettingsRoutePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
