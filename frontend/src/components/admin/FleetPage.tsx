import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, CarFront, Check, ChevronDown, Fuel, Plus, Search, Settings2, UsersRound, Wrench, X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { createAdminVehicle, getApiErrorMessage, updateAdminVehicleStatus } from '../../services/api'
import { formatPrice, imageUrl, type CarCategory, type CarListing } from '../carData'
import type { AgencyVehicle, VehicleState } from './agencyData'

type FleetPageProps = {
  vehicles: AgencyVehicle[]
  onVehiclesChange: (vehicles: AgencyVehicle[]) => void
}

const categories: CarCategory[] = ['Citadine', 'SUV', 'Berline', 'Premium', 'Électrique']
const states: VehicleState[] = ['Disponible', 'En location', 'Entretien', 'Hors service']
const statesCss: Record<VehicleState, string> = {
  'Disponible': 'bg-emerald-50 text-emerald-700',
  'En location': 'bg-sky-50 text-sky-700',
  'Entretien': 'bg-amber-50 text-amber-700',
  'Hors service': 'bg-rose-50 text-rose-700',
}
const fieldClass = 'mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]'

function FleetPage({ vehicles, onVehiclesChange }: FleetPageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Toutes catégories')
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [registration, setRegistration] = useState('')
  const [price, setPrice] = useState('')
  const [priceHour, setPriceHour] = useState('')
  const [deposit, setDeposit] = useState('0')
  const [mileage, setMileage] = useState('0')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CarCategory>('Citadine')
  const [seats, setSeats] = useState('5')
  const [transmission, setTransmission] = useState<CarListing['transmission']>('Manuelle')
  const [fuel, setFuel] = useState('Essence')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const imagePreview = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile])

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const matchesText = `${vehicle.brand} ${vehicle.name} ${vehicle.registration ?? ''}`
      .toLocaleLowerCase('fr')
      .includes(query.trim().toLocaleLowerCase('fr'))
    return matchesText && (category === 'Toutes catégories' || vehicle.category === category)
  }), [category, query, vehicles])
  const availableCount = vehicles.filter((vehicle) => vehicle.status === 'Disponible').length
  const rentedCount = vehicles.filter((vehicle) => vehicle.status === 'En location').length
  const serviceCount = vehicles.filter((vehicle) => vehicle.status === 'Entretien').length
  const outOfServiceCount = vehicles.filter((vehicle) => vehicle.status === 'Hors service').length

  const changeState = async (id: number, status: VehicleState) => {
    if (status === 'En location') return
    try {
      const updatedVehicle = await updateAdminVehicleStatus(id, status)
      onVehiclesChange(vehicles.map((vehicle) => vehicle.id === id ? updatedVehicle : vehicle))
      setStatusError('')
    } catch (error) {
      setStatusError(getApiErrorMessage(error))
    }
  }

  const createVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedRegistration = registration.trim().toLocaleUpperCase('fr')
    if (vehicles.some((vehicle) => vehicle.registration?.toLocaleUpperCase('fr') === normalizedRegistration)) {
      setFormError('Cette immatriculation est déjà enregistrée.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      const vehicle = await createAdminVehicle({
        brand: brand.trim(),
        name: name.trim(),
        registration: normalizedRegistration,
        category: selectedCategory,
        imageFile,
        price: Number(price),
        priceHour: Number(priceHour),
        seats: Number(seats),
        transmission,
        fuel,
        deposit: Number(deposit),
        mileage: Number(mileage),
      })
      onVehiclesChange([...vehicles.filter((item) => item.id !== vehicle.id), vehicle])
      setShowForm(false)
      setBrand('')
      setName('')
      setRegistration('')
      setPrice('')
      setPriceHour('')
      setDeposit('0')
      setMileage('0')
      setImageFile(null)
      setSeats('5')
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">Vos véhicules</p><h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Parc automobile</h1><p className="mt-2 text-sm text-[#858493]">Consultez les tarifs et la disponibilité de votre flotte.</p></div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282342] px-4 py-3 text-sm font-semibold text-[#f3dfa9] transition hover:bg-[#393158]"><Plus size={17} /> Ajouter un véhicule</button>
      </div>
      {statusError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{statusError}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FleetMetric title="Disponibles" value={availableCount} icon={<Check size={17} />} style="text-emerald-700 bg-emerald-50" />
        <FleetMetric title="En location" value={rentedCount} icon={<CarFront size={17} />} style="text-sky-700 bg-sky-50" />
        <FleetMetric title="En entretien" value={serviceCount} icon={<Wrench size={17} />} style="text-amber-700 bg-amber-50" />
        <FleetMetric title="Hors service" value={outOfServiceCount} icon={<Wrench size={17} />} style="text-rose-700 bg-rose-50" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#eeebf1] bg-white p-4 sm:flex-row">
        <label className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-[#e9e6ed] px-3 text-[#9793a1] focus-within:border-[#a998c0]"><Search size={16} /><span className="sr-only">Rechercher un véhicule</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par marque, modèle ou plaque..." className="w-full bg-transparent text-xs text-[#39364f] outline-none placeholder:text-[#aaa7b2]" /></label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#e9e6ed] px-3 text-[#9793a1]"><ArrowDownUp size={15} /><span className="sr-only">Filtrer par catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="bg-transparent text-xs text-[#514e61] outline-none"><option>Toutes catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-[#eeebf1] bg-white shadow-[0_8px_30px_rgba(34,33,63,0.035)]">
            <div className="relative h-48 bg-[#eceaf0]">
              <img src={imageUrl(vehicle.image, 800)} alt={`${vehicle.brand} ${vehicle.name}`} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#514e61] backdrop-blur">{vehicle.category}</span>
              <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statesCss[vehicle.status]}`}>{vehicle.status}</span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium text-[#9996a3]">{vehicle.brand}{vehicle.registration ? ` · ${vehicle.registration}` : ''}</p><h2 className="mt-1 font-[Manrope] text-lg font-bold text-[#292644]">{vehicle.name}</h2></div><div className="text-right"><strong className="block text-sm text-[#292644]">{formatPrice(vehicle.price)}</strong><small className="text-[10px] text-[#9996a3]">par jour</small></div></div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-[#f1eff3] py-3 text-[10px] text-[#777485]"><span className="inline-flex items-center gap-1"><UsersRound size={13} /> {vehicle.seats} places</span><span className="inline-flex items-center gap-1"><Settings2 size={13} /> {vehicle.transmission}</span><span className="inline-flex items-center gap-1"><Fuel size={13} /> {vehicle.fuel}</span></div>
              <div className="mt-4 flex items-center justify-between gap-3"><span className="text-[10px] text-[#9996a3]">Dès {formatPrice(vehicle.priceHour)} / heure</span><label className="relative inline-flex items-center gap-1.5 rounded-lg border border-[#e9e6ed] px-2.5 py-2"><span className="sr-only">Modifier la disponibilité de {vehicle.brand} {vehicle.name}</span><select value={vehicle.status} onChange={(event) => changeState(vehicle.id, event.target.value as VehicleState)} className="max-w-28 appearance-none bg-transparent pr-4 text-[10px] font-semibold text-[#5b576b] outline-none">{states.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={12} className="pointer-events-none absolute right-2 text-[#9692a0]" /></label></div>
            </div>
          </article>
        ))}
      </div>
      {filteredVehicles.length === 0 && <div className="rounded-2xl border border-dashed border-[#dcd7e4] p-12 text-center text-sm text-[#898696]">Aucun véhicule ne correspond à la recherche.</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <form onSubmit={createVehicle} role="dialog" aria-modal="true" aria-labelledby="create-vehicle-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Ajouter à la flotte</p><h2 id="create-vehicle-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">Nouveau véhicule</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]"><X size={17} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#514e61]">Marque<input required value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Ex. Toyota" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Modèle<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Corolla" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Immatriculation<input required value={registration} onChange={(event) => setRegistration(event.target.value)} placeholder="AB-123-CD" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Catégorie<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as CarCategory)} className={fieldClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-xs font-semibold text-[#514e61]">Tarif journalier (F)<input required type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="35000" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Tarif horaire (F)<input required type="number" min="1" value={priceHour} onChange={(event) => setPriceHour(event.target.value)} placeholder="5000" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Caution (F)<input required type="number" min="0" value={deposit} onChange={(event) => setDeposit(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Kilométrage actuel<input required type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Nombre de places<input required type="number" min="1" max="60" value={seats} onChange={(event) => setSeats(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Boîte de vitesse<select value={transmission} onChange={(event) => setTransmission(event.target.value as CarListing['transmission'])} className={fieldClass}><option>Manuelle</option><option>Automatique</option></select></label>
              <label className="text-xs font-semibold text-[#514e61]">Carburant<select value={fuel} onChange={(event) => setFuel(event.target.value)} className={fieldClass}><option>Essence</option><option>Diesel</option><option>Hybride</option><option>Électrique</option><option>GPL</option></select></label>
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Photo du véhicule<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                if (file && file.size > 5 * 1024 * 1024) {
                  setFormError('La photo doit faire 5 Mo maximum.')
                  event.target.value = ''
                  return
                }
                setFormError('')
                setImageFile(file)
              }} className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#f3f0f7] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#51476c]`} /><small className="mt-1 block font-normal text-[#9996a3]">Choisissez une image dans votre galerie (JPG, PNG ou WebP, 5 Mo maximum).</small></label>
              {imagePreview && <div className="sm:col-span-2"><img src={imagePreview} alt="Aperçu du véhicule" className="h-40 w-full rounded-xl bg-[#f7f6f8] object-cover" /></div>}
            </div>
            {formError && <p role="alert" className="mt-4 text-xs text-rose-700">{formError}</p>}
            <p className="mb-5 mt-4 text-[10px] leading-4 text-[#9996a3]">Le véhicule est ajouté avec le statut « Disponible » et pourra être sélectionné dans les réservations et les bons plans.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#e9e6ed] px-4 py-2.5 text-xs font-semibold text-[#686578]">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Ajouter le véhicule'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function FleetMetric({ title, value, icon, style }: { title: string; value: number; icon: ReactNode; style: string }) {
  return <article className="flex items-center gap-3 rounded-xl border border-[#eeebf1] bg-white p-4"><span className={`grid size-10 place-items-center rounded-xl ${style}`}>{icon}</span><span><small className="block text-[10px] text-[#9996a3]">{title}</small><strong className="font-[Manrope] text-xl text-[#292644]">{value} <span className="text-xs font-medium text-[#9996a3]">véhicules</span></strong></span></article>
}

export default FleetPage
