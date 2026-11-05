import { useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Download, Plus, Search, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { AdminReservation, ReservationStatus } from './adminData'
import { formatAdminPrice, formatDateTime, getCollectedRentalRevenue } from './adminData'
import {
  calculateOfferPrice,
  calculateRentalPrice,
  getVehicle,
  type AgencyClient,
  type AgencyOffer,
  type AgencyVehicle,
} from './agencyData'
import { getApiErrorMessage } from '../../services/api'

type ReservationsPageProps = {
  reservations: AdminReservation[]
  clients: AgencyClient[]
  vehicles: AgencyVehicle[]
  offers: AgencyOffer[]
  onUpdateStatus: (id: string, status: ReservationStatus) => Promise<void>
  onCreateReservation: (reservation: AdminReservation) => Promise<void>
  onRecordPayment: (reservation: AdminReservation, type: 'location' | 'caution', amount: number, method: 'cb' | 'espece' | 'mobile') => Promise<void>
  onRecordReturn: (reservation: AdminReservation, mileage: number, fuel: 'vide' | 'quart' | 'moitie' | 'trois_quarts' | 'plein', damage: string, extraFees: number) => Promise<void>
  onRefreshReservations: () => Promise<void>
}

const filters = ['Toutes', 'En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée'] as const
type Filter = (typeof filters)[number]
const reservationTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  'En attente': ['Confirmée', 'Annulée'],
  Confirmée: ['En cours', 'Annulée'],
  'En cours': ['Annulée'],
  Terminée: [],
  Annulée: [],
}

function ReservationsPage({ reservations, clients, vehicles, offers, onUpdateStatus, onCreateReservation, onRecordPayment, onRecordReturn, onRefreshReservations }: ReservationsPageProps) {
  const [filter, setFilter] = useState<Filter>('Toutes')
  const [search, setSearch] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null)
  const [creatingReservation, setCreatingReservation] = useState<{ start: string; end: string } | null>(null)
  const [actionError, setActionError] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    return reservations.filter((reservation) => {
      const car = getVehicle(vehicles, reservation.carId)
      const matchesStatus = filter === 'Toutes' || reservation.status === filter
      const matchesSearch = !query || [
        reservation.id,
        reservation.customer,
        car.brand,
        car.name,
      ].join(' ').toLocaleLowerCase('fr').includes(query)
      return matchesStatus && matchesSearch
    })
  }, [filter, reservations, search, vehicles])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">Gestion des locations</p><h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Réservations</h1><p className="mt-2 text-sm text-[#858493]">Suivez les demandes, les départs et les retours des véhicules.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportReservations(filtered, vehicles)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e7e3eb] bg-white px-4 py-3 text-sm font-semibold text-[#51476c] transition hover:bg-[#f8f6fa]"><Download size={16} /> Exporter la liste</button>
          <button type="button" onClick={() => {
            const start = new Date(Date.now() + 60 * 60 * 1000)
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
            setCreatingReservation({ start: localDateTimeValue(start), end: localDateTimeValue(end) })
          }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282342] px-4 py-3 text-sm font-semibold text-[#f3dfa9] transition hover:bg-[#393158]"><Plus size={16} /> Nouvelle réservation</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total affiché" value={`${reservations.length}`} note="toutes les réservations" />
        <MiniStat label="À traiter" value={`${reservations.filter((item) => item.status === 'En attente').length}`} note="en attente de confirmation" tint="amber" />
        <MiniStat label="En cours" value={`${reservations.filter((item) => item.status === 'En cours').length}`} note="véhicules actuellement loués" tint="blue" />
        <MiniStat label="Revenus encaissés" value={formatAdminPrice(getCollectedRentalRevenue(reservations))} note="hors cautions" tint="green" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#eeebf1] bg-white shadow-[0_8px_30px_rgba(34,33,63,0.035)]">
        <div className="flex flex-col gap-4 border-b border-[#f1eff3] p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === item ? 'bg-[#292644] text-white' : 'bg-[#f7f6f8] text-[#777485] hover:bg-[#efedf2]'}`}>{item}{item === 'En attente' && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-800">{reservations.filter((row) => row.status === item).length}</span>}</button>)}
          </div>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#e9e6ed] px-3 text-[#9793a1] focus-within:border-[#a998c0] sm:max-w-sm">
            <Search size={16} /><span className="sr-only">Rechercher une réservation</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, numéro ou véhicule..." className="w-full bg-transparent text-xs text-[#39364f] outline-none placeholder:text-[#aaa7b2]" />
            {search && <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch('')}><X size={14} /></button>}
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-[#faf9fb] text-[10px] uppercase tracking-wider text-[#9996a3]"><tr><th className="px-5 py-3 font-semibold">N° réservation</th><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Véhicule</th><th className="px-4 py-3 font-semibold">Départ / retour</th><th className="px-4 py-3 font-semibold">Montant</th><th className="px-4 py-3 font-semibold">Paiement</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-[#f1eff3]">
              {filtered.map((reservation) => {
                const car = getVehicle(vehicles, reservation.carId)
                return (
                  <tr key={reservation.id} className="hover:bg-[#fdfcfe]">
                    <td className="px-5 py-4 font-bold text-[#39364f]">{reservation.id}{reservation.createdAt && <small className="mt-1 block font-normal text-[#aaa7b2]">Créée le {formatDateTime(reservation.createdAt)}</small>}</td>
                    <td className="px-4 py-4"><strong className="block font-semibold text-[#514e61]">{reservation.customer}</strong><small className="mt-1 block text-[#aaa7b2]">{reservation.phone}</small></td>
                    <td className="px-4 py-4 text-[#625f70]">{car.brand}<strong className="mt-1 block font-semibold">{car.name}</strong></td>
                    <td className="px-4 py-4 text-[#625f70]"><span className="whitespace-nowrap">{formatDateTime(reservation.start)}</span><small className="mt-1 block whitespace-nowrap text-[#aaa7b2]">→ {formatDateTime(reservation.end)}</small></td>
                    <td className="px-4 py-4 font-bold text-[#39364f]">{formatAdminPrice(reservation.amount)}{reservation.offerTitle && <small className="mt-1 block font-normal text-[#6b5887]">{reservation.offerTitle}</small>}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${reservation.payment === 'Payé' ? 'bg-emerald-50 text-emerald-700' : reservation.payment === 'Remboursé' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{reservation.payment}</span></td>
                    <td className="px-4 py-4"><label className="relative inline-flex items-center"><span className="sr-only">Modifier le statut de {reservation.id}</span><select value={reservation.status} disabled={reservationTransitions[reservation.status].length === 0} onChange={(event) => {
                      void onUpdateStatus(reservation.id, event.target.value as ReservationStatus)
                        .then(() => setActionError(''))
                        .catch((error: unknown) => setActionError(getApiErrorMessage(error)))
                    }} className="max-w-32 appearance-none rounded-full border-0 bg-transparent pr-5 text-[10px] font-semibold text-[#555166] outline-none disabled:opacity-70"><option value={reservation.status}>{reservation.status}</option>{reservationTransitions[reservation.status].map((status) => <option key={status} value={status}>{status}</option>)}</select>{reservationTransitions[reservation.status].length > 0 && <ChevronDown size={12} className="pointer-events-none absolute right-0 text-[#918d9b]" />}</label></td>
                    <td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedReservation(reservation)} className="whitespace-nowrap font-semibold text-[#6b5887] hover:text-[#292644]">Détails</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {actionError && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-800">{actionError}</p>}
          {filtered.length === 0 && <div className="p-12 text-center"><CalendarDays className="mx-auto text-[#c5bdcf]" size={28} /><p className="mt-3 text-sm font-semibold text-[#514e61]">Aucune réservation trouvée</p><p className="mt-1 text-xs text-[#9996a3]">Modifiez la recherche ou choisissez un autre statut.</p></div>}
        </div>
        <div className="flex items-center justify-between border-t border-[#f1eff3] px-5 py-4 text-[10px] text-[#9996a3]"><span>Affichage de {filtered.length} sur {reservations.length} réservations</span><span>Données de la base de données</span></div>
      </section>

      {selectedReservation && <ReservationDetails
        reservation={reservations.find((item) => item.id === selectedReservation.id) ?? selectedReservation}
        vehicles={vehicles}
        onClose={() => setSelectedReservation(null)}
        onRecordPayment={onRecordPayment}
        onRecordReturn={onRecordReturn}
        onRefreshReservations={onRefreshReservations}
      />}
      {creatingReservation && (
        <NewReservationForm
          initialStart={creatingReservation.start}
          initialEnd={creatingReservation.end}
          clients={clients}
          vehicles={vehicles}
          offers={offers}
          reservations={reservations}
          onClose={() => setCreatingReservation(null)}
          onCreate={async (reservation) => {
            await onCreateReservation(reservation)
            setCreatingReservation(null)
          }}
        />
      )}
    </div>
  )
}

function exportReservations(reservations: AdminReservation[], vehicles: AgencyVehicle[]) {
  const headers = ['Réservation', 'Client', 'E-mail', 'Téléphone', 'Véhicule', 'Départ', 'Retour', 'Montant', 'Paiement', 'Statut']
  const rows = reservations.map((reservation) => {
    const car = getVehicle(vehicles, reservation.carId)
    return [
      reservation.id,
      reservation.customer,
      reservation.email,
      reservation.phone,
      `${car.brand} ${car.name}`,
      reservation.start,
      reservation.end,
      reservation.amount,
      reservation.payment,
      reservation.status,
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'yamoo-reservations.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function localDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function NewReservationForm({
  initialStart,
  initialEnd,
  clients,
  vehicles,
  offers,
  reservations,
  onClose,
  onCreate,
}: {
  initialStart: string
  initialEnd: string
  clients: AgencyClient[]
  vehicles: AgencyVehicle[]
  offers: AgencyOffer[]
  reservations: AdminReservation[]
  onClose: () => void
  onCreate: (reservation: AdminReservation) => Promise<void>
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [carId, setCarId] = useState(vehicles.find((vehicle) => vehicle.status === 'Disponible')?.id ?? vehicles[0]?.id ?? 0)
  const [start, setStart] = useState(initialStart)
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('days')
  const [durationValue, setDurationValue] = useState(() => {
    const initialHours = Math.ceil((new Date(initialEnd).getTime() - new Date(initialStart).getTime()) / 3_600_000)
    return String(Math.max(1, Math.ceil(initialHours / 24)))
  })
  const [dateError, setDateError] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [offerId, setOfferId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const client = clients.find((item) => item.id === clientId)
  const vehicle = vehicles.find((item) => item.id === carId)
  const startDate = new Date(start)
  const parsedDuration = Number(durationValue)
  const durationHours = Number.isInteger(parsedDuration) && parsedDuration > 0
    ? parsedDuration * (durationUnit === 'days' ? 24 : 1)
    : 0
  const endDate = new Date(startDate.getTime() + durationHours * 3_600_000)
  const end = Number.isFinite(endDate.getTime()) ? localDateTimeValue(endDate) : ''
  const eligibleOffers = vehicle
    ? offers.filter((offer) => offer.enabled
      && offer.vehicleIds.includes(vehicle.id)
      && durationHours >= offer.minDurationHours)
      .map((offer) => ({ ...offer, total: calculateOfferPrice(vehicle, offer, durationHours) }))
    : []
  const selectedOffer = eligibleOffers.find((offer) => offer.id === offerId)
  const basePrice = vehicle && durationHours > 0 ? calculateRentalPrice(vehicle, durationHours) : 0
  const amount = selectedOffer ? Math.min(basePrice, selectedOffer.total) : basePrice
  const hasOverlap = reservations.some((reservation) => {
    if (reservation.carId !== carId || reservation.status === 'Annulée' || durationHours === 0) return false
    return new Date(reservation.start) < endDate && new Date(reservation.end) > startDate
  })
  const isVehicleUnavailable = vehicle?.status === 'Entretien' || vehicle?.status === 'Hors service' || hasOverlap

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client) {
      setDateError('Sélectionnez un client enregistré avant de créer la réservation.')
      return
    }
    const reservationLicense = client.licenseNumber || licenseNumber.trim().toLocaleUpperCase('fr')
    if (!reservationLicense) {
      setDateError('Saisissez le numéro de permis pour créer la réservation.')
      return
    }
    if (!vehicle) {
      setDateError('Ajoutez un véhicule à la flotte avant de créer une réservation.')
      return
    }
    if (durationHours === 0) {
      setDateError('Le retour doit être prévu après le départ.')
      return
    }
    if (isVehicleUnavailable) {
      setDateError('Ce véhicule est en entretien ou déjà réservé sur cette période.')
      return
    }
    setIsSubmitting(true)
    setDateError('')
    try {
      await onCreate({
      id: '',
      clientId: client.id,
      customer: client.name,
      email: client.email,
      phone: client.phone,
      licenseNumber: reservationLicense,
      carId,
      start,
      end,
      amount,
      offerTitle: selectedOffer && selectedOffer.total < basePrice ? selectedOffer.title : null,
      offerId: selectedOffer?.id ?? null,
      status: 'En attente',
      payment: 'En attente',
      })
    } catch (error) {
      setDateError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="new-reservation-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Agence · nouvelle location</p><h2 id="new-reservation-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">Créer une réservation</h2></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]"><X size={17} /></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Client enregistré<select required value={clientId} onChange={(event) => { setClientId(event.target.value); setLicenseNumber(''); setDateError('') }} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]"><option value="">Choisir un client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}</select></label>
          {client && <div className="grid gap-2 rounded-xl bg-[#faf9fb] p-3 text-xs sm:col-span-2 sm:grid-cols-3"><ContactLine label="Téléphone" value={client.phone} /><ContactLine label="E-mail" value={client.email} /><ContactLine label="N° permis" value={client.licenseNumber || 'À renseigner maintenant'} /></div>}
          {client && !client.licenseNumber && <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Numéro de permis (obligatoire pour la réservation)<input required minLength={3} maxLength={60} value={licenseNumber} onChange={(event) => { setLicenseNumber(event.target.value); setDateError('') }} placeholder="Numéro figurant sur le permis" className="mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]" /></label>}
          <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Véhicule<select required value={carId} onChange={(event) => { setCarId(Number(event.target.value)); setOfferId('') }} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]">{vehicles.map((item) => <option key={item.id} value={item.id} disabled={item.status === 'Entretien' || item.status === 'Hors service'}>{item.brand} {item.name} · {formatAdminPrice(item.price)} / jour · {formatAdminPrice(item.priceHour)} / heure{item.status === 'Entretien' ? ' · Entretien' : item.status === 'Hors service' ? ' · Hors service' : ''}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#514e61]">Départ<input required type="datetime-local" value={start} onChange={(event) => { setStart(event.target.value); setDateError(''); setOfferId('') }} className="mt-2 block w-full min-w-0 rounded-lg border border-[#e9e6ed] px-2 py-2.5 text-xs font-normal outline-none focus:border-[#a998c0]" /></label>
          <div className="text-xs font-semibold text-[#514e61]"><label htmlFor="reservation-duration-value">Durée de location</label><div className="mt-2 flex gap-2"><input id="reservation-duration-value" required type="number" min={1} max={durationUnit === 'days' ? 365 : 8760} step={1} value={durationValue} onChange={(event) => { setDurationValue(event.target.value); setDateError(''); setOfferId('') }} className="block min-w-0 flex-1 rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]" /><select aria-label="Unité de durée" value={durationUnit} onChange={(event) => { setDurationUnit(event.target.value as 'hours' | 'days'); setDateError(''); setOfferId('') }} className="rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]"><option value="hours">Heures</option><option value="days">Jours</option></select></div></div>
          <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Retour prévu<input readOnly type="datetime-local" value={end} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-[#faf9fb] px-3 py-2.5 text-xs font-normal text-[#777485]" /></label>
        </div>
        {vehicle && durationHours > 0 && (
          <section className="mt-4 rounded-xl border border-[#eeebf1] p-4">
            <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-[#898696]">Durée de location</span><strong className="text-[#39364f]">{durationHours} heure(s) · {formatAdminPrice(vehicle.priceHour)} / heure · {formatAdminPrice(vehicle.price)} / jour</strong></div>
            {eligibleOffers.length > 0 ? (
              <label className="mt-4 block text-xs font-semibold text-[#514e61]">Bon plan disponible
                <select value={offerId} onChange={(event) => setOfferId(event.target.value)} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]">
                  <option value="">Sans bon plan · {formatAdminPrice(basePrice)}</option>
                  {eligibleOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.title} · {formatAdminPrice(offer.total)}{offer.total >= basePrice ? ' (aucune économie)' : ` · économie ${formatAdminPrice(basePrice - offer.total)}`}</option>)}
                </select>
              </label>
            ) : <p className="mt-3 text-xs text-[#898696]">Aucun bon plan actif ne correspond à ce véhicule et à cette durée.</p>}
            <div className="mt-4 flex justify-between border-t border-[#f1eff3] pt-3 text-sm"><span className="font-semibold text-[#514e61]">Estimation</span><strong className="font-[Manrope] text-lg text-[#292644]">{formatAdminPrice(amount)}</strong></div>
          </section>
        )}
        {isVehicleUnavailable && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">Ce véhicule est en entretien ou déjà réservé sur cette période.</p>}
        {dateError && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{dateError}</p>}
        <p className="mb-5 mt-4 text-[10px] leading-4 text-[#9996a3]">La disponibilité et le tarif sont revérifiés par le serveur. La demande sera enregistrée en base avec le statut « En attente ».</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#e9e6ed] px-4 py-2.5 text-xs font-semibold text-[#686578]">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Créer la réservation'}</button></div>
      </form>
    </div>
  )
}

function MiniStat({ label, value, note, tint = 'purple' }: { label: string; value: string; note: string; tint?: string }) {
  const styles: Record<string, string> = { purple: 'bg-[#f3f0f7] text-[#6d5b8a]', amber: 'bg-amber-50 text-amber-700', blue: 'bg-sky-50 text-sky-700', green: 'bg-emerald-50 text-emerald-700' }
  return <article className="rounded-xl border border-[#eeebf1] bg-white p-4"><p className="text-[11px] font-medium text-[#898696]">{label}</p><strong className="mt-1 block truncate font-[Manrope] text-xl text-[#292644]">{value}</strong><span className={`mt-2 inline-flex rounded-md px-2 py-1 text-[9px] ${styles[tint]}`}>{note}</span></article>
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return <div><small className="block text-[9px] text-[#9996a3]">{label}</small><strong className="mt-1 block truncate text-[10px] text-[#514e61]">{value}</strong></div>
}

function ReservationDetails({
  reservation,
  vehicles,
  onClose,
  onRecordPayment,
  onRecordReturn,
  onRefreshReservations,
}: {
  reservation: AdminReservation
  vehicles: AgencyVehicle[]
  onClose: () => void
  onRecordPayment: ReservationsPageProps['onRecordPayment']
  onRecordReturn: ReservationsPageProps['onRecordReturn']
  onRefreshReservations: ReservationsPageProps['onRefreshReservations']
}) {
  const car = getVehicle(vehicles, reservation.carId)
  const remainingFor = (type: 'location' | 'caution') => {
    const target = type === 'location' ? reservation.amount : reservation.vehicleDeposit ?? 0
    const paid = (reservation.payments ?? [])
      .filter((payment) => payment.type === type && payment.status === 'paye')
      .reduce((total, payment) => total + payment.amount, 0)
    return Math.max(0, Math.round((target - paid) * 100) / 100)
  }
  const defaultPaymentType = remainingFor('location') > 0 ? 'location' : 'caution'
  const [paymentType, setPaymentType] = useState<'location' | 'caution'>(defaultPaymentType)
  const [paymentMethod, setPaymentMethod] = useState<'cb' | 'espece' | 'mobile'>('espece')
  const [paymentAmount, setPaymentAmount] = useState(String(remainingFor(defaultPaymentType)))
  const [returnMileage, setReturnMileage] = useState(String(reservation.departureMileage ?? 0))
  const [returnFuel, setReturnFuel] = useState<'vide' | 'quart' | 'moitie' | 'trois_quarts' | 'plein'>('plein')
  const [damage, setDamage] = useState('')
  const [extraFees, setExtraFees] = useState('0')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activePaymentType = remainingFor(paymentType) > 0
    ? paymentType
    : paymentType === 'location' ? 'caution' : 'location'
  const remainingPayment = remainingFor(activePaymentType)

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > remainingPayment) {
      setActionError('Le montant doit être positif et inférieur ou égal au solde restant.')
      return
    }

    setIsSubmitting(true)
    setActionError('')
    setActionMessage('')
    try {
      await onRecordPayment(reservation, activePaymentType, amount, paymentMethod)
      await onRefreshReservations()
      setActionMessage('Paiement enregistré.')
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setActionError('')
    setActionMessage('')
    try {
      await onRecordReturn(reservation, Number(returnMileage), returnFuel, damage, Number(extraFees))
      await onRefreshReservations()
      setActionMessage('Retour enregistré et réservation terminée.')
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="reservation-detail-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">{reservation.id}</p><h2 id="reservation-detail-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">Détail de la réservation</h2></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]">×</button></div>
        <div className="mt-5 space-y-4 rounded-xl bg-[#faf9fb] p-4 text-sm">
          <DetailLine label="Client" value={reservation.customer} /><DetailLine label="E-mail" value={reservation.email} /><DetailLine label="Téléphone" value={reservation.phone} /><DetailLine label="Permis" value={reservation.licenseNumber || 'Non renseigné'} /><DetailLine label="Véhicule" value={`${car.brand} ${car.name}`} /><DetailLine label="Départ" value={formatDateTime(reservation.start)} /><DetailLine label="Retour prévu" value={formatDateTime(reservation.end)} /><DetailLine label="Bon plan" value={reservation.offerTitle || 'Aucun'} /><DetailLine label="Montant location" value={formatAdminPrice(reservation.amount)} /><DetailLine label="Caution" value={formatAdminPrice(reservation.vehicleDeposit ?? 0)} /><DetailLine label="Paiement" value={reservation.payment} /><DetailLine label="Statut" value={reservation.status} />
          {reservation.returnMileage !== null && reservation.returnMileage !== undefined && <>
            <DetailLine label="Kilométrage au retour" value={`${reservation.returnMileage} km`} />
            <DetailLine label="Carburant au retour" value={reservation.returnFuel ?? 'Non renseigné'} />
            <DetailLine label="Frais supplémentaires" value={formatAdminPrice(reservation.returnFees ?? 0)} />
            {reservation.returnDamage && <DetailLine label="Dégâts signalés" value={reservation.returnDamage} />}
          </>}
        </div>
        {(reservation.payments?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-[#eeebf1] p-4">
          <h3 className="text-xs font-bold text-[#514e61]">Historique des paiements</h3>
          <ul className="mt-2 space-y-2">{reservation.payments?.map((payment, index) => <li key={`${payment.type}-${index}`} className="flex justify-between gap-3 text-xs text-[#777485]"><span>{payment.type === 'caution' ? 'Caution' : 'Location'} · {payment.method.toUpperCase()}</span><strong>{formatAdminPrice(payment.amount)} · {payment.status}</strong></li>)}</ul>
        </div>}
        {reservation.recordId && reservation.status !== 'Annulée' && reservation.status !== 'Terminée' && remainingFor('location') + remainingFor('caution') > 0 && <form onSubmit={submitPayment} className="mt-4 space-y-3 rounded-xl border border-[#eeebf1] p-4">
          <h3 className="text-xs font-bold text-[#514e61]">Enregistrer un paiement reçu</h3>
          <p className="text-[10px] text-[#898696]">Enregistrement manuel uniquement : aucun paiement en ligne n’est débité par cette application.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-[10px] font-semibold text-[#514e61]">Type<select value={activePaymentType} onChange={(event) => { const type = event.target.value as 'location' | 'caution'; setPaymentType(type); setPaymentAmount(String(remainingFor(type))) }} className="mt-1 block w-full rounded-md border border-[#e9e6ed] bg-white px-2 py-2 text-xs"><option value="location" disabled={remainingFor('location') === 0}>Location · solde {formatAdminPrice(remainingFor('location'))}</option><option value="caution" disabled={remainingFor('caution') === 0}>Caution · solde {formatAdminPrice(remainingFor('caution'))}</option></select></label>
            <label className="text-[10px] font-semibold text-[#514e61]">Montant<input required type="number" min="1" max={remainingPayment} step="1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="mt-1 block w-full rounded-md border border-[#e9e6ed] px-2 py-2 text-xs" /></label>
            <label className="text-[10px] font-semibold text-[#514e61]">Moyen<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'cb' | 'espece' | 'mobile')} className="mt-1 block w-full rounded-md border border-[#e9e6ed] bg-white px-2 py-2 text-xs"><option value="espece">Espèces</option><option value="mobile">Mobile Money</option><option value="cb">Carte (reçu hors application)</option></select></label>
          </div>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Enregistrer le paiement'}</button>
        </form>}
        {reservation.status === 'En cours' && reservation.recordId && <form onSubmit={submitReturn} className="mt-4 space-y-3 rounded-xl border border-[#eeebf1] p-4">
          <h3 className="text-xs font-bold text-[#514e61]">Enregistrer le retour du véhicule</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold text-[#514e61]">Kilométrage retour<input required type="number" min={reservation.departureMileage ?? 0} value={returnMileage} onChange={(event) => setReturnMileage(event.target.value)} className="mt-1 block w-full rounded-md border border-[#e9e6ed] px-2 py-2 text-xs" /></label>
            <label className="text-[10px] font-semibold text-[#514e61]">Niveau carburant<select value={returnFuel} onChange={(event) => setReturnFuel(event.target.value as typeof returnFuel)} className="mt-1 block w-full rounded-md border border-[#e9e6ed] bg-white px-2 py-2 text-xs"><option value="vide">Vide</option><option value="quart">1/4</option><option value="moitie">1/2</option><option value="trois_quarts">3/4</option><option value="plein">Plein</option></select></label>
            <label className="text-[10px] font-semibold text-[#514e61]">Frais supplémentaires<input required type="number" min="0" value={extraFees} onChange={(event) => setExtraFees(event.target.value)} className="mt-1 block w-full rounded-md border border-[#e9e6ed] px-2 py-2 text-xs" /></label>
            <label className="text-[10px] font-semibold text-[#514e61]">Dégâts ou observations<textarea value={damage} onChange={(event) => setDamage(event.target.value)} maxLength={5000} className="mt-1 block w-full rounded-md border border-[#e9e6ed] px-2 py-2 text-xs" /></label>
          </div>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Valider le retour'}</button>
        </form>}
        {actionError && <p role="alert" className="mt-3 text-xs text-rose-700">{actionError}</p>}
        {actionMessage && <p role="status" className="mt-3 text-xs text-emerald-700">{actionMessage}</p>}
      </section>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[#eeebf1] pb-2 last:border-0 last:pb-0"><span className="text-xs text-[#898696]">{label}</span><strong className="text-right text-xs font-semibold text-[#39364f]">{value}</strong></div>
}

export default ReservationsPage
