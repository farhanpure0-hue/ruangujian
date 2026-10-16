import { BookOpen, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

const roleLabels = {
  admin: 'Administrator',
  guru: 'Guru',
  siswa: 'Murid',
}

const roleDescriptions = {
  admin: 'Kelola persiapan ujian dan data sekolah dari perangkat ini.',
  guru: 'Kelola materi pembelajaran dan pantau hasil peserta didik.',
  siswa: 'Masuk ke sesi ujian yang disiapkan oleh proktor.',
}

export default function RoleHome() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5"><BookOpen size={23} aria-hidden="true" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">RuangUjian CBT</p>
              <p className="font-semibold">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <LogOut size={16} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-sm font-semibold text-blue-800">Beranda {roleLabels[user.role]}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-950">Halo, {user.name}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">{roleDescriptions[user.role]}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-200 p-5">
              <ShieldCheck className="text-blue-800" size={22} aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-slate-900">Sesi lokal</h2>
              <p className="mt-1 text-sm text-slate-500">
                Login terverifikasi dengan data akun pada IndexedDB perangkat ini.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 p-5">
              <Users className="text-blue-800" size={22} aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-slate-900">Pengembangan bertahap</h2>
              <p className="mt-1 text-sm text-slate-500">
                Fitur {roleLabels[user.role].toLowerCase()} akan tersedia pada tahap berikutnya.
              </p>
            </article>
          </div>
        </section>
        <p className="mt-5 text-xs text-slate-500">Nama pengguna: {user.username}</p>
      </div>
    </main>
  )
}
