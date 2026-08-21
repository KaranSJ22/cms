import { createContext, useState, useEffect, useContext } from 'react'
import { config } from '../config/app.config'
import api from '../config/axios'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app and provides authentication state.
 *
 * Exposes:
 *   user       — { USERID, LOGINID, FULLNAME, EMAIL, MOBILENO, AUTHPROV,
 *                  SYSTEMROLES: string[], CANTEENROLES: [{CANTEENID, ROLECODE, ISDEFAULT}] }
 *   customer   — { CUSTOMERID, CTYPECODE, DISPNAME } | null
 *   token      — JWT string | null
 *   loading    — boolean (true while restoring session)
 *   login(id, password) → void
 *   ssoLogin(ssoToken)  → void
 *   logout()            → void
 */
export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [customer, setCustomer] = useState(null)
  const [token, setToken]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(config.TOKEN_KEY)
    const savedUser  = localStorage.getItem(config.USER_KEY)
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsed.USER)
        setCustomer(parsed.CUSTOMER ?? null)
      } catch {
        localStorage.removeItem(config.TOKEN_KEY)
        localStorage.removeItem(config.USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  /** Persist auth data to state + localStorage */
  function _persist(data) {
    const { TOKEN, USER: userData, CUSTOMER: customerData } = data
    setToken(TOKEN)
    setUser(userData)
    setCustomer(customerData ?? null)
    setError('')
    localStorage.setItem(config.TOKEN_KEY, TOKEN)
    localStorage.setItem(config.USER_KEY, JSON.stringify({ USER: userData, CUSTOMER: customerData }))
  }

  /** Username/password login → POST /api/auth/login */
  async function login(loginId, password) {
    setError('')
    const res = await api.post('/auth/login', { LOGINID: loginId, PASSWORD: password })
    _persist(res.data.DATA)
  }

  /** SSO token login → POST /api/auth/sso */
  async function ssoLogin(ssoToken) {
    setError('')
    const res = await api.post('/auth/sso', { SSO_TOKEN: ssoToken })
    _persist(res.data.DATA)
  }

  /** Clear session */
  function logout() {
    setUser(null)
    setCustomer(null)
    setToken(null)
    setError('')
    localStorage.removeItem(config.TOKEN_KEY)
    localStorage.removeItem(config.USER_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, customer, token, loading, error, setError, login, ssoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
