import { ArrowRight, ArrowUpRight, CalendarDays, Heart, LogOut, Menu, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLockup from './BrandLockup'

type SiteHeaderProps = {
  favoritesCount: number
  favoritesOnly: boolean
  onToggleFavorites: () => void
  onLogin: () => void
  onLogout: () => void
  userLabel?: string
  userRole?: 'admin' | 'client'
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
  onCloseMobileMenu: () => void
}

function SiteHeader({
  favoritesCount,
  favoritesOnly,
  onToggleFavorites,
  onLogin,
  onLogout,
  userLabel,
  userRole,
  mobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: SiteHeaderProps) {
  const displayName = userLabel 
    ? userLabel.trim().split(/\s+/).map((part, index) => (
        index === 0 ? part : `${[...part][0]?.toLocaleUpperCase('fr-FR') ?? ''}.`
      )).join(' ')
    : ''

  return (
    <>
      <div className="announcement">
        <Sparkles size={14} strokeWidth={2.2} />
        <span>La route vous va si bien.</span>
        <span className="announcement-divider" aria-hidden="true">·</span>
        <a href="#cars">Découvrez la flotte Yamoo <ArrowRight size={13} /></a>
      </div>
      <header className="site-header">
        <BrandLockup />
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileMenuOpen}
          onClick={onToggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Navigation principale">
          <a className="nav-active" href="#cars" onClick={onCloseMobileMenu}>Nos voitures</a>
          <a href="#offers" onClick={onCloseMobileMenu}>Bons plans</a>
          <a href="#why-yamoo" onClick={onCloseMobileMenu}>Pourquoi Yamoo</a>
          <a href="#footer" onClick={onCloseMobileMenu}>Contact</a>
          {userLabel
            ? <span className="mobile-login user-name" title={userLabel}>{displayName}</span>
            : <button className="mobile-login" type="button" onClick={onLogin}>Se connecter <ArrowUpRight size={16} /></button>}
          {userLabel && userRole === 'client' && (
            <>
              <Link className="mobile-login account-menu-link" to="/mes-reservations" onClick={onCloseMobileMenu}><CalendarDays size={15} /> Mes réservations</Link>
              <button className="mobile-login account-menu-link" type="button" onClick={onLogout}><LogOut size={15} /> Se déconnecter</button>
            </>
          )}
        </nav>
        <div className="header-actions">
          <button
            className={`favorites-link${favoritesOnly ? ' favorites-link-active' : ''}`}
            type="button"
            onClick={onToggleFavorites}
            aria-label={favoritesOnly ? 'Afficher toutes les voitures' : `Voir mes favoris, ${favoritesCount} voiture(s)`}
          >
            <Heart size={17} fill={favoritesOnly ? 'currentColor' : 'none'} />
            <span>Favoris</span>
            {favoritesCount > 0 && <span className="favorite-count">{favoritesCount}</span>}
          </button>
          {userLabel
            ? userRole === 'client'
              ? <div className="client-account">
                  <span className="client-name" title={userLabel}>{displayName}</span>
                  <Link className="account-action" to="/mes-reservations" aria-label="Consulter mes réservations"><CalendarDays size={16} /><span>Réservations</span></Link>
                  <button className="account-action" type="button" onClick={onLogout} aria-label="Se déconnecter"><LogOut size={16} /><span>Sortir</span></button>
                </div>
              : <span className="login-button user-name" title={userLabel}>{displayName}</span>
            : <button className="login-button" type="button" onClick={onLogin}>Se connecter <ArrowUpRight size={16} /></button>}
        </div>
      </header>
    </>
  )
}

export default SiteHeader
