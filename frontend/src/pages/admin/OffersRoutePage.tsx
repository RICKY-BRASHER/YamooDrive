import OffersPage from '../../components/admin/OffersPage'
import { useAdminConsole } from './useAdminConsole'

function OffersRoutePage() {
  const { offers, vehicles, onOffersChange } = useAdminConsole()
  return <OffersPage offers={offers} vehicles={vehicles} onOffersChange={onOffersChange} />
}

export default OffersRoutePage
