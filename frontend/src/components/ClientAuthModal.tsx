import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CarFront, Mail, Phone, ShieldCheck, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getApiErrorMessage, loginUser, registerUser, type AuthUser } from '../services/api'

type ClientAuthModalProps = {
  onClose: () => void
  onAuthenticated: (user: AuthUser) => void
}

function ClientAuthModal({ onClose, onAuthenticated }: ClientAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [submitError, setSubmitError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    firstInputRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setSubmitError('')
    setSubmitMessage('')
    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        await registerUser({
            name: String(formData.get('name') ?? '').trim(),
            email,
            password,
            telephone: `+237${String(formData.get('telephone') ?? '').replace(/\D/g, '')}`,
          })

        setSubmitMessage('Compte créé. Consultez votre boîte mail et cliquez sur le lien de vérification avant de vous connecter.')
          form.reset()
        return
      }

      const user = await loginUser({ email, password })
      onAuthenticated(user)
      onClose()
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="client-auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <motion.section
          className="client-auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-auth-title"
          initial={{ opacity: 0, y: 22, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.22 }}
        >
          <button className="client-auth-close" type="button" onClick={onClose} aria-label="Fermer la fenêtre">
            <X size={19} />
          </button>

          <div className="client-auth-brand">
            <span className="client-auth-brand-icon"><CarFront size={21} /></span>
            <span>YAMOO<span>DRIVE</span><i>.</i></span>
          </div>
          <p className="client-auth-eyebrow">VOTRE PROCHAINE ROUTE VOUS ATTEND</p>
          <h2 id="client-auth-title">{mode === 'login' ? 'Ravi de vous revoir.' : 'Bienvenue chez Yamoo.'}</h2>
          <p className="client-auth-intro">
            {mode === 'login'
              ? 'Connectez-vous pour retrouver vos envies de voyage.'
              : 'Créez votre profil et préparez votre prochaine escapade.'}
          </p>

          <div className="client-auth-tabs" role="group" aria-label="Type de compte">
            <button type="button" aria-pressed={mode === 'login'} disabled={isSubmitting} onClick={() => { setMode('login'); setSubmitError(''); setSubmitMessage('') }}>Connexion</button>
            <button type="button" aria-pressed={mode === 'signup'} disabled={isSubmitting} onClick={() => { setMode('signup'); setSubmitError(''); setSubmitMessage('') }}>Inscription</button>
          </div>

          <form key={mode} className="client-auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label>
                Votre nom
                <span className="client-auth-input-wrap">
                  <UserRound size={17} />
                  <input ref={firstInputRef} name="name" type="text" autoComplete="name" placeholder="Ex. Aïcha Koné" required minLength={2} disabled={isSubmitting} />
                </span>
              </label>
            )}
            {mode === 'signup' && (
              <label>
                Téléphone (Cameroun)
                <span className="client-auth-input-wrap">
                  <Phone size={17} />
                  <span aria-hidden="true">+237</span>
                  <input
                    name="telephone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="6XX XX XX XX"
                    pattern="[26][0-9]{8}"
                    title="Saisissez les 9 chiffres du numéro camerounais, sans le code +237."
                    maxLength={9}
                    required
                    disabled={isSubmitting}
                  />
                </span>
              </label>
            )}
            <label>
              Adresse e-mail
              <span className="client-auth-input-wrap">
                <Mail size={17} />
                <input
                  ref={mode === 'login' ? firstInputRef : undefined}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  required
                  disabled={isSubmitting}
                />
              </span>
            </label>
            <label>
              Mot de passe
              <span className="client-auth-input-wrap">
                <ShieldCheck size={17} />
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Au moins 8 caractères"
                  minLength={8}
                  required
                  disabled={isSubmitting}
                />
              </span>
            </label>
            {mode === 'login' && (
              <button
              className="client-auth-forgot"
              type="button"
              onClick={() => setSubmitError('La récupération du mot de passe sera disponible prochainement.')}
              >
              Mot de passe oublié ?
              </button>
            )}
            {submitError && <p className="client-auth-message" role="alert">{submitError}</p>}
            {submitMessage && <p className="client-auth-message" role="status">{submitMessage}</p>}
            <button className="client-auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              <ArrowRight size={17} />
            </button>
          </form>

          { mode === 'login' && (
            <p className="client-auth-note">
              Les comptes sont vérifiés par e-mail avant la première connexion.
            </p>
          )

          }
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
 
export default ClientAuthModal
