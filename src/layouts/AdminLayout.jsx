import { BookOpen, Boxes, GraduationCap, Home, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const basePath = `/${user.role}`
  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Guru'
  const links = [
    { to: basePath, label: 'Ringkasan', icon: Home, end: true },
    { to: `${basePath}/bank-soal`, label: 'Bank Soal', icon: Boxes },
  ]

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="bg-navy-950 text-white lg:flex lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="rounded-xl bg-white/10 p-2.5"><GraduationCap size={23} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">RuangUjian</p>
            <p className="font-bold">CBT Sekolah</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{roleLabel}</p>
          <p className="mt-1 truncate text-sm font-medium">{user.name}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-1 lg:flex-col" aria-label="Menu utama">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-semibold text-navy-900">Panel {roleLabel}</p>
            <p className="text-xs text-slate-500">Pengelolaan ujian sekolah</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            <LogOut size={16} aria-hidden="true" />
            Keluar
          </button>
          <div className="hidden items-center gap-2 text-sm text-slate-600 lg:flex">
            <BookOpen size={16} aria-hidden="true" />
            {user.username}
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
