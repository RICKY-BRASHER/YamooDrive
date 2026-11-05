import { ArrowRight, CarFront } from 'lucide-react'

function ClosingCta() {
  return (
    <section className="closing-cta">
      <div className="closing-cta-icon"><CarFront size={23} /></div>
      <div><strong>Alors, on part où ?</strong><span>Votre prochaine parcours commence au volant.</span></div>
      <a href="#cars">Choisir ma voiture <ArrowRight size={16} /></a>
    </section>
  )
}

export default ClosingCta
