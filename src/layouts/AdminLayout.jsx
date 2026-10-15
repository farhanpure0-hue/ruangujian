import {
  Activity,
  BookOpen,
  Boxes,
  CalendarClock,
  ChartNoAxesCombined,
  GraduationCap,
  Home,
  KeyRound,
  LogOut,
  Settings,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const navigationGroups = [
  {
    label: 'Administrasi & pengguna',
    icon: UsersRound,
    adminOnly: true,
    items: [
      { section: 'data-master', label: 'Data master', icon: Settings },
    ],
  },
  {
    label: 'Pengaturan & penjadwalan ujian',
    icon: CalendarClock,
    items: [
      { section: 'jadwal', label: 'Jadwal ujian', icon: CalendarClock },
      { section: 'token', label: 'Token / kode ujian', icon: KeyRound },
      { section: 'keamanan', label: 'Pengaturan keamanan', icon: ShieldCheck },
      { section: 'daftar-ujian', label: 'Daftar ujian', icon: Boxes },
      { section: 'dasbor', label: 'Dasbor pengerjaan', icon: Activity },
      { section: 'monitoring', label: 'Monitoring pengawas', icon: UsersRound },
    ],
  },
  {
    label: 'Nilai & analisis laporan',
    icon: ChartNoAxesCombined,
    items: [
      { section: 'rekap-nilai', label: 'Rekap nilai', icon: ChartNoAxesCombined },
      { section: 'analisis-butir', label: 'Analisis butir soal', icon: BookOpen },
      { section: 'cetak-dokumen', label: 'Cetak dokumen', icon: BookOpen },
    ],
  },
  {
    label: 'Sistem & pengaturan aplikasi',
    icon: Settings2,
    adminOnly: true,
    items: [
      { section: 'manajemen-peran', label: 'Manajemen peran', icon: UsersRound },
      { section: 'kunci-aktivitas', label: 'Kunci aktivitas', icon: ShieldCheck },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const basePath = `/${user.role}`
  const roleLabel = { admin: 'Administrator', guru: 'Guru', pengawas: 'Pengawas' }[user.role] ?? 'Pengguna'
  const canManageWorkspace = user.role === 'admin' || user.role === 'guru'
  const visibleGroups = navigationGroups
    .filter((group) => !group.adminOnly || user.role === 'admin')
    .map((group) => ({
      ...group,
      items: user.role === 'pengawas'
        ? group.items.filter(({ section }) => ['dasbor', 'monitoring'].includes(section))
        : group.items,
    }))
    .filter((group) => group.items.length)

  function linkClass(isActive, compact = false) {
    return `flex shrink-0 items-center gap-2.5 rounded-lg px-3 ${compact ? 'py-2 text-xs' : 'py-2.5 text-sm'} font-medium transition ${
      isActive ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="bg-navy-950 text-white lg:flex lg:w-72 lg:shrink-0 lg:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="rounded-xl bg-white/10 p-2.5"><GraduationCap size={23} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">RuangUjian</p>
            <p className="font-bold">CBT Sekolah</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{roleLabel}</p>
          <p className="mt-1 truncate text-sm font-medium">{user.name}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-1 lg:flex-col lg:overflow-y-auto" aria-label="Menu utama">
          <NavLink to={basePath} end className={({ isActive }) => linkClass(isActive)}>
            <Home size={17} aria-hidden="true" />Ringkasan
          </NavLink>
          {canManageWorkspace && (
            <NavLink to={`${basePath}/bank-soal`} className={({ isActive }) => linkClass(isActive)}>
              <Boxes size={17} aria-hidden="true" />Bank Soal
            </NavLink>
          )}
          {visibleGroups.map((group) => (
            <div key={group.label} className="min-w-0">
              <p className="flex items-start gap-2 px-3 pb-1 pt-3 text-[10px] font-bold uppercase leading-4 tracking-wider text-slate-400">
                <group.icon className="mt-0.5 shrink-0" size={13} aria-hidden="true" />
                {group.label}
              </p>
              {group.items.map(({ section, label, icon: Icon }) => (
                <NavLink
                  key={section}
                  to={section === 'data-master' ? `${basePath}/data-master` : `${basePath}/operasional/${section}`}
                  className={({ isActive }) => linkClass(isActive, true)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} aria-hidden="true" />Keluar
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
            <LogOut size={16} aria-hidden="true" />Keluar
          </button>
          <div className="hidden items-center gap-2 text-sm text-slate-600 lg:flex">
            <BookOpen size={16} aria-hidden="true" />{user.username}
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
