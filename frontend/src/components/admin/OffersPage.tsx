import { useState } from 'react'
import { BadgePercent, CalendarDays, Check, Clock3, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { createAdminOffer, getApiErrorMessage, updateAdminOfferStatus } from '../../services/api'
import { formatAdminPrice } from './adminData'
import type { AgencyOffer, AgencyVehicle } from './agencyData'

type OffersPageProps = {
  offers: AgencyOffer[]
  vehicles: AgencyVehicle[]
  onOffersChange: (offers: AgencyOffer[]) => void
}

const fieldClass = 'mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]'

function OffersPage({ offers, vehicles, onOffersChange }: OffersPageProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('3')
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('days')
  const [minDuration, setMinDuration] = useState('3')
  const [price, setPrice] = useState('')
  const [vehicleIds, setVehicleIds] = useState<number[]>([])
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeCount = offers.filter((offer) => offer.enabled).length
  const toggleOffer = async (id: string) => {
    const offer = offers.find((item) => item.id === id)
    if (!offer) return

    try {
      const updatedOffer = await updateAdminOfferStatus(id, !offer.enabled)
      onOffersChange(offers.map((item) => item.id === id ? updatedOffer : item))
      setFormError('')
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const createOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const packageHours = Number(duration) * (durationUnit === 'days' ? 24 : 1)
    const minimumHours = Number(minDuration) * (durationUnit === 'days' ? 24 : 1)
    const numericPrice = Number(price)
    if (!title.trim() || !Number.isFinite(packageHours) || packageHours <= 0
      || !Number.isFinite(minimumHours) || minimumHours <= 0
      || !Number.isFinite(numericPrice) || numericPrice <= 0
      || vehicleIds.length === 0) {
      setFormError('Renseignez le nom, les durées, un prix valide et au moins un véhicule.')
      return
    }

    const durationLabel = `${duration} ${durationUnit === 'days' ? 'jour(s)' : 'heure(s)'}`
    setIsSubmitting(true)
    setFormError('')
    try {
      const offer = await createAdminOffer({
        title: title.trim(),
        detail: description.trim() || `Offre valable pour une location de ${durationLabel}`,
        price: numericPrice,
        durationHours: packageHours,
        minDurationHours: minimumHours,
        vehicleIds,
      })
      onOffersChange([...offers.filter((item) => item.id !== offer.id), offer])
      setShowForm(false)
      setTitle('')
      setDescription('')
      setDuration('3')
      setDurationUnit('days')
      setMinDuration('3')
      setPrice('')
      setVehicleIds([])
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayDuration = (hours: number) => hours % 24 === 0
    ? `${hours / 24} jour(s)`
    : `${hours} heure(s)`

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">Offres commerciales</p><h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Bons plans</h1><p className="mt-2 text-sm text-[#858493]">Créez des forfaits et sélectionnez les véhicules éligibles.</p></div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282342] px-4 py-3 text-sm font-semibold text-[#f3dfa9] transition hover:bg-[#393158]"><Plus size={17} /> Créer un bon plan</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OfferMetric label="Offres actives" value={`${activeCount}`} icon={<Check size={17} />} />
        <OfferMetric label="Utilisations ce mois" value={`${offers.reduce((total, offer) => total + offer.uses, 0)}`} icon={<BadgePercent size={17} />} />
        <OfferMetric label="Véhicules concernés" value={`${new Set(offers.filter((offer) => offer.enabled).flatMap((offer) => offer.vehicleIds)).size}`} icon={<CalendarDays size={17} />} />
      </div>

      <div className="rounded-2xl border border-[#eeeaf1] bg-[#f7f5f9] p-5 text-xs leading-5 text-[#6e697c] sm:p-6">
        <strong className="text-[#443b5c]">Gestion en base :</strong> les offres activées sont proposées avec les véhicules sélectionnés et leurs conditions de durée.
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {offers.map((offer) => {
          const eligibleVehicles = vehicles.filter((vehicle) => offer.vehicleIds.includes(vehicle.id))
          return (
            <article key={offer.id} className="rounded-2xl border border-[#eeebf1] bg-white p-5 shadow-[0_8px_30px_rgba(34,33,63,0.035)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#f3f0f7] text-[#6d5b8a]"><BadgePercent size={21} /></span>
                <button type="button" onClick={() => toggleOffer(offer.id)} aria-pressed={offer.enabled} aria-label={`${offer.enabled ? 'Désactiver' : 'Activer'} ${offer.title}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${offer.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {offer.enabled ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}{offer.enabled ? 'Active' : 'En pause'}
                </button>
              </div>
              <div className="mt-4"><h2 className="font-[Manrope] text-lg font-bold text-[#292644]">{offer.title}</h2><p className="mt-1 text-xs text-[#898696]">{offer.detail}</p></div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-[#f1eff3] pt-4">
                <div><small className="block text-[10px] text-[#9996a3]">Tarif du forfait</small><strong className="mt-1 block font-[Manrope] text-xl text-[#292644]">{formatAdminPrice(offer.price)} <small className="font-sans text-xs font-normal text-[#898696]">forfait</small></strong></div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#faf9fb] px-3 py-2 text-[10px] text-[#777485]"><Clock3 size={13} /> {displayDuration(offer.durationHours)}</span>
                <div className="w-full"><small className="block text-[10px] text-[#9996a3]">Véhicules éligibles</small><p className="mt-1 text-xs text-[#625f70]">{eligibleVehicles.length ? eligibleVehicles.map((vehicle) => `${vehicle.brand} ${vehicle.name}`).join(', ') : 'Aucun véhicule associé'}</p></div>
                <span className="w-full text-[10px] text-[#9996a3]">{offer.uses} réservation(s)</span>
              </div>
            </article>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <form onSubmit={createOffer} role="dialog" aria-modal="true" aria-labelledby="create-offer-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Nouvelle offre</p><h2 id="create-offer-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">Créer un bon plan</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]"><X size={17} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Nom de l’offre<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Week-end découverte" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Un tarif spécial pour vos escapades" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Durée du forfait<input required type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Unité<select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as 'hours' | 'days')} className={fieldClass}><option value="hours">Heures</option><option value="days">Jours</option></select></label>
              <label className="text-xs font-semibold text-[#514e61]">Durée minimale requise<input required type="number" min="1" value={minDuration} onChange={(event) => setMinDuration(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Prix du forfait (F)<input required type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="50000" className={fieldClass} /></label>
            </div>
            <fieldset className="mt-5">
              <legend className="text-xs font-semibold text-[#514e61]">Véhicules éligibles <span className="font-normal text-[#9996a3]">(choisissez-en au moins un)</span></legend>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#e9e6ed] p-2">
                {vehicles.map((vehicle) => (
                  <label key={vehicle.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#514e61] hover:bg-[#faf9fb]">
                    <input type="checkbox" checked={vehicleIds.includes(vehicle.id)} onChange={(event) => setVehicleIds((current) => event.target.checked ? [...current, vehicle.id] : current.filter((id) => id !== vehicle.id))} className="accent-[#6d5b8a]" />
                    <span className="min-w-0 flex-1 truncate">{vehicle.brand} {vehicle.name}</span>
                    <span className="shrink-0 text-[10px] text-[#9996a3]">{formatAdminPrice(vehicle.price)} / jour</span>
                  </label>
                ))}
                {vehicles.length === 0 && <p className="p-3 text-xs text-[#898696]">Ajoutez d’abord un véhicule à la flotte.</p>}
              </div>
            </fieldset>
            {formError && <p role="alert" className="mt-4 text-xs text-rose-700">{formError}</p>}
            <p className="mb-5 mt-4 text-[10px] leading-4 text-[#9996a3]">Le bon plan ne sera proposé que pour ces véhicules et si la réservation respecte la durée minimale.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#e9e6ed] px-4 py-2.5 text-xs font-semibold text-[#686578]">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Créer l’offre'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function OfferMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <article className="flex items-center gap-3 rounded-xl border border-[#eeebf1] bg-white p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#f3f0f7] text-[#6d5b8a]">{icon}</span><span><small className="block text-[10px] text-[#9996a3]">{label}</small><strong className="font-[Manrope] text-xl text-[#292644]">{value}</strong></span></article>
}

export default OffersPage
