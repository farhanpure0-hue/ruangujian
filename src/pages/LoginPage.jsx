import { useState } from 'react'
import { GraduationCap, LockKeyhole, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const roleRoutes = { admin: '/admin', guru: '/guru', siswa: '/siswa' }

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
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-3"><GraduationCap size={27} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-200">Ujian sekolah digital</p>
            <p className="text-xl font-bold">RuangUjian CBT</p>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-blue-200">Lokal · Aman · Terstruktur</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Satu ruang untuk persiapan dan pelaksanaan ujian.</h1>
          <p className="mt-5 leading-7 text-slate-300">
            Masuk menggunakan akun yang telah disiapkan pada perangkat laboratorium sekolah.
          </p>
        </div>
        <p className="text-sm text-slate-400">Data disimpan secara lokal pada browser perangkat.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-navy-900 p-2.5 text-white"><GraduationCap size={24} aria-hidden="true" /></div>
            <span className="text-xl font-bold text-navy-950">RuangUjian CBT</span>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-9">
            <p className="text-sm font-semibold text-blue-800">Selamat datang</p>
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
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg bg-navy-900 px-4 py-3 font-semibold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Akun contoh: <strong>admin</strong> / <strong>admin123</strong>. Guru: <strong>guru1</strong> atau{' '}
              <strong>guru2</strong> / <strong>guru123</strong>.
            </div>
            <p className="mt-5 text-center text-sm text-slate-600">
              Peserta ujian?{' '}
              <Link to="/siswa/login" className="font-semibold text-blue-800 hover:text-blue-950">
                Login siswa
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">RuangUjian CBT · Aplikasi ujian lokal sekolah</p>
        </div>
      </section>
    </main>
  )
}
