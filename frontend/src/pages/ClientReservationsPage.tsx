import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CarFront, Check, Clock3, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import type { ClientReservation } from '../services/api'
import { formatAdminPrice } from '../components/admin/adminData'
import { getApiErrorMessage, getClientReservations, logoutUser, type AuthUser } from '../services/api'

const stages = ['En attente', 'Confirmée', 'En cours', 'Terminée'] as const

const statusStyles: Record<ClientReservation['status'], string> = {
  'En attente': 'bg-amber-50 text-amber-800 ring-amber-200',
  Confirmée: 'bg-sky-50 text-sky-800 ring-sky-200',
  'En cours': 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  Terminée: 'bg-slate-100 text-slate-700 ring-slate-200',
  Annulée: 'bg-rose-50 text-rose-800 ring-rose-200',
}

function formatReservationDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function ClientReservationsPage() {
  const user = useOutletContext<AuthUser>()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<ClientReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const loadReservations = useCallback(() => {
    getClientReservations()
      .then(setReservations)
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const refresh = () => {
    setLoading(true)
    setError('')
    loadReservations()
  }

  const logout = async () => {
    setLoggingOut(true)
    try {
      await logoutUser()
      navigate('/', { replace: true })
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError))
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#20243a]">
      <header className="border-b border-[#e9e6df] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-[#20243a] no-underline">
            <span className="grid size-10 place-items-center rounded-xl bg-[#20243a] text-[#e8c879]"><CarFront size={21} /></span>
            <span className="font-[Manrope] text-lg font-extrabold tracking-tight">yamoo<span className="font-medium text-[#716e80]">drive</span><i className="text-[#9dbb59]">.</i></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#dce7c8] bg-[#f1f5e9] px-4 py-2 text-sm font-bold text-[#3d563d] sm:inline-flex">{user.name}</span>
            <button type="button" onClick={logout} disabled={loggingOut} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5de] px-3 py-2 text-xs font-semibold text-[#625f70] transition hover:bg-[#f7f6f2] disabled:opacity-60">
              <LogOut size={15} />{loggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#687257] no-underline hover:text-[#313d2e]"><ArrowLeft size={16} /> Retour au catalogue</Link>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#85945e]">Votre espace client</p>
            <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight text-[#20243a] sm:text-4xl">Mes réservations</h1>
            <p className="mt-2 text-sm text-[#747383]">Suivez vos demandes et retrouvez l’historique de vos locations.</p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e3e1da] bg-white px-4 py-3 text-sm font-semibold text-[#55536a] transition hover:bg-[#fbfaf8] disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser</button>
        </div>

        {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {loading ? (
          <p role="status" className="rounded-2xl border border-[#e9e6df] bg-white p-8 text-center text-sm text-[#777485]">Chargement de vos réservations…</p>
        ) : reservations.length === 0 ? (
          <section className="rounded-2xl border border-[#e9e6df] bg-white px-6 py-14 text-center">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#f0f3e8] text-[#657948]"><CalendarDays size={25} /></span>
            <h2 className="font-[Manrope] text-xl font-bold text-[#292644]">Pas encore de réservation</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#858493]">Quand vous réserverez un véhicule, son statut et tout son historique apparaîtront ici.</p>
            <Link to="/" className="mt-6 inline-flex rounded-xl bg-[#25243e] px-5 py-3 text-sm font-semibold text-[#f3dfa9] no-underline">Découvrir la flotte</Link>
          </section>
        ) : (
          <div className="space-y-5">
            {reservations.map((reservation) => {
              const stageIndex = stages.findIndex((stage) => stage === reservation.status)
              const paid = reservation.payments
                .filter((payment) => payment.status === 'paye' && payment.type === 'location')
                .reduce((sum, payment) => sum + payment.amount, 0)
              return (
                <article key={reservation.id} className="overflow-hidden rounded-2xl border border-[#e9e6df] bg-white shadow-[0_8px_28px_rgba(32,36,58,0.04)]">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-[#f1f0eb] sm:w-40">
                      {reservation.vehicle.image
                        ? <img src={reservation.vehicle.image} alt={reservation.vehicle.name} className="h-full w-full object-cover" />
                        : <div className="grid h-full place-items-center text-[#aaa8a0]"><CarFront size={34} /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-[Manrope] text-lg font-bold text-[#292644]">{reservation.vehicle.name}</h2>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[reservation.status]}`}>{reservation.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#858493]">Réservation YD-{new Date(reservation.start).getFullYear()}-{String(reservation.id).padStart(3, '0')} · {reservation.vehicle.registration}</p>
                      <div className="mt-4 grid gap-2 text-xs text-[#625f70] sm:grid-cols-2">
                        <p><span className="font-semibold">Départ :</span> {formatReservationDate(reservation.start)}</p>
                        <p><span className="font-semibold">Retour prévu :</span> {formatReservationDate(reservation.end)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-xl bg-[#f8f8f4] px-4 py-3 sm:min-w-36">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9996a3]">Montant location</p>
                      <p className="mt-1 text-lg font-extrabold text-[#292644]">{formatAdminPrice(reservation.total)}</p>
                      <p className="mt-1 text-[11px] text-[#858493]">Caution : {formatAdminPrice(reservation.deposit)}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#f1eff3] px-5 py-5 sm:px-6">
                    {reservation.status === 'Annulée' ? (
                      <p className="flex items-center gap-2 text-xs font-semibold text-rose-700"><Clock3 size={15} /> Cette réservation a été annulée.</p>
                    ) : (
                      <ol aria-label="Avancement de la réservation" className="grid grid-cols-4 gap-2">
                        {stages.map((stage, index) => {
                          const complete = stageIndex >= 0 && index <= stageIndex
                          return (
                            <li key={stage} className="min-w-0">
                              <span className={`mb-2 block h-1.5 rounded-full ${complete ? 'bg-[#8ea65b]' : 'bg-[#eeedf0]'}`} />
                              <span className={`flex items-center gap-1 text-[10px] font-semibold sm:text-xs ${complete ? 'text-[#4c663d]' : 'text-[#aaa7b2]'}`}>
                                {complete && <Check size={12} />}{stage}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                    <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
                      <p className="flex items-center gap-2 text-[#625f70]"><ShieldCheck size={15} className="text-[#829851]" /> Payé : <strong>{formatAdminPrice(paid)}</strong></p>
                      {reservation.offerName && <p className="text-[#625f70]">Offre appliquée : <strong>{reservation.offerName}</strong></p>}
                      {reservation.returnDetails && <p className="text-[#625f70]">Retour enregistré à {new Intl.NumberFormat('fr-FR').format(reservation.returnDetails.mileage)} km</p>}
                    </div>
                    {reservation.returnDetails?.damage && <p className="mt-3 text-xs text-[#625f70]">Note au retour : {reservation.returnDetails.damage}</p>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default ClientReservationsPage
