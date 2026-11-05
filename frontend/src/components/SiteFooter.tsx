import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLockup from './BrandLockup'

const currentYear = new Date().getFullYear()

function SiteFooter() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <BrandLockup footer />
          <p>La route vous va si bien.<br />À vous de choisir la suite.</p>
        </div>
        <div className="footer-column">
          <strong>Explorer</strong>
          <a href="#cars">Nos voitures</a>
          <a href="#offers">Bons plans</a>
          <a href="#why-yamoo">Notre esprit</a>
        </div>
        <div className="footer-column">
          <strong>Besoin d’aide ?</strong>
          <a href="#footer">Contacter Yamoo</a>
          <a href="#footer">Questions fréquentes</a>
          <a href="#footer">Conditions de location</a>
          <Link to="/admin">Espace agence</Link>
        </div>
        <div className="footer-contact">
          <span className="footer-contact-label">ON EST LÀ POUR VOUS</span>
          <strong>Un départ en tête ?</strong>
          <span className="footer-contact-note">Les coordonnées de l’agence seront ajoutées ici.</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {currentYear} Yamoo Drive. Tous les chemins mènent à vous.</span>
        <span>Fait avec <Heart size={12} fill="currentColor" /> pour la route.</span>
      </div>
    </footer>
  )
}

export default SiteFooter
