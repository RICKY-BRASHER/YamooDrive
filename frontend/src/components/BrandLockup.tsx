type BrandLockupProps = {
  footer?: boolean
}

function BrandLockup({ footer = false }: BrandLockupProps) {
  return (
    <a
      className={`brand-lockup${footer ? ' footer-brand-lockup' : ''}`}
      href="#"
      aria-label="Yamoo Drive — accueil"
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M9 29.5h30l-2.2-9.2a3.8 3.8 0 0 0-3.7-2.9H17.9a4 4 0 0 0-3.7 2.6L9 29.5Z" />
          <path d="M12.5 29.5v4.1a2.4 2.4 0 0 0 2.4 2.4h2.2m16.2 0h1.8a2.4 2.4 0 0 0 2.4-2.4v-4.1M15.4 24h17.2" />
          <circle cx="18" cy="31.5" r="2.4" />
          <circle cx="31" cy="31.5" r="2.4" />
          <path className="brand-mark-star" d="m24 7 1.1 3.1L28 11l-2.9 1-1.1 3.1-1-3.1-3-1 3-1L24 7Z" />
        </svg>
      </span>
      <span className="brand-name">YAMOO<span>drive</span><i>.</i></span>
    </a>
  )
}

export default BrandLockup
