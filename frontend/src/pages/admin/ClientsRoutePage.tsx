import ClientsPage from '../../components/admin/ClientsPage'
import { useAdminConsole } from './useAdminConsole'

function ClientsRoutePage() {
  const { clients, onClientsChange } = useAdminConsole()
  return <ClientsPage clients={clients} onClientsChange={onClientsChange} />
}

export default ClientsRoutePage
