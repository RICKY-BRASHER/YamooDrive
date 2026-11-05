import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  UsersRound,
} from 'lucide-react'
import type { AdminReservation } from './adminData'
import { formatAdminPrice, formatDateTime, getCollectedRentalRevenue } from './adminData'
import { getVehicle, type AgencyClient, type AgencyVehicle } from './agencyData'

type AdminDashboardProps = {
  adminName: string
  reservations: AdminReservation[]
  clients: AgencyClient[]
  vehicles: AgencyVehicle[]
  onNavigate: (page: 'reservations' | 'fleet') => void
}

function AdminDashboard({ adminName, reservations, clients, vehicles, onNavigate }: AdminDashboardProps) {
  const upcoming = reservations.filter((item) => item.status === 'Confirmée' || item.status === 'En attente').slice(0, 4)
  const availableCount = vehicles.filter((vehicle) => vehicle.status === 'Disponible').length
  const rentedCount = vehicles.filter((vehicle) => vehicle.status === 'En location').length
  const serviceCount = vehicles.filter((vehicle) => vehicle.status === 'Entretien').length
  const outOfServiceCount = vehicles.filter((vehicle) => vehicle.status === 'Hors service').length
  const availablePercentage = vehicles.length ? Math.round((availableCount / vehicles.length) * 100) : 0
  const rentedPercentage = vehicles.length ? (rentedCount / vehicles.length) * 100 : 0
  const servicePercentage = vehicles.length ? (serviceCount / vehicles.length) * 100 : 0
  const rentedDegrees = availablePercentage * 3.6
  const serviceDegrees = rentedDegrees + rentedPercentage * 3.6
  const outOfServiceDegrees = serviceDegrees + servicePercentage * 3.6
  const paidRevenue = getCollectedRentalRevenue(reservations)
  const reservationStatuses = ['En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée'].map((status) => ({
    label: status,
    count: reservations.filter((reservation) => reservation.status === status).length,
  }))
  const maxStatusCount = Math.max(1, ...reservationStatuses.map((status) => status.count))

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">ESPACE AGENCE</p>
          <h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Bonjour, {adminName} 👋</h1>
          <p className="mt-2 text-sm text-[#858493]">Voici ce qui se passe dans votre agence aujourd’hui.</p>
        </div>
        <button type="button" onClick={() => onNavigate('reservations')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282342] px-4 py-3 text-sm font-semibold text-[#f3dfa9] shadow-sm transition hover:bg-[#393158]">
          <CalendarDays size={17} /> Voir les réservations
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CircleDollarSign} title="Revenus encaissés" value={formatAdminPrice(paidRevenue)} change="Enregistré" detail="réservations payées" positive />
        <MetricCard icon={CalendarDays} title="Réservations" value={`${reservations.length}`} change="En base" detail="dans cet espace agence" positive />
        <MetricCard icon={CarFront} title="Véhicules disponibles" value={`${availableCount} / ${vehicles.length}`} change={`${availablePercentage} %`} detail="de la flotte" />
        <MetricCard icon={UsersRound} title="Clients" value={`${clients.length}`} change="En base" detail="dans le répertoire" positive />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-[#eeebf1] bg-white p-5 shadow-[0_8px_30px_rgba(34,33,63,0.035)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div><h2 className="font-[Manrope] text-base font-bold text-[#292644]">Activité des réservations</h2><p className="mt-1 text-xs text-[#8d8a99]">Répartition par statut · {reservations.length} réservation(s)</p></div>
          </div>
          <div role="img" aria-label={reservationStatuses.map((status) => `${status.label} : ${status.count}`).join(', ')} className="grid h-56 grid-cols-5 items-end gap-3 border-b border-[#eeeaf1] px-2">
            {reservationStatuses.map(({ label, count }) => (
              <div key={label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-semibold text-[#777485]">{count}</span>
                <div className="w-full max-w-12 rounded-t-lg bg-[#8975aa]" style={{ height: `${count ? Math.max(8, (count / maxStatusCount) * 78) : 2}%` }} />
                <span className="mb-2 w-full truncate text-center text-[9px] text-[#aaa7b2]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#eeebf1] bg-white p-5 shadow-[0_8px_30px_rgba(34,33,63,0.035)] sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-[Manrope] text-base font-bold text-[#292644]">État de la flotte</h2><p className="mt-1 text-xs text-[#8d8a99]">Disponibilité aujourd’hui</p></div><button type="button" onClick={() => onNavigate('fleet')} className="text-[#75618f] hover:text-[#282342]" aria-label="Voir le parc automobile"><ArrowUpRight size={18} /></button></div>
          <div className="flex items-center gap-5">
            <div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#796693 0deg ${rentedDegrees}deg, #e8c879 ${rentedDegrees}deg ${serviceDegrees}deg, #d98b86 ${serviceDegrees}deg ${outOfServiceDegrees}deg, #e9e6ed ${outOfServiceDegrees}deg 360deg)` }}>
              <div className="grid size-[94px] place-items-center rounded-full bg-white"><span className="text-center"><strong className="block font-[Manrope] text-2xl text-[#292644]">{availablePercentage}%</strong><small className="text-[10px] text-[#8d8a99]">disponible</small></span></div>
            </div>
            <div className="min-w-0 flex-1 space-y-3 text-xs">
              <Legend color="bg-[#796693]" label="Disponibles" value={`${availableCount} véhicule(s)`} />
              <Legend color="bg-[#e8c879]" label="En location" value={`${rentedCount} véhicule(s)`} />
              <Legend color="bg-[#e9e6ed]" label="En entretien" value={`${serviceCount} véhicule(s)`} />
              <Legend color="bg-[#d98b86]" label="Hors service" value={`${outOfServiceCount} véhicule(s)`} />
            </div>
          </div>
          <button type="button" onClick={() => onNavigate('fleet')} className="mt-6 flex w-full items-center justify-between rounded-xl bg-[#f7f5f9] px-4 py-3 text-xs font-semibold text-[#51476c] transition hover:bg-[#f0edf5]">
            Gérer les véhicules <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#eeebf1] bg-white shadow-[0_8px_30px_rgba(34,33,63,0.035)]">
        <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <div><h2 className="font-[Manrope] text-base font-bold text-[#292644]">Prochaines réservations</h2><p className="mt-1 text-xs text-[#8d8a99]">Les départs et demandes à venir</p></div>
          <button type="button" onClick={() => onNavigate('reservations')} className="inline-flex items-center gap-1 text-xs font-bold text-[#6b5887] hover:text-[#292644]">Tout voir <ArrowRight size={14} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-[#faf9fb] text-[10px] uppercase tracking-wider text-[#9996a3]"><tr><th className="px-6 py-3 font-semibold">Réservation</th><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Véhicule</th><th className="px-4 py-3 font-semibold">Départ</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-[#f1eff3]">
              {upcoming.map((reservation) => {
                const car = getVehicle(vehicles, reservation.carId)
                return <tr key={reservation.id} className="hover:bg-[#fdfcfe]"><td className="px-6 py-4 font-bold text-[#39364f]">{reservation.id}</td><td className="px-4 py-4 text-[#625f70]">{reservation.customer}</td><td className="px-4 py-4 text-[#625f70]">{car.brand} {car.name}</td><td className="px-4 py-4 text-[#625f70]">{formatDateTime(reservation.start)}</td><td className="px-4 py-4"><StatusPill status={reservation.status} /></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => onNavigate('reservations')} className="text-[#9793a1]" aria-label={`Voir la réservation ${reservation.id}`}><MoreHorizontal size={17} /></button></td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, title, value, change, detail, positive = false }: { icon: typeof CircleDollarSign; title: string; value: string; change: string; detail: string; positive?: boolean }) {
  return (
    <article className="rounded-2xl border border-[#eeebf1] bg-white p-5 shadow-[0_8px_30px_rgba(34,33,63,0.035)]">
      <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#f3f0f7] text-[#6d5b8a]"><Icon size={19} /></span><button type="button" className="text-[#aaa7b2]" aria-label={`${title} options`}><MoreHorizontal size={18} /></button></div>
      <p className="mt-4 text-xs font-medium text-[#898696]">{title}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2"><strong className="font-[Manrope] text-2xl font-bold tracking-tight text-[#292644]">{value}</strong><span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${positive ? 'text-emerald-700' : 'text-[#75618f]'}`}>{positive ? <ArrowUpRight size={12} /> : <Clock3 size={11} />}{change}</span></div>
      <p className="mt-1 text-[10px] text-[#aaa7b2]">{detail}</p>
    </article>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-[#777485]"><i className={`size-2 rounded-full ${color}`} />{label}</span><strong className="text-[#39364f]">{value}</strong></div>
}

export function StatusPill({ status }: { status: AdminReservation['status'] }) {
  const styles: Record<AdminReservation['status'], string> = {
    Confirmée: 'bg-emerald-50 text-emerald-700',
    'En attente': 'bg-amber-50 text-amber-700',
    'En cours': 'bg-sky-50 text-sky-700',
    Terminée: 'bg-slate-100 text-slate-600',
    Annulée: 'bg-rose-50 text-rose-700',
  }
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}><i className="size-1.5 rounded-full bg-current" />{status}</span>
}

export default AdminDashboard
