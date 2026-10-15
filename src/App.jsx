import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import RoleHome from './components/RoleHome.jsx'
import WorkspaceHome from './components/WorkspaceHome.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import AdminLayout from './layouts/AdminLayout.jsx'
import { ensureDefaultClasses } from './db/defaultClasses.js'
import { ensureDefaultSubjects } from './db/defaultSubjects.js'
import LoginPage from './pages/LoginPage.jsx'
import StudentLoginPage from './pages/StudentLoginPage.jsx'
import OperationsPage from './pages/admin/OperationsPage.jsx'
import MasterDataPage from './pages/admin/MasterDataPage.jsx'
import QuestionBankPage from './pages/admin/QuestionBankPage.jsx'
import { seedDatabase } from './db/seed.js'

function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? `/${user.role}` : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/siswa/login" element={<StudentLoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<WorkspaceHome />} />
          <Route path="data-master" element={<MasterDataPage />} />
          <Route path="bank-soal" element={<QuestionBankPage />} />
          <Route path="operasional/:section" element={<OperationsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
        <Route path="/guru" element={<AdminLayout />}>
          <Route index element={<WorkspaceHome />} />
          <Route path="bank-soal" element={<QuestionBankPage />} />
          <Route path="operasional/:section" element={<OperationsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['pengawas']} />}>
        <Route path="/pengawas" element={<AdminLayout />}>
          <Route index element={<WorkspaceHome />} />
          <Route path="operasional/:section" element={<OperationsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
        <Route path="/siswa/*" element={<RoleHome />} />
      </Route>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  )
}

export default function App() {
  const [startup, setStartup] = useState('loading')

  useEffect(() => {
    let active = true
    seedDatabase()
      .then(() => ensureDefaultSubjects())
      .then(() => ensureDefaultClasses())
      .then(() => {
        if (active) setStartup('ready')
      })
      .catch((error) => {
        console.error('Gagal menyiapkan database CBT:', error)
        if (active) setStartup(`error: ${error.message}`)
      })

    return () => {
      active = false
    }
  }, [])

  if (startup === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5">
        <p className="text-sm font-medium text-slate-600" role="status">Menyiapkan database lokal...</p>
      </main>
    )
  }

  if (startup.startsWith('error:')) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5">
        <p className="max-w-xl rounded-xl border border-red-200 bg-white p-5 text-sm text-red-800" role="alert">
          Database gagal disiapkan: {startup.slice(7)}
        </p>
      </main>
    )
  }

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
