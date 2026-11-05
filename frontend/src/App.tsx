import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './layout/AdminRoute'
import AdminConsole from './layout/AdminConsole'
import YamooCatalog from './layout/YamooCatalog'
import ClientsRoutePage from './pages/admin/ClientsRoutePage'
import DashboardRoutePage from './pages/admin/DashboardRoutePage'
import FleetRoutePage from './pages/admin/FleetRoutePage'
import OffersRoutePage from './pages/admin/OffersRoutePage'
import ReservationsRoutePage from './pages/admin/ReservationsRoutePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<YamooCatalog />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminConsole />}>
            <Route index element={<DashboardRoutePage />} />
            <Route path="reservations" element={<ReservationsRoutePage />} />
            <Route path="fleet" element={<FleetRoutePage />} />
            <Route path="clients" element={<ClientsRoutePage />} />
            <Route path="offers" element={<OffersRoutePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
