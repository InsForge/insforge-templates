import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { insforge } from './insforge'

type AuthUser = { id: string; email: string } | null

type AuthContextValue = {
  user: AuthUser
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    if (error || !data?.user) {
      setUser(null)
    } else {
      const u = data.user as { id: string; email: string }
      setUser({ id: u.id, email: u.email })
    }
  }

  useEffect(() => {
    let mounted = true
    void (async () => {
      await refresh()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await insforge.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
