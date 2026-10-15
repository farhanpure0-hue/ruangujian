import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useAuth } from '../hooks/useAuth.js'

export function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const activityLock = useLiveQuery(() => db.pengaturan.get('kunciAktivitas'), [], null)

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5">
        <p className="text-sm font-medium text-slate-600" role="status">Memeriksa sesi login...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }

  if (
    user.role === 'siswa'
    && activityLock?.nilai?.terkunci
    && location.pathname !== '/siswa/login'
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5">
        <section className="max-w-lg rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy-950">Akses ujian dikunci</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Administrator sedang mengunci aktivitas pada perangkat ini. Hubungi proktor untuk informasi lebih lanjut.</p>
        </section>
      </main>
    )
  }

  return <Outlet />
}
