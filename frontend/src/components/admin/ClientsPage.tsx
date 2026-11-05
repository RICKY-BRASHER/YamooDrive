import { useMemo, useState } from 'react'
import { Plus, Search, UsersRound, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { createAdminClient, getApiErrorMessage } from '../../services/api'
import type { AgencyClient } from './agencyData'

type ClientsPageProps = {
  clients: AgencyClient[]
  onClientsChange: (clients: AgencyClient[]) => void
}

const fieldClass = 'mt-2 block w-full rounded-lg border border-[#e9e6ed] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a998c0]'

function ClientsPage({ clients, onClientsChange }: ClientsPageProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null)
  const [formError, setFormError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredClients = useMemo(() => clients.filter((client) =>
    `${client.name} ${client.email} ${client.phone} ${client.licenseNumber}`
      .toLocaleLowerCase('fr')
      .includes(search.trim().toLocaleLowerCase('fr')),
  ), [clients, search])

  const createClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLocaleLowerCase('fr')
    if (clients.some((client) => client.email.toLocaleLowerCase('fr') === normalizedEmail)) {
      setFormError('Un client possède déjà cette adresse e-mail.')
      return
    }

    setFormError('')
    setIsSubmitting(true)
    try {
      const client = await createAdminClient({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim().toLocaleUpperCase('fr'),
        birthDate,
      })
      onClientsChange([...clients.filter((item) => item.id !== client.id), client])
      setShowForm(false)
      setName('')
      setEmail('')
      setPhone('')
      setLicenseNumber('')
      setBirthDate('')
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">Votre clientèle</p><h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Clients</h1><p className="mt-2 text-sm text-[#858493]">Retrouvez les coordonnées et l’activité de vos clients.</p></div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282342] px-4 py-3 text-sm font-semibold text-[#f3dfa9] transition hover:bg-[#393158]"><Plus size={17} /> Ajouter un client</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ClientMetric label="Clients au total" value={`${clients.length}`} hint="profils enregistrés" />
        <ClientMetric label="Clients fidèles" value={`${clients.filter((client) => client.bookings >= 3).length}`} hint="3 réservations ou plus" />
        <ClientMetric label="Nouveaux clients" value={`${clients.filter((client) => client.bookings === 0).length}`} hint="aucune réservation pour l’instant" />
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#eeebf1] bg-white shadow-[0_8px_30px_rgba(34,33,63,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[#f1eff3] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="font-[Manrope] text-base font-bold text-[#292644]">Répertoire clients</h2><p className="mt-1 text-xs text-[#8d8a99]">Profils synchronisés avec la base de données</p></div>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#e9e6ed] px-3 text-[#9793a1] sm:w-72"><Search size={16} /><span className="sr-only">Rechercher un client</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail, téléphone ou permis..." className="w-full bg-transparent text-xs text-[#39364f] outline-none placeholder:text-[#aaa7b2]" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="bg-[#faf9fb] text-[10px] uppercase tracking-wider text-[#9996a3]"><tr><th className="px-5 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Téléphone</th><th className="px-4 py-3 font-semibold">Permis</th><th className="px-4 py-3 font-semibold">Réservations</th><th className="px-4 py-3 font-semibold">Compte</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-[#f1eff3]">{filteredClients.map((client, index) => <tr key={client.id} className="hover:bg-[#fdfcfe]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-full text-[10px] font-bold ${index % 2 ? 'bg-[#f3f0f7] text-[#65527f]' : 'bg-[#f7efd9] text-[#876d37]'}`}>{client.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong className="block text-xs font-semibold text-[#514e61]">{client.name}</strong><small className="mt-1 block text-[10px] text-[#aaa7b2]">{client.email}</small></span></div></td><td className="px-4 py-4 text-[#625f70]">{client.phone}</td><td className="px-4 py-4 text-[#625f70]">{client.licenseNumber || 'À renseigner à la réservation'}</td><td className="px-4 py-4"><strong className="text-[#39364f]">{client.bookings}</strong><small className="ml-1 text-[#9996a3]">locations</small></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${client.state === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{client.state}</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedClient(client)} className="font-semibold text-[#6b5887] hover:text-[#292644]">Voir profil</button></td></tr>)}</tbody>
          </table>
          {filteredClients.length === 0 && <div className="p-12 text-center"><UsersRound className="mx-auto text-[#c5bdcf]" size={28} /><p className="mt-3 text-sm text-[#777485]">Aucun client trouvé.</p></div>}
        </div>
        <div className="border-t border-[#f1eff3] px-5 py-4 text-[10px] text-[#9996a3]">{filteredClients.length} client(s) affiché(s)</div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <form onSubmit={createClient} role="dialog" aria-modal="true" aria-labelledby="create-client-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Nouveau dossier</p><h2 id="create-client-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">Ajouter un client</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]"><X size={17} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Nom complet<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Aïcha Koné" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Adresse e-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@exemple.com" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61]">Téléphone<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+237 6XX XX XX XX" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Numéro de permis de conduire<input required minLength={3} maxLength={255} value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} placeholder="Numéro figurant sur le permis" className={fieldClass} /></label>
              <label className="text-xs font-semibold text-[#514e61] sm:col-span-2">Date de naissance (facultative)<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={fieldClass} /></label>
            </div>
            {formError && <p role="alert" className="mt-4 text-xs text-rose-700">{formError}</p>}
            <p className="mb-5 mt-4 text-[10px] leading-4 text-[#9996a3]">Le permis sera enregistré dans le dossier du client pour ses prochaines réservations.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#e9e6ed] px-4 py-2.5 text-xs font-semibold text-[#686578]">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#292644] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Enregistrer le client'}</button></div>
          </form>
        </div>
      )}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17172f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedClient(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="client-profile-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#9272a9]">Profil client</p><h2 id="client-profile-title" className="mt-2 font-[Manrope] text-xl font-bold text-[#292644]">{selectedClient.name}</h2></div><button type="button" onClick={() => setSelectedClient(null)} aria-label="Fermer" className="rounded-lg p-2 text-[#898696] hover:bg-[#f5f3f7]"><X size={17} /></button></div>
            <div className="mt-5 space-y-3 rounded-xl bg-[#faf9fb] p-4 text-xs">
              <ProfileLine label="E-mail" value={selectedClient.email} /><ProfileLine label="Téléphone" value={selectedClient.phone} /><ProfileLine label="Permis de conduire" value={selectedClient.licenseNumber || 'À renseigner à la réservation'} /><ProfileLine label="Date de naissance" value={selectedClient.birthDate || 'Non renseignée'} /><ProfileLine label="Réservations" value={`${selectedClient.bookings}`} /><ProfileLine label="Client depuis" value={selectedClient.since} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function ClientMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="rounded-xl border border-[#eeebf1] bg-white p-4"><small className="text-[10px] text-[#9996a3]">{label}</small><div className="mt-1 flex items-baseline justify-between gap-2"><strong className="font-[Manrope] text-2xl text-[#292644]">{value}</strong><span className="text-[9px] text-[#7b7290]">{hint}</span></div></article>
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[#eeebf1] pb-2 last:border-0 last:pb-0"><span className="text-[#898696]">{label}</span><strong className="text-right font-semibold text-[#39364f]">{value}</strong></div>
}

export default ClientsPage
