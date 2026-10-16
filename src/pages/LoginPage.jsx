import { useState } from 'react'
import { GraduationCap, LockKeyhole, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const roleRoutes = { admin: '/admin', guru: '/guru', pengawas: '/pengawas', siswa: '/siswa' }

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100">Memeriksa sesi login...</main>
  }

  if (user) return <Navigate to={roleRoutes[user.role]} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(username, password)
      if (!result.success) {
        setError(result.message)
        return
      }
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath || roleRoutes[result.user.role], { replace: true })
    } catch (loginError) {
      console.error('Login gagal diproses:', loginError)
      setError(`Login tidak dapat diproses: ${loginError.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative isolate grid min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-fuchsia-50 to-cyan-50 lg:grid-cols-[1fr_1fr]">
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-orange-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl lg:hidden" />
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-950 via-fuchsia-800 to-orange-500 p-12 text-white lg:flex xl:p-16">
        <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full border-[38px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="pointer-events-none absolute right-16 top-1/3 h-32 w-32 rotate-12 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm" />
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/20 bg-white/15 p-3 shadow-lg backdrop-blur-sm"><GraduationCap size={27} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-orange-100">Ujian sekolah digital</p>
            <p className="text-xl font-bold">RuangUjian CBT</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-orange-100 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.9)]" />
            LOKAL · AMAN · TERSTRUKTUR
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Satu ruang untuk persiapan dan pelaksanaan ujian.</h1>
          <p className="mt-5 max-w-lg leading-7 text-white/80">
            Masuk menggunakan akun yang telah disiapkan pada perangkat laboratorium sekolah.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium">
            {['Bank soal', 'Jadwal ujian', 'Hasil belajar'].map((label) => (
              <span key={label} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-sm">{label}</span>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/65">Data disimpan secara lokal pada browser perangkat.</p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-2.5 text-white shadow-lg shadow-fuchsia-300/50"><GraduationCap size={24} aria-hidden="true" /></div>
            <span className="text-xl font-bold text-navy-950">RuangUjian CBT</span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-7 shadow-2xl shadow-fuchsia-200/50 backdrop-blur-xl sm:p-9">
            <div className="mb-6 flex items-center justify-center gap-5" aria-label="Logo sekolah dan pemerintah daerah">
              <img src="/logo-propinsi.jpeg" alt="Logo Pemerintah Provinsi" className="h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]" />
              <img src="/logo-smansa-haltim.jpg" alt="Logo SMAN 1 Halmahera Timur" className="h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]" />
            </div>
            <div className="mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" />
            <p className="text-sm font-bold text-fuchsia-700">SELAMAT DATANG</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Masuk ke akun Anda</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan nama pengguna dan kata sandi yang terdaftar.</p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Nama pengguna</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-10 pr-3 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100"
                    placeholder="Nama pengguna"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Kata sandi</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-10 pr-3 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100"
                    placeholder="Kata sandi"
                  />
                </div>
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-fuchsia-300/40 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-fuchsia-200 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 via-fuchsia-50 to-cyan-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Akun contoh: <strong>admin</strong> / <strong>admin123</strong>. Guru: <strong>guru1</strong> atau{' '}
              <strong>guru2</strong> / <strong>guru123</strong>.
            </div>
            <p className="mt-5 text-center text-sm text-slate-600">
              Peserta ujian?{' '}
              <Link to="/siswa/login" className="font-semibold text-blue-800 hover:text-blue-950">
                Login murid
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">RuangUjian CBT · Aplikasi ujian lokal sekolah</p>
        </div>
      </section>
    </main>
  )
}
