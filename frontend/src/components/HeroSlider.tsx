import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Pause, Play, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { imageUrl } from './carData'
import type { AgencyVehicle } from './admin/agencyData'

const slideInterval = 5000

function HeroSlider({ vehicles }: { vehicles: AgencyVehicle[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const featuredCars = useMemo(() => vehicles.slice(0, 3), [vehicles])
  const displayedIndex = featuredCars.length ? activeIndex % featuredCars.length : 0
  const activeCar = featuredCars[displayedIndex]

  useEffect(() => {
    if (isPaused || reduceMotion || featuredCars.length < 2) return

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % featuredCars.length)
    }, slideInterval)

    return () => window.clearInterval(timer)
  }, [featuredCars.length, isPaused, reduceMotion])

  const showSlide = (index: number) => {
    setActiveIndex((index + featuredCars.length) % featuredCars.length)
  }

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-content">
        <motion.div
          className="hero-copy"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.08 }}
          variants={{ hidden: {}, visible: {} }}
        >
          <motion.div className="eyebrow hero-eyebrow" variants={riseIn} transition={{ duration: 0.55 }}>
            <span className="eyebrow-line" />
            <span>Votre prochaine aventure commence ici</span>
          </motion.div>
          <motion.h1 id="hero-title" variants={riseIn} transition={{ duration: 0.65 }}>
            Le bon volant.<br />
            <span>Le bon moment.</span>
          </motion.h1>
          <motion.p className="hero-description" variants={riseIn} transition={{ duration: 0.6 }}>
            La liberté de choisir, le plaisir de partir.<br className="desktop-break" />
            Trouvez la voiture qui vous ressemble.
          </motion.p>
          <motion.div className="hero-actions" variants={riseIn} transition={{ duration: 0.6 }}>
            <a className="button-primary" href="#cars">
              Explorer les voitures <ArrowRight size={17} />
            </a>
            <div className="hero-assurance">
              <span className="assurance-icon"><ShieldCheck size={17} /></span>
              <span>Réservation simple<br /><strong>et accompagnement humain</strong></span>
            </div>
          </motion.div>
        </motion.div>

        <div
          className="hero-visual"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
          }}
          aria-roledescription="carrousel"
          aria-label="Voitures à la une"
        >
          {activeCar && (
            <AnimatePresence mode="wait">
              <motion.img
                key={activeCar.id}
                src={imageUrl(activeCar.image, 1500)}
                alt={`${activeCar.brand} ${activeCar.name}`}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.045 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.99 }}
                transition={{ duration: reduceMotion ? 0 : 0.65, ease: 'easeOut' }}
              />
            </AnimatePresence>
          )}
          <div className="hero-image-shade" />
          {activeCar && <div className="hero-slide-caption" aria-live="polite">
            <span className="note-icon"><MapPin size={15} /></span>
            <span>
              <strong>{activeCar.brand} {activeCar.name}</strong>
              <small>{activeCar.category} · Dès {new Intl.NumberFormat('fr-FR').format(activeCar.price)} F / jour</small>
            </span>
            <a href="#cars" aria-label="Découvrir les voitures"><ArrowUpRight size={16} /></a>
          </div>}
          {featuredCars.length > 0 && <div className="hero-slider-controls">
            <div className="hero-slide-dots" role="group" aria-label="Choisir une voiture à la une">
              {featuredCars.map((car, index) => (
                <button
                  type="button"
                  key={car.id}
                  className={`hero-slide-dot${index === activeIndex ? ' is-active' : ''}`}
                  aria-label={`Afficher ${car.brand} ${car.name}`}
                  aria-pressed={index === displayedIndex}
                  onClick={() => showSlide(index)}
                />
              ))}
            </div>
            <span className="hero-image-index"><span>0{displayedIndex + 1}</span> / 0{featuredCars.length}</span>
            <button
              type="button"
              className="hero-slider-toggle"
              aria-label={isPaused ? 'Reprendre le carrousel' : 'Mettre le carrousel en pause'}
              aria-pressed={isPaused}
              onClick={() => setIsPaused((paused) => !paused)}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>}
        </div>

        <div className="hero-watermark" aria-hidden="true">Y</div>
      </div>
      <div className="hero-bottom">
        <span><span className="hero-dot" /> Parc automobile mis à jour en temps réel</span>
        <span>Du premier trajet au dernier kilomètre <ArrowRight size={14} /></span>
      </div>
    </section>
  )
}

const riseIn = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export default HeroSlider
