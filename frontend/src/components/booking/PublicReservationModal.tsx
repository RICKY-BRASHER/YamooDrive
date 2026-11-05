import { useMemo, useState, type FormEvent } from 'react'
import { createPublicReservation, getApiErrorMessage } from '../../services/api'
import { calculateOfferPrice, calculateRentalPrice, type AgencyOffer, type AgencyVehicle } from '../admin/agencyData'
import { formatAdminPrice } from '../admin/adminData'

type Props = {
  vehicle: AgencyVehicle
  offers: AgencyOffer[]
  licenseNumber: string | null
  onClose: () => void
  onCreated: (reservationId: string) => void
}

function localDateTimeValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function PublicReservationModal({ vehicle, offers, licenseNumber: savedLicenseNumber, onClose, onCreated }: Props) {
  const [start, setStart] = useState('')
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('days')
  const [durationValue, setDurationValue] = useState('1')
  const [minimumStart, setMinimumStart] = useState('')
  const [licenseNumber, setLicenseNumber] = useState(savedLicenseNumber ?? '')
  const [offerId, setOfferId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startDate = new Date(start)
  const durationCount = Number(durationValue)
  const durationHours = Number.isInteger(durationCount) && durationCount > 0
    ? durationCount * (durationUnit === 'days' ? 24 : 1)
    : 0
  const endDate = new Date(startDate.getTime() + durationHours * 3_600_000)
  const end = Number.isFinite(endDate.getTime()) ? localDateTimeValue(endDate) : ''
  const eligibleOffers = useMemo(() => offers
    .filter((offer) => offer.enabled && offer.vehicleIds.includes(vehicle.id) && durationHours >= offer.minDurationHours)
    .map((offer) => ({ ...offer, total: calculateOfferPrice(vehicle, offer, durationHours) })),
  [durationHours, offers, vehicle])
  const selectedOffer = eligibleOffers.find((offer) => offer.id === offerId)
  const basePrice = durationHours > 0 ? calculateRentalPrice(vehicle, durationHours) : 0
  const amount = selectedOffer ? Math.min(basePrice, selectedOffer.total) : basePrice

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (startDate.getTime() <= Date.now() || durationHours < 1 || !end) {
      setError('Choisissez un départ futur et une durée de location valide.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const reservation = await createPublicReservation({
        vehicleId: vehicle.id,
        start,
        end,
        licenseNumber: savedLicenseNumber ?? licenseNumber.trim(),
        offerId: offerId || null,
      })
      onCreated(reservation.id)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17172f]/55 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose()
    }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="public-reservation-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Demande de location</p><h2 id="public-reservation-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">{vehicle.brand} {vehicle.name}</h2></div>
          <button type="button" disabled={isSubmitting} onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]">×</button>
        </div>
        <p className="mt-2 text-xs text-[#898696]">Tarif affiché : {formatAdminPrice(vehicle.price)} / jour · {formatAdminPrice(vehicle.priceHour)} / heure</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#514e61]">Départ<input required min={minimumStart || undefined} type="datetime-local" value={start} onFocus={() => setMinimumStart(localDateTimeValue(new Date()))} onChange={(event) => { setStart(event.target.value); setOfferId('') }} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-xs" /></label>
          <div className="text-xs font-semibold text-[#514e61]"><label htmlFor="public-duration-value">Durée de location</label><div className="mt-2 flex gap-2"><input id="public-duration-value" required type="number" min={1} max={durationUnit === 'days' ? 365 : 8760} step={1} value={durationValue} onChange={(event) => { setDurationValue(event.target.value); setOfferId('') }} className="block min-w-0 flex-1 rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal" /><select aria-label="Unité de durée" value={durationUnit} onChange={(event) => { setDurationUnit(event.target.value as 'hours' | 'days'); setOfferId('') }} className="rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm font-normal"><option value="hours">Heures</option><option value="days">Jours</option></select></div></div>
          <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Retour prévu<input readOnly type="datetime-local" value={end} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-[#faf9fb] px-3 py-2.5 text-xs text-[#777485]" /></label>
          {savedLicenseNumber
            ? <p className="rounded-lg bg-[#faf9fb] p-3 text-xs text-[#625f70] sm:col-span-2">Permis enregistré dans votre dossier : <strong>{savedLicenseNumber}</strong></p>
            : <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Numéro de permis de conduire<input required minLength={3} maxLength={255} value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} placeholder="Numéro figurant sur le permis" className="mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm" /></label>}
          {eligibleOffers.length > 0 && <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Bon plan<select value={offerId} onChange={(event) => setOfferId(event.target.value)} className="mt-2 block w-full rounded-lg border border-[#e9e6ed] bg-white px-3 py-2.5 text-sm"><option value="">Sans bon plan · {formatAdminPrice(basePrice)}</option>{eligibleOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.title} · {formatAdminPrice(Math.min(basePrice, offer.total))}</option>)}</select></label>}
        </div>
        {durationHours > 0 && <p className="mt-4 rounded-lg bg-[#faf9fb] px-3 py-2 text-sm text-[#514e61]">Estimation pour {durationHours} heure(s) : <strong>{formatAdminPrice(amount)}</strong>{selectedOffer && selectedOffer.total < basePrice && <span className="ml-1 text-xs text-[#6b5887]">avec {selectedOffer.title}</span>}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
        <p className="mt-4 text-[10px] leading-5 text-[#898696]">Le prix définitif et la disponibilité seront vérifiés par le serveur. Cette demande ne débite aucun paiement : l’agence vous contactera pour confirmer la réservation.</p>
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-lg border border-[#e9e6ed] px-4 py-2.5 text-xs font-semibold text-[#686578]">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Envoi…' : 'Envoyer la demande'}</button></div>
      </form>
    </div>
  )
}

export default PublicReservationModal
