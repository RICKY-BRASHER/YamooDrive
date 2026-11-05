import { useCallback, useEffect, useState } from 'react'
import { Bell, ChevronDown, Search, Wifi, WifiOff } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import AdminSidebar, { type AdminPage } from '../components/admin/AdminSidebar'
import { isAdminReservationArray } from '../components/admin/adminData'
import type { AdminReservation } from '../components/admin/adminData'
import {
  isAgencyClientArray,
  isAgencyOfferArray,
  isAgencyVehicleArray,
} from '../components/admin/agencyData'
import type { AgencyClient, AgencyOffer, AgencyVehicle } from '../components/admin/agencyData'
import { usePersistentState } from '../components/admin/usePersistentState'
import type { AdminConsoleContext } from '../pages/admin/useAdminConsole'
import {
  createAdminReservation,
  getAdminClients,
  getAdminOffers,
  getAdminReservations,
  getAdminVehicles,
  getApiErrorMessage,
  logoutUser,
  recordAdminPayment,
  recordAdminReturn,
  updateAdminReservationStatus,
  type AuthUser,
} from '../services/api'
import { subscribeToAdminActivity, type AdminActivity } from '../services/realtime'

const pageTitles: Record<AdminPage, string> = {
  dashboard: 'Vue d’ensemble',
  reservations: 'Réservations',
  fleet: 'Parc automobile',
  clients: 'Clients',
  offers: 'Bons plans',
  settings: 'Paramètres',
}

function AdminConsole() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user: authenticatedUser } = useOutletContext<{ user: AuthUser }>()
  const [user, setUser] = useState(authenticatedUser)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activityNotice, setActivityNotice] = useState('')
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [unreadActivities, setUnreadActivities] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [isRealtimeConnected, setRealtimeConnected] = useState(false)
  const adminInitials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
  const currentPage: AdminPage = pathname === '/admin/reservations'
    ? 'reservations'
    : pathname === '/admin/fleet'
      ? 'fleet'
      : pathname === '/admin/clients'
        ? 'clients'
        : pathname === '/admin/offers'
          ? 'offers'
          : pathname === '/admin/settings'
            ? 'settings'
          : 'dashboard'
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  const { value: reservations, save: saveReservations, update: updateReservations, error: reservationsError } = usePersistentState<AdminReservation[]>('yamoo.agency.v2.reservations', [], isAdminReservationArray)
  const { value: clients, save: saveClients, error: clientsError } = usePersistentState<AgencyClient[]>('yamoo.agency.v2.clients', [], isAgencyClientArray)
  const { value: vehicles, save: saveVehicles, error: vehiclesError } = usePersistentState<AgencyVehicle[]>('yamoo.agency.v2.vehicles', [], isAgencyVehicleArray)
  const { value: offers, save: saveOffers, error: offersError } = usePersistentState<AgencyOffer[]>('yamoo.agency.v2.offers', [], isAgencyOfferArray)
  const storageErrors = [reservationsError, clientsError, vehiclesError, offersError, apiError].filter(Boolean)

  const refreshReservations = useCallback(async () => {
    saveReservations(await getAdminReservations())
  }, [saveReservations])

  const refreshAdminData = useCallback(async () => {
    const [persistedVehicles, persistedClients, persistedOffers, persistedReservations] = await Promise.all([
      getAdminVehicles(),
      getAdminClients(),
      getAdminOffers(),
      getAdminReservations(),
    ])
    saveVehicles(persistedVehicles)
    saveClients(persistedClients)
    saveOffers(persistedOffers)
    saveReservations(persistedReservations)
    setApiError(null)
  }, [saveClients, saveOffers, saveReservations, saveVehicles])

  useEffect(() => {
    let isMounted = true

    Promise.resolve()
      .then(refreshAdminData)
      .catch((error: unknown) => {
        if (isMounted) setApiError(getApiErrorMessage(error))
      })

    return () => {
      isMounted = false
    }
  }, [refreshAdminData])

  useEffect(() => subscribeToAdminActivity((activity) => {
    setActivityNotice(activity.message)
    setActivities((current) => [activity, ...current].slice(0, 8))
    setUnreadActivities((current) => current + 1)
    refreshAdminData().catch((error: unknown) => setApiError(getApiErrorMessage(error)))
  }, setRealtimeConnected), [refreshAdminData])

  const updateReservationStatus: AdminConsoleContext['onUpdateReservationStatus'] = async (id, status) => {
    const reservation = reservations.find((item) => item.id === id)
    if (!reservation) return
    const updatedReservation = await updateAdminReservationStatus(reservation, status)
    updateReservations((current) => current.map((item) => item.id === id ? updatedReservation : item))
  }

  const createReservation: AdminConsoleContext['onCreateReservation'] = async (reservation) => {
    const savedReservation = await createAdminReservation(reservation)
    updateReservations((current) => [savedReservation, ...current])
  }

  const recordPayment: AdminConsoleContext['onRecordPayment'] = async (reservation, type, amount, method) => {
    await recordAdminPayment({ reservation, type, amount, method })
  }

  const recordReturn: AdminConsoleContext['onRecordReturn'] = async (reservation, mileage, fuel, damage, extraFees) => {
    await recordAdminReturn({ reservation, mileage, fuel, damage, extraFees })
  }

  const logout = async () => {
    try {
      await logoutUser()
      navigate('/', { replace: true })
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    }
  }

  const outletContext: AdminConsoleContext = {
    user,
    reservations,
    clients,
    vehicles,
    offers,
    onProfileUpdated: setUser,
    onUpdateReservationStatus: updateReservationStatus,
    onCreateReservation: createReservation,
    onRecordPayment: recordPayment,
    onRecordReturn: recordReturn,
    onRefreshReservations: refreshReservations,
    onVehiclesChange: saveVehicles,
    onClientsChange: saveClients,
    onOffersChange: saveOffers,
  }

  return (
    <div className="min-h-screen bg-[#f7f6f8] text-[#292644]">
      <AdminSidebar
        currentPage={currentPage}
        pendingCount={reservations.filter((item) => item.status === 'En attente').length}
        adminName={user.name}
        adminInitials={adminInitials}
        onLogout={logout}
      />
      <div className="min-w-0 lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#ebe8ef] bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><span className="hidden text-[10px] font-medium text-[#a19eaa] sm:inline">AGENCE</span><span className="hidden text-[#d3cfdb] sm:inline">/</span><span className="text-sm font-semibold text-[#4c4960]">{pageTitles[currentPage]}</span></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden items-center gap-2 rounded-lg bg-[#f7f6f8] px-3 py-2 text-[#9894a2] md:flex"><Search size={15} /><span className="sr-only">Rechercher dans l’agence</span><input placeholder="Rechercher..." className="w-32 bg-transparent text-xs text-[#514e61] outline-none placeholder:text-[#aaa7b2]" /></label>
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium sm:inline-flex ${isRealtimeConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`} aria-label={isRealtimeConnected ? 'WebSocket connecté' : 'WebSocket déconnecté'}>
              {isRealtimeConnected ? <Wifi size={13} /> : <WifiOff size={13} />}{isRealtimeConnected ? 'En direct' : 'Hors ligne'}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setUnreadActivities(0)
                }}
                aria-label={`Notifications${unreadActivities ? `, ${unreadActivities} non lues` : ''}`}
                aria-expanded={notificationsOpen}
                aria-controls="admin-notifications"
                className="relative grid size-9 place-items-center rounded-lg text-[#777485] hover:bg-[#f6f4f8]"
              >
                <Bell size={18} />
                {unreadActivities > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{unreadActivities > 9 ? '9+' : unreadActivities}</span>}
              </button>
              {notificationsOpen && (
                <section id="admin-notifications" aria-label="Activité récente" className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-xl border border-[#ebe8ef] bg-white shadow-xl">
                  <h2 className="border-b border-[#f1eff3] px-4 py-3 text-xs font-bold text-[#292644]">Activité récente</h2>
                  {activities.length ? (
                    <ul className="max-h-80 divide-y divide-[#f1eff3] overflow-y-auto">
                      {activities.map((activity) => (
                        <li key={`${activity.createdAt}-${activity.activity}-${activity.recordId}`} className="px-4 py-3">
                          <p className="text-xs text-[#514e61]">{activity.message}</p>
                          <time dateTime={activity.createdAt} className="mt-1 block text-[10px] text-[#9996a3]">
                            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(activity.createdAt))}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="px-4 py-5 text-xs text-[#898696]">Aucune activité en direct pour le moment.</p>}
                </section>
              )}
            </div>
            <Link to="/admin/settings" className="flex items-center gap-2 rounded-lg p-1.5 no-underline hover:bg-[#f6f4f8]" aria-label={`Paramètres du profil de ${user.name}`}><span className="grid size-8 place-items-center rounded-full bg-[#292644] text-[10px] font-bold text-[#f3dfa9]">{adminInitials}</span><span className="hidden text-left sm:block"><strong className="block text-[11px] text-[#514e61]">{user.name}</strong><small className="text-[9px] text-[#9996a3]">Paramètres du compte</small></span><ChevronDown size={14} className="hidden text-[#9996a3] sm:block" /></Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] p-5 sm:p-8 lg:p-9">
          {storageErrors.map((error) => <p key={error} role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{error}</p>)}
          {activityNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{activityNotice}</p>}
          <Outlet context={outletContext} />
          <p className="mt-8 text-center text-[10px] text-[#aaa7b2]">Yamoo Drive · Espace agence · Données synchronisées avec le serveur</p>
        </main>
      </div>
    </div>
  )
}

export default AdminConsole
