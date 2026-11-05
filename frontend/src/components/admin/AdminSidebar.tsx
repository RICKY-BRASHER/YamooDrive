import {
  BadgePercent,
  CalendarDays,
  CarFront,
  LayoutDashboard,
  LogOut,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export type AdminPage = 'dashboard' | 'reservations' | 'fleet' | 'clients' | 'offers'

const navigation: { page: AdminPage; label: string; path: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Vue d’ensemble', path: '/admin', icon: LayoutDashboard },
  { page: 'reservations', label: 'Réservations', path: '/admin/reservations', icon: CalendarDays },
  { page: 'fleet', label: 'Parc automobile', path: '/admin/fleet', icon: CarFront },
  { page: 'clients', label: 'Clients', path: '/admin/clients', icon: UsersRound },
  { page: 'offers', label: 'Bons plans', path: '/admin/offers', icon: BadgePercent },
] 

type AdminSidebarProps = {
  currentPage: AdminPage
  pendingCount: number
  adminName: string
  adminInitials: string
}

function AdminSidebar({ currentPage, pendingCount, adminName, adminInitials }: AdminSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#17172f] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-[258px]">
      <Link to="/" className="flex items-center gap-3 px-6 py-6 text-white no-underline">
        <span className="grid size-10 place-items-center rounded-xl border border-[#e8c879]/40 bg-white/5 text-[#e8c879]">
          <CarFront size={22} />
        </span>
        <span className="font-[Manrope] text-xl font-extrabold tracking-tight">yamoo<span className="font-medium text-[#d0c8e0]">drive</span><i className="text-[#e8c879]">.</i></span>
      </Link>

      <div className="hidden px-6 pb-3 text-[10px] font-bold tracking-[0.18em] text-[#aaa7bd] lg:block">ESPACE AGENCE</div>
      <nav aria-label="Navigation agence" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
        {navigation.map(({ page, label, path, icon: Icon }) => {
          const active = page === currentPage
          return (
            <Link
              to={path}
              key={page}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                active ? 'bg-[#e8c879] text-[#28223b]' : 'text-[#d1cede] hover:bg-white/10 hover:text-white'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
              {page === 'reservations' && pendingCount > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-black/10' : 'bg-white/10'}`}>{pendingCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-white/10 p-4 lg:block">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#e8c879] text-xs font-bold text-[#28223b]">{adminInitials}</span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{adminName}</strong><small className="text-[10px] text-[#aaa7bd]">Administrateur</small></span>
          <button type="button" className="text-[#aaa7bd] hover:text-white" aria-label="Se déconnecter"><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
