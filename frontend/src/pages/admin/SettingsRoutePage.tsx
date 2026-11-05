import { useState, type FormEvent } from 'react'
import { LockKeyhole, Save, UserRound } from 'lucide-react'
import { getApiErrorMessage, updateUserProfile } from '../../services/api'
import { useAdminConsole } from './useAdminConsole'

function SettingsRoutePage() {
  const { user, onProfileUpdated } = useAdminConsole()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setError('')
    setNotice('')
    setSaving(true)
    const formData = new FormData(form)
    const currentPassword = String(formData.get('current_password') ?? '')
    const password = String(formData.get('password') ?? '')
    const passwordConfirmation = String(formData.get('password_confirmation') ?? '')
    const emailChanged = email.trim().toLocaleLowerCase('fr-FR') !== user.email

    try {
      const result = await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        ...(password || emailChanged ? {
          current_password: currentPassword,
        } : {}),
        ...(password ? {
          password,
          password_confirmation: passwordConfirmation,
        } : {}),
      })
      onProfileUpdated(result.user)
      setName(result.user.name)
      setEmail(result.user.email)
      form.reset()
      setNotice(result.emailVerificationRequired
        ? 'Profil mis à jour. Un lien de vérification a été envoyé à votre nouvelle adresse e-mail.'
        : 'Vos informations ont été mises à jour.')
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9272a9]">Compte administrateur</p>
        <h1 className="font-[Manrope] text-3xl font-bold tracking-tight text-[#22213f]">Paramètres du compte</h1>
        <p className="mt-2 text-sm text-[#858493]">Modifiez vos coordonnées ou choisissez un nouveau mot de passe.</p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-[#eeebf1] bg-white p-5 shadow-[0_8px_30px_rgba(34,33,63,0.035)] sm:p-8">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#39364f]"><UserRound size={17} /> Informations personnelles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-[#625f70]">
              Nom complet
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={255} autoComplete="name" className="w-full rounded-xl border border-[#e9e6ed] px-3 py-3 text-sm font-normal text-[#39364f] outline-none focus:border-[#9b87b4]" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-[#625f70]">
              Adresse e-mail
              <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" maxLength={255} autoComplete="email" className="w-full rounded-xl border border-[#e9e6ed] px-3 py-3 text-sm font-normal text-[#39364f] outline-none focus:border-[#9b87b4]" />
            </label>
          </div>
          <label className="block max-w-sm space-y-1.5 text-xs font-semibold text-[#625f70]">
            Mot de passe actuel <span className="font-normal text-[#9996a3]">(requis pour changer l’e-mail ou le mot de passe)</span>
            <input name="current_password" type="password" autoComplete="current-password" className="w-full rounded-xl border border-[#e9e6ed] px-3 py-3 text-sm font-normal text-[#39364f] outline-none focus:border-[#9b87b4]" />
          </label>
          <p className="text-xs leading-5 text-[#858493]">En cas de changement d’adresse, un lien de vérification sera envoyé à la nouvelle adresse.</p>
        </section>

        <section className="space-y-4 border-t border-[#f1eff3] pt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#39364f]"><LockKeyhole size={17} /> Changer le mot de passe <span className="font-normal text-[#9996a3]">(facultatif)</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-[#625f70]">
              Nouveau mot de passe
              <input name="password" type="password" autoComplete="new-password" minLength={8} className="w-full rounded-xl border border-[#e9e6ed] px-3 py-3 text-sm font-normal text-[#39364f] outline-none focus:border-[#9b87b4]" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-[#625f70]">
              Confirmation
              <input name="password_confirmation" type="password" autoComplete="new-password" minLength={8} className="w-full rounded-xl border border-[#e9e6ed] px-3 py-3 text-sm font-normal text-[#39364f] outline-none focus:border-[#9b87b4]" />
            </label>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        <div className="flex justify-end border-t border-[#f1eff3] pt-5">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#282342] px-5 py-3 text-sm font-semibold text-[#f3dfa9] transition hover:bg-[#393158] disabled:cursor-wait disabled:opacity-60">
            <Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsRoutePage
