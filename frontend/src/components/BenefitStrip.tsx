import { Fragment } from 'react'
import { Clock3, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

const benefits = [
  { icon: Clock3, title: 'À l’heure ou à la journée', detail: 'Vous choisissez la durée' },
  { icon: Sparkles, title: 'Des bons plans futés', detail: 'Plus vous partez, mieux vous roulez' },
  { icon: ShieldCheck, title: 'Un service de confiance', detail: 'Une équipe à votre écoute' },
  { icon: MapPin, title: 'Prête près de chez vous', detail: 'Votre aventure commence ici' },
]

function BenefitStrip() {
  return (
    <section className="benefit-strip" aria-label="Les avantages Yamoo Drive">
      {benefits.map(({ icon: Icon, title, detail }, index) => (
        <Fragment key={title}>
          <div className="benefit-item">
            <span className="benefit-icon"><Icon size={18} /></span>
            <span><strong>{title}</strong><small>{detail}</small></span>
          </div>
          {index < benefits.length - 1 && <span className="benefit-separator" />}
        </Fragment>
      ))}
    </section>
  )
}

export default BenefitStrip
