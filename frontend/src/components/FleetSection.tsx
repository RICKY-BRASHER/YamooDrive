import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Fuel,
  Heart,
  MapPin,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice, imageUrl } from './carData'
import type { CarListing } from './carData'

const categories = ['Toutes', 'Citadine', 'SUV', 'Berline', 'Premium', 'Électrique']

type FleetSectionProps = {
  favorites: number[]
  favoritesOnly: boolean
  onToggleFavorite: (id: number) => void
  onToggleFavoritesOnly: () => void
  vehicles: CarListing[]
  onReserve: (vehicle: CarListing) => void
}

function FleetSection({
  favorites,
  favoritesOnly,
  vehicles,
  onToggleFavorite,
  onToggleFavoritesOnly,
  onReserve,
}: FleetSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Toutes')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recommended')

  const visibleCars = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    const filtered = vehicles.filter((car) => {
      const matchesCategory = activeCategory === 'Toutes' || car.category === activeCategory
      const matchesSearch = !query
        || `${car.brand} ${car.name} ${car.category}`.toLocaleLowerCase('fr').includes(query)
      const matchesFavorites = !favoritesOnly || favorites.includes(car.id)

      return matchesCategory && matchesSearch && matchesFavorites
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      return a.id - b.id
    })
  }, [activeCategory, favorites, favoritesOnly, search, sortBy, vehicles])

  const resetFilters = () => {
    setActiveCategory('Toutes')
    setSearch('')
    if (favoritesOnly) onToggleFavoritesOnly()
  }

  return (
    <section className="fleet-section" id="cars" aria-labelledby="fleet-title">
      <motion.div
        className="fleet-heading"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, visible: {} }}
        transition={{ staggerChildren: 0.1 }}
      >
        <div>
          <motion.div className="eyebrow" variants={riseIn} transition={{ duration: 0.5 }}>
            <span className="eyebrow-line" /> TROUVEZ VOTRE COMPAGNE DE ROUTE
          </motion.div>
          <motion.h2 id="fleet-title" variants={riseIn} transition={{ duration: 0.55 }}>
            La route est à vous<span className="heading-period">.</span>
          </motion.h2>
          <motion.p variants={riseIn} transition={{ duration: 0.55 }}>
            Choisissez un véhicule dans la flotte disponible.
          </motion.p>
        </div>
        <motion.a className="fleet-view-all" href="#cars" variants={riseIn} transition={{ duration: 0.55 }}>
          Toute la flotte <ArrowUpRight size={17} />
        </motion.a>
      </motion.div>

      <div className="catalog-tools">
        <div className="category-list" role="group" aria-label="Filtrer par catégorie">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={`category-chip${activeCategory === category ? ' category-chip-active' : ''}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category === 'Électrique' && <Zap size={14} />}
              {category}
            </button>
          ))}
        </div>
        <div className="catalog-controls">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">Rechercher une voiture</span>
            <input
              type="search"
              placeholder="Marque, modèle..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Effacer la recherche">
                ×
              </button>
            )}
          </label>
          <label className="sort-field">
            <ArrowDownUp size={15} />
            <span className="sr-only">Trier les voitures</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recommended">Recommandées</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <button
            type="button"
            className={`catalog-filter-button${favoritesOnly ? ' catalog-filter-active' : ''}`}
            onClick={onToggleFavoritesOnly}
            aria-pressed={favoritesOnly}
          >
            <SlidersHorizontal size={16} /> <span>{favoritesOnly ? 'Favoris' : 'Filtrer'}</span>
          </button>
        </div>
      </div>

      <div className="catalog-result-line">
        <span><strong>{visibleCars.length}</strong> voiture{visibleCars.length !== 1 ? 's' : ''} à découvrir</span>
        <span className="result-location"><MapPin size={14} /> Flotte mise à jour depuis la base</span>
      </div>

      <motion.div className="car-grid" layout>
        <AnimatePresence mode="popLayout">
          {visibleCars.map((car, index) => (
            <CarCard
              car={car}
              index={index}
              isFavorite={favorites.includes(car.id)}
              onToggleFavorite={onToggleFavorite}
              onReserve={() => onReserve(car)}
              key={car.id}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {visibleCars.length === 0 && (
        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="empty-state-icon"><Search size={24} /></span>
          <h3>Aucune voiture trouvée</h3>
          <p>Essayez une autre recherche ou affichez toute notre sélection.</p>
          <button type="button" onClick={resetFilters}>Réinitialiser les filtres <ArrowRight size={15} /></button>
        </motion.div>
      )}

      <div className="catalog-bottom-note">
        <span><ShieldCheck size={16} /> Tarifs et véhicules de la flotte en temps réel.</span>
        <a href="#offers">Voir nos bons plans <ArrowRight size={14} /></a>
      </div>
    </section>
  )
}

type CarCardProps = {
  car: CarListing
  index: number
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onReserve: () => void
}

function CarCard({ car, index, isFavorite, onToggleFavorite, onReserve }: CarCardProps) {
  return (
    <motion.article
      className="car-card"
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.045, 0.25), layout: { duration: 0.3 } }}
    >
      <div className={`car-image-wrap car-image-${car.accent ?? 'sage'}`}>
        <img
          className="car-image"
          src={imageUrl(car.image)}
          alt={`${car.brand} ${car.name}`}
          loading={index > 3 ? 'lazy' : 'eager'}
        />
        <span className="car-category-label">{car.category}</span>
        {car.badge && (
          <span className={`car-badge${car.isNew ? ' car-badge-new' : ''}`}>
            {car.isNew ? <Sparkles size={12} /> : <Check size={12} />}
            {car.badge}
          </span>
        )}
        <button
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          type="button"
          aria-label={isFavorite ? `Retirer ${car.brand} ${car.name} des favoris` : `Ajouter ${car.brand} ${car.name} aux favoris`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(car.id)}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="car-image-gradient" />
        <span className="car-image-brand">{car.brand}</span>
      </div>
      <div className="car-card-body">
        <div className="car-title-row">
          <div><h3>{car.name}</h3><span className="car-subtitle">{car.brand} <span>·</span> {car.category}</span></div>
        </div>
        <div className="car-specs">
          <span><UsersRound size={14} /> {car.seats} places</span>
          <span><Settings2 size={14} /> {car.transmission}</span>
          <span>{car.fuel === 'Électrique' ? <Zap size={14} /> : <Fuel size={14} />} {car.fuel}</span>
        </div>
        <div className="car-card-footer">
          <div className="car-price">
            <strong>{formatPrice(car.price)}<small> / jour</small></strong>
            <span><Clock3 size={12} /> Dès {formatPrice(car.priceHour)} / heure</span>
          </div>
          <button
            className="car-book-button"
            type="button"
            aria-label={`Réserver ${car.brand} ${car.name}`}
            onClick={onReserve}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

const riseIn = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export default FleetSection
