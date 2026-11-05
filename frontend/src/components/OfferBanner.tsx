import { ArrowRight, CalendarDays, Clock3, Sparkles, UsersRound } from 'lucide-react'
import { formatAdminPrice } from './admin/adminData'
import type { AgencyOffer } from './admin/agencyData'

function OfferBanner({ offers }: { offers: AgencyOffer[] }) {
  const offer = offers.find((item) => item.enabled)
  if (!offer) return null

  const duration = offer.durationHours % 24 === 0
    ? `${offer.durationHours / 24} jour(s)`
    : `${offer.durationHours} heure(s)`

  return (
    <section className="offer-banner" id="offers" aria-labelledby="offer-title">
      <div className="offer-glow" aria-hidden="true" />
      <div className="offer-content">
        <span className="offer-kicker"><Sparkles size={14} /> OFFRE DISPONIBLE</span>
        <h2 id="offer-title">{offer.title}<br /><span>{formatAdminPrice(offer.price)}</span></h2>
        <p>{offer.detail || 'Un forfait réservé aux véhicules éligibles.'}</p>
        <a className="offer-button" href="#cars">Voir les véhicules éligibles <ArrowRight size={16} /></a>
      </div>
      <div className="offer-perks">
        <div><span className="offer-perk-icon"><Clock3 size={18} /></span><span><strong>Forfait</strong><small>{duration}</small></span></div>
        <div><span className="offer-perk-icon"><CalendarDays size={18} /></span><span><strong>Durée minimale</strong><small>{offer.minDurationHours} heure(s)</small></span></div>
        <div><span className="offer-perk-icon"><UsersRound size={18} /></span><span><strong>Véhicules éligibles</strong><small>{offer.vehicleIds.length} véhicule(s)</small></span></div>
      </div>
      <span className="offer-decoration" aria-hidden="true">Y</span>
    </section>
  )
}

export default OfferBanner
