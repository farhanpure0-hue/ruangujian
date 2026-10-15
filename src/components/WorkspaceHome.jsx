import { BookOpenCheck, Database, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function WorkspaceHome() {
  const { user } = useAuth()
  const role = { admin: 'Administrator', guru: 'Guru', pengawas: 'Pengawas' }[user.role] ?? 'Pengguna'
  const description = user.role === 'admin'
    ? 'Kelola data dasar sekolah, pengguna, persiapan ujian, dan laporan dari perangkat ini.'
    : user.role === 'pengawas'
      ? 'Pantau status dan aktivitas peserta ujian yang berlangsung pada perangkat ini.'
      : 'Kelola bank soal mata pelajaran dan pantau hasil peserta didik.'

  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <p className="text-sm font-semibold text-blue-800">Beranda {role}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-950">Halo, {user.name}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        {description}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-5">
          <ShieldCheck className="text-blue-800" size={22} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-900">Sesi lokal</h2>
          <p className="mt-1 text-sm text-slate-500">Data akun dan ujian tersimpan pada IndexedDB perangkat ini.</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-5">
          <BookOpenCheck className="text-blue-800" size={22} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-900">Bank Soal</h2>
          <p className="mt-1 text-sm text-slate-500">Atur soal, variasi tipe, bobot, dan kunci jawaban.</p>
        </article>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <Database size={15} aria-hidden="true" /> Nama pengguna: {user.username}
      </p>
    </section>
  )
}
