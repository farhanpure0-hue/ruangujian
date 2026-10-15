import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { db } from '../db/db.js'
import { verifyPassword } from '../utils/hash.js'

const SESSION_KEY = 'ruangujian.session'
export const AuthContext = createContext(null)

function readStoredSession() {
  const value = localStorage.getItem(SESSION_KEY)
  if (!value) return null

  try {
    const session = JSON.parse(value)
    if (
      session
      && Number.isInteger(session.id)
      && typeof session.username === 'string'
      && ['admin', 'guru', 'siswa'].includes(session.role)
    ) {
      return session
    }
    throw new TypeError('Format sesi tidak valid.')
  } catch (error) {
    console.error('Sesi login lokal tidak dapat dibaca:', error)
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const savedSession = readStoredSession()
        if (!savedSession) return

        const account = await db.users.get(savedSession.id)
        if (!account || !account.aktif || account.username !== savedSession.username) {
          localStorage.removeItem(SESSION_KEY)
          return
        }

        if (active) {
          setUser({
            id: account.id,
            username: account.username,
            name: account.nama,
            role: account.role,
            siswaId: account.siswaId ?? null,
            guruId: account.guruId ?? null,
          })
        }
      } catch (error) {
        console.error('Gagal memulihkan sesi login:', error)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const normalizedUsername = username.trim()
    if (!normalizedUsername || !password) {
      return { success: false, message: 'Nama pengguna dan kata sandi wajib diisi.' }
    }

    const account = await db.users.where('username').equals(normalizedUsername).first()
    if (!account || !account.aktif) {
      return { success: false, message: 'Nama pengguna atau kata sandi tidak sesuai.' }
    }

    const validPassword = await verifyPassword(password, account.passwordHash)
    if (!validPassword) {
      return { success: false, message: 'Nama pengguna atau kata sandi tidak sesuai.' }
    }

    const session = {
      id: account.id,
      username: account.username,
      name: account.nama,
      role: account.role,
      siswaId: account.siswaId ?? null,
      guruId: account.guruId ?? null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return { success: true, user: session }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
