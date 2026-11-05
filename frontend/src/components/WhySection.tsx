function WhySection() {
  return (
    <section className="why-section" id="why-yamoo">
      <div className="why-heading">
        <div className="eyebrow"><span className="eyebrow-line" /> L’ESPRIT YAMOO</div>
        <h2>Bien plus qu’une<br />clé, <span>un départ.</span></h2>
      </div>
      <div className="why-copy">
        <p>
          Chez Yamoo Drive, louer une voiture devrait être aussi simple que de prendre la route.
          Une sélection soignée, des tarifs clairs et une vraie équipe pour vous accompagner.
        </p>
        <p className="founders-note">Une aventure imaginée par <strong>Bop Dylan</strong> et <strong>Mk Michelle</strong>.</p>
        <a href="#footer">Faisons connaissance <span aria-hidden="true">→</span></a>
      </div>
      <div className="why-stats">
        <div><strong>10</strong><small>voitures mise en disposition</small></div>
        <span className="why-stat-divider" />
        <div><strong>2</strong><small>façons de louer : heure ou journée</small></div>
        <span className="why-stat-divider" />
        <div><strong>1</strong><small>compte pour suivre vos réservations</small></div>
      </div>
    </section>
  )
}

export default WhySection
