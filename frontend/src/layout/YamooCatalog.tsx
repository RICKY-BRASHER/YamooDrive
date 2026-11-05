import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicReservationModal from '../components/booking/PublicReservationModal'
import BenefitStrip from '../components/BenefitStrip'
import ClientAuthModal from '../components/ClientAuthModal'
import ClosingCta from '../components/ClosingCta'
import FleetSection from '../components/FleetSection'
import HeroSlider from '../components/HeroSlider'
import OfferBanner from '../components/OfferBanner' 
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import Toast from '../components/Toast'
import WhySection from '../components/WhySection'
import { getApiErrorMessage, getCurrentUser, getPublicCatalog, logoutUser, type AuthUser } from '../services/api'
import type { AgencyOffer, AgencyVehicle } from '../components/admin/agencyData'
import type { CarListing } from '../components/carData'
import './YamooCatalog.css'

function YamooCatalog() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<number[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [toast, setToast] = useState(() =>
    new URLSearchParams(window.location.search).get('email_verified') === '1'
      ? 'Votre adresse e-mail est vérifiée. Vous pouvez maintenant vous connecter.'
      : '',
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('login') === '1',
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const [vehicles, setVehicles] = useState<AgencyVehicle[]>([])
  const [offers, setOffers] = useState<AgencyOffer[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<AgencyVehicle | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    Promise.all([getCurrentUser(), getPublicCatalog()])
      .then(([currentUser, catalog]) => {
        if (!isMounted) return
        setUser(currentUser)
        setVehicles(catalog.vehicles)
        setOffers(catalog.offers)
      })
      .catch((error: unknown) => {
        if (isMounted) setToast(getApiErrorMessage(error))
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(''), 3400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('email_verified') !== '1') return

    url.searchParams.delete('email_verified')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('login') !== '1') return

    url.searchParams.delete('login')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
    )
  }

  const toggleFavoritesOnly = () => {
    setFavoritesOnly((only) => !only)
    document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })
  }

  const openAuthModal = useCallback(() => setAuthModalOpen(true), [])
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), [])

  const signOut = async () => {
    try {
      await logoutUser()
      setUser(null)
      setToast('Vous êtes déconnecté.')
    } catch (error: unknown) {
      setToast(getApiErrorMessage(error))
    }
  }

  const startUserSession = (user: AuthUser) => {
    setUser(user)
    if (user.role === 'admin') {
      navigate('/admin')
      return
    }
    if (selectedVehicle) {
      setBookingOpen(true)
      return
    }
    setToast(`Bienvenue ${user.name} !`)
  }

  const reserveVehicle = (vehicle: CarListing) => {
    const liveVehicle = vehicles.find((item) => item.id === vehicle.id)
    if (!liveVehicle) {
      setToast('Ce véhicule n’est plus disponible dans la flotte.')
      return
    }
    if (user?.role === 'admin') {
      setToast('Connectez-vous avec un compte client pour envoyer une demande de location.')
      return
    }
    setSelectedVehicle(liveVehicle)
    if (user?.role === 'client') setBookingOpen(true)
    else setAuthModalOpen(true)
  }

  return ( 
    <div className="yamoo-app">
      <SiteHeader
        favoritesCount={favorites.length}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={toggleFavoritesOnly}
        onLogin={openAuthModal}
        onLogout={signOut}
        userLabel={user?.name ?? ''}
        userRole={user?.role}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />
      <main>
        <HeroSlider vehicles={vehicles} />
        <BenefitStrip />
        <FleetSection
          vehicles={vehicles}
          favorites={favorites}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={toggleFavorite}
          onToggleFavoritesOnly={toggleFavoritesOnly}
          onReserve={reserveVehicle}
        />
        <OfferBanner offers={offers} />
        <WhySection />
        <ClosingCta />
      </main>
      <SiteFooter />
      <Toast message={toast} onClose={() => setToast('')} />
      {authModalOpen && (
        <ClientAuthModal
          onClose={closeAuthModal}
          onAuthenticated={startUserSession}
        />
      )}
      {bookingOpen && selectedVehicle && (
        <PublicReservationModal
          vehicle={selectedVehicle}
          offers={offers}
          licenseNumber={user?.licenseNumber ?? null}
          onClose={() => {
            setBookingOpen(false)
            setSelectedVehicle(null)
          }}
          onCreated={(reservationId) => {
            setBookingOpen(false)
            setSelectedVehicle(null)
            setToast(`Demande ${reservationId} envoyée. L’agence vous recontactera pour confirmation.`)
          }}
        />
      )}
    </div>
  )
}

export default YamooCatalog
