import { useState } from 'react'
import { config } from '../config/app.config'
import api from '../config/axios'
import { AuthContext } from './authContextDef'

function getInitialAuthState() {
  try {
    const savedToken = localStorage.getItem(config.TOKEN_KEY)
    const savedUser  = localStorage.getItem(config.USER_KEY)
    if (savedToken && savedUser) {
      const parsed = JSON.parse(savedUser)
      const cRoles = parsed.USER?.CANTEENROLES || []
      const savedCanteenId = localStorage.getItem('cms_active_canteen_id')
      let activeCanteenId = null

      if (savedCanteenId && cRoles.some(r => r.CANTEENID === Number(savedCanteenId))) {
        activeCanteenId = Number(savedCanteenId)
      } else if (cRoles.length > 0) {
        const defaultC = cRoles.find(r => r.ISDEFAULT) || cRoles[0]
        activeCanteenId = defaultC.CANTEENID
        localStorage.setItem('cms_active_canteen_id', String(defaultC.CANTEENID))
      }

      return {
        token: savedToken,
        user: parsed.USER,
        customer: parsed.CUSTOMER ?? null,
        activeCanteenId
      }
    }
  } catch {
    localStorage.removeItem(config.TOKEN_KEY)
    localStorage.removeItem(config.USER_KEY)
    localStorage.removeItem('cms_active_canteen_id')
  }

  return {
    token: null,
    user: null,
    customer: null,
    activeCanteenId: null
  }
}

/**
 * AuthProvider — wraps the app and provides authentication state.
 */
export function AuthProvider({ children }) {
  const [initial] = useState(getInitialAuthState)
  const [user, setUser] = useState(initial.user)
  const [customer, setCustomer] = useState(initial.customer)
  const [token, setToken] = useState(initial.token)
  const [activeCanteenId, setActiveCanteenIdState] = useState(initial.activeCanteenId)
  const [loading] = useState(false)
  const [error, setError] = useState('')

  function setActiveCanteenId(id) {
    const numericId = Number(id)
    setActiveCanteenIdState(numericId)
    localStorage.setItem('cms_active_canteen_id', String(numericId))
  }

  /** Persist auth data to state + localStorage */
  function _persist(data) {
    const { TOKEN, USER: userData, CUSTOMER: customerData } = data
    setToken(TOKEN)
    setUser(userData)
    setCustomer(customerData ?? null)
    setError('')
    localStorage.setItem(config.TOKEN_KEY, TOKEN)
    localStorage.setItem(config.USER_KEY, JSON.stringify({ USER: userData, CUSTOMER: customerData }))

    const cRoles = userData?.CANTEENROLES || []
    if (cRoles.length > 0) {
      const defaultC = cRoles.find(r => r.ISDEFAULT) || cRoles[0]
      setActiveCanteenIdState(defaultC.CANTEENID)
      localStorage.setItem('cms_active_canteen_id', String(defaultC.CANTEENID))
    }
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
    const res = await api.post('/auth/sso', { token: ssoToken })
    _persist(res.data.DATA)
    return res.data.DATA
  }

  /** Clear session */
  function logout() {
    setUser(null)
    setCustomer(null)
    setToken(null)
    setActiveCanteenIdState(null)
    setError('')
    localStorage.removeItem(config.TOKEN_KEY)
    localStorage.removeItem(config.USER_KEY)
    localStorage.removeItem('cms_active_canteen_id')
  }

  const activeCanteen = user?.CANTEENROLES?.find(r => r.CANTEENID === activeCanteenId) || user?.CANTEENROLES?.[0] || null

  return (
    <AuthContext.Provider value={{ 
      user, 
      customer, 
      token, 
      activeCanteenId: activeCanteenId || activeCanteen?.CANTEENID || null,
      activeCanteen,
      setActiveCanteenId,
      loading, 
      error, 
      setError, 
      login, 
      ssoLogin, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { useAuth } from '../hooks/useAuth'
