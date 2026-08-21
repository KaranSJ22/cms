import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Emblem, Spinner } from '../../../components/icons/Icons'
import { FormField } from '../../../components/ui/FormComponents'
import { PrimaryBtn } from '../../../components/ui/Buttons'
import { useAuth } from '../../../hooks/useAuth'
import { usePermissions } from '../../../hooks/usePermissions'
import { getDefaultTab } from '../../../routes/routeConfig'

export default function LoginPage() {
  const { login, ssoLogin, error, setError } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]       = useState('password') // 'password' | 'sso'
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [ssoToken, setSsoToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [localErr, setLocalErr] = useState('')

  // After login, user is set in AuthContext — we redirect from AppRoutes.
  // But we also need to get the default tab for navigation.
  async function handleSubmit(e) {
    e.preventDefault()
    setLocalErr('')
    setError('')
    setLoading(true)
    try {
      if (mode === 'sso') {
        await ssoLogin(ssoToken.trim())
      } else {
        await login(loginId.trim(), password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setLocalErr(err.response?.data?.MESSAGE || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayError = localErr || error

  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center px-6"
      onPointerMove={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        e.currentTarget.querySelector('[data-glow]').style.maskImage =
          `radial-gradient(circle at ${x}px ${y}px, #000 72px, transparent 140px)`
        e.currentTarget.querySelector('[data-glow]').style.webkitMaskImage =
          `radial-gradient(circle at ${x}px ${y}px, #000 72px, transparent 140px)`
        e.currentTarget.querySelector('[data-glow]').style.opacity = '1'
      }}
      onPointerLeave={e => {
        e.currentTarget.querySelector('[data-glow]').style.opacity = '0'
      }}
    >
      {/* Saffron dot-grid hover glow */}
      <div
        data-glow
        className="absolute inset-0 pointer-events-none transition-opacity duration-200 opacity-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center,rgba(249,115,22,0.28) 2.2px,transparent 2.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[420px]"
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.08)',
          padding: '2.5rem 2.25rem 2.25rem',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Emblem size={56} />
          </div>
          <h1 className="font-grotesk text-[1.3rem] font-bold text-white tracking-[0.04em] mt-0">
            CMS PORTAL
          </h1>
          <p className="text-[0.75rem] text-white/40 mt-1 tracking-[0.08em] uppercase">
            Canteen Management System
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 mb-6 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          {[
            { key: 'password', label: 'Password Login' },
            { key: 'sso',      label: 'SSO Login'      },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setLocalErr(''); setError('') }}
              className={`
                flex-1 py-1.5 rounded-md text-[0.75rem] font-semibold font-grotesk transition-all duration-150
                ${mode === m.key
                  ? 'bg-orange-500 text-slate-900 shadow-sm'
                  : 'text-white/50 hover:text-white/80'}
              `}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'password' ? (
            <>
              <FormField
                id="loginid"
                label="LOGIN ID"
                type="text"
                value={loginId}
                onChange={setLoginId}
                placeholder="Enter your login ID"
                autoComplete="username"
                required
              />
              <div className="flex flex-col gap-1.5">
                <FormField
                  id="password"
                  label="PASSWORD"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <div className="text-right">
                  <a href="#" className="text-[0.75rem] text-white/40 hover:text-orange-400 transition-colors duration-150">
                    Forgot password?
                  </a>
                </div>
              </div>
            </>
          ) : (
            <FormField
              id="ssotoken"
              label="SSO TOKEN"
              type="text"
              value={ssoToken}
              onChange={setSsoToken}
              placeholder="Paste your SSO token"
              required
            />
          )}

          {displayError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[0.78rem] text-red-400"
              style={{ backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <span className="flex-shrink-0">✕</span>
              {displayError}
            </div>
          )}

          <PrimaryBtn type="submit" loading={loading}>
            {loading
              ? <><Spinner />{mode === 'sso' ? 'Verifying…' : 'Authenticating…'}</>
              : mode === 'sso' ? 'Login with SSO' : 'Login'}
          </PrimaryBtn>
        </form>

        <p className="text-center text-[0.65rem] text-white/20 mt-7 pt-4 tracking-[0.04em]"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          ISRO · Canteen Management System · v1.0
        </p>
      </div>
    </div>
  )
}
