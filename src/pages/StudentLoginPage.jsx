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
    return <main className="grid min-h-screen place-items-center bg-slate-100">Memeriksa sesi siswa...</main>
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
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <Link to="/login" className="flex w-fit items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
          <div className="rounded-xl bg-white/10 p-3"><GraduationCap size={27} aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-200">Ujian sekolah digital</p>
            <p className="text-xl font-bold">RuangUjian CBT</p>
          </div>
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-blue-200">Halaman peserta ujian</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Siapkan diri, lalu masuk ke ruang ujian.</h1>
          <p className="mt-5 leading-7 text-slate-300">
            Gunakan NISN atau nomor peserta dan kata sandi yang dibagikan oleh sekolah.
          </p>
        </div>
        <p className="text-sm text-slate-400">Pastikan Anda menggunakan komputer ujian yang telah disiapkan proktor.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-navy-900 p-2.5 text-white"><GraduationCap size={24} aria-hidden="true" /></div>
              <span className="text-xl font-bold text-navy-950">RuangUjian CBT</span>
            </div>
            <Link to="/login" aria-label="Kembali ke login umum" className="rounded-lg p-2 text-slate-600 hover:bg-white">
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-9">
            <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-800">
              <GraduationCap size={24} aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-blue-800">Portal peserta</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Login Siswa</h2>
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
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg bg-navy-900 px-4 py-3 font-semibold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Memeriksa data siswa...' : 'Masuk ke akun siswa'}
              </button>
            </form>

            <div className="mt-6 flex gap-3 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
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
