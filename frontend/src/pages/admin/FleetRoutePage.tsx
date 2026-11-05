import FleetPage from '../../components/admin/FleetPage'
import { useAdminConsole } from './useAdminConsole'

function FleetRoutePage() {
  const { vehicles, onVehiclesChange } = useAdminConsole()
  return <FleetPage vehicles={vehicles} onVehiclesChange={onVehiclesChange} />
}

export default FleetRoutePage
