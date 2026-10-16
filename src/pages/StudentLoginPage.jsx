import { useState } from 'react'
import { ArrowLeft, GraduationCap, LockKeyhole, TicketCheck, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function StudentLoginPage() {
  const { user, isLoading, loginStudent } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100">Memeriksa sesi murid...</main>
  }

  if (user) return <Navigate to={`/${user.role}`} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await loginStudent(identifier, password)
      if (!result.success) {
        setError(result.message)
        return
      }
      navigate('/siswa', { replace: true })
    } catch (loginError) {
      console.error('Login siswa gagal diproses:', loginError)
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
        <Link to="/login" className="relative flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200">
          <div className="rounded-xl border border-white/20 bg-white/15 p-3 shadow-lg backdrop-blur-sm"><GraduationCap size={27} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-orange-100">Ujian sekolah digital</p>
            <p className="text-xl font-bold">RuangUjian CBT</p>
          </div>
        </Link>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-100 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.9)]" />
            HALAMAN PESERTA UJIAN
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Siapkan diri, lalu masuk ke ruang ujian.</h1>
          <p className="mt-5 leading-7 text-white/80">
            Gunakan NISN atau nomor peserta dan kata sandi yang dibagikan oleh sekolah.
          </p>
        </div>
        <p className="text-sm text-white/65">Pastikan Anda menggunakan komputer ujian yang telah disiapkan proktor.</p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-2.5 text-white shadow-lg shadow-fuchsia-300/50"><GraduationCap size={24} aria-hidden="true" /></div>
              <span className="text-xl font-bold text-navy-950">RuangUjian CBT</span>
            </div>
            <Link to="/login" aria-label="Kembali ke login umum" className="rounded-lg p-2 text-slate-600 hover:bg-white/80">
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-7 shadow-2xl shadow-fuchsia-200/50 backdrop-blur-xl sm:p-9">
            <div className="mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" />
            <div className="mb-5 inline-flex rounded-xl bg-gradient-to-br from-violet-100 via-fuchsia-100 to-orange-100 p-3 text-fuchsia-800">
              <GraduationCap size={24} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-fuchsia-700">PORTAL PESERTA</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Login Murid</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk menggunakan NISN atau nomor peserta ujian.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="student-identifier" className="mb-2 block text-sm font-medium text-slate-700">
                  NISN / Nomor peserta
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                  <input
                    id="student-identifier"
                    name="identifier"
                    autoComplete="username"
                    autoFocus
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-10 pr-3 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100"
                    placeholder="Masukkan NISN atau nomor peserta"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="student-password" className="mb-2 block text-sm font-medium text-slate-700">Kata sandi</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                  <input
                    id="student-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-10 pr-3 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100"
                    placeholder="Masukkan kata sandi"
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
                {isSubmitting ? 'Memeriksa data murid...' : 'Masuk ke akun murid'}
              </button>
            </form>

            <div className="mt-6 flex gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 via-fuchsia-50 to-cyan-50 px-4 py-3 text-xs leading-5 text-slate-600">
              <TicketCheck className="mt-0.5 shrink-0 text-blue-700" size={17} aria-hidden="true" />
              <p>Gunakan data login dari sekolah. Jika akun tidak ditemukan atau belum aktif, hubungi admin/proktor.</p>
            </div>
            <p className="mt-5 text-center text-sm text-slate-600">
              Admin atau guru?{' '}
              <Link to="/login" className="font-semibold text-blue-800 hover:text-blue-950">Login di sini</Link>
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">RuangUjian CBT · Data tersimpan lokal pada perangkat ini</p>
        </div>
      </section>
    </main>
  )
}
