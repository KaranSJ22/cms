import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/** Convenience hook for consuming AuthContext */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
