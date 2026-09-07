import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../../../components/icons/Icons'
import { FormField } from '../../../components/ui/FormComponents'
import { PrimaryBtn } from '../../../components/ui/Buttons'
import { useAuth } from '../../../hooks/useAuth'
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login, ssoLogin, error, setError } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('password') // 'password' | 'sso'
  const [loginId, setLoginId]   = useState('')
  const [password, setPassword] = useState('')
  const [ssoToken, setSsoToken] = useState('')
  const [loading, setLoading]   = useState(false)
  const [localErr, setLocalErr] = useState('')

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
      setLocalErr(err.response?.data?.MESSAGE || 'Invalid credentials. Please verify your Login ID and password.')
    } finally {
      setLoading(false)
    }
  }

  const displayError = localErr || error

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ── Main Structured Login Panel ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-md shadow-md p-6 sm:p-8">
        
        {/* ── Official ISRO & HSFC Header ── */}
        <div className="text-center mb-6">
          {/* Official ISRO Logo */}
          <div className="flex justify-center mb-3">
            <img
              src="/assets/logo.png"
              alt="ISRO Official Logo"
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <div className="text-[0.68rem] font-bold text-slate-300 tracking-[0.14em] uppercase leading-none">
            भारतीय अंतरिक्ष अनुसंधान संगठन
          </div>
          <div className="text-[0.78rem] font-bold text-white tracking-wide mt-1">
            Indian Space Research Organisation
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[0.68rem] font-bold text-slate-200 tracking-wider uppercase">
              HSFC · Human Space Flight Centre
            </span>
          </div>

          <h1 className="font-grotesk font-bold text-base text-white tracking-wider uppercase mt-3">
            Canteen Management System
          </h1>
          <p className="text-[0.68rem] text-slate-400 mt-0.5 tracking-wide">
            High Reliability Operations & Pre-Booking Portal
          </p>
        </div>

        {/* ── Authentication Mode Toggle ── */}
        <div className="flex gap-1 p-1 mb-5 rounded bg-slate-950 border border-slate-800">
          {[
            { key: 'password', label: 'Password Login' },
            { key: 'sso',      label: 'ISRO SSO Login' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key)
                setLocalErr('')
                setError('')
              }}
              className={`
                flex-1 py-1.5 rounded text-xs font-semibold font-grotesk transition-all duration-150
                ${mode === m.key
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'}
              `}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Login Form ── */}
        {mode === 'password' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="loginid"
              label="LOGIN ID / EMPLOYEE ID"
              type="text"
              value={loginId}
              onChange={setLoginId}
              placeholder="e.g. 10001 or admin"
              autoComplete="username"
              required
            />
            <div className="flex flex-col gap-1">
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
            </div>

            {/* Error Notice */}
            {displayError && (
              <div className="flex items-start gap-2 p-2.5 rounded bg-red-950/40 border border-red-800/80 text-xs text-red-300">
                <span className="font-bold flex-shrink-0">✕</span>
                <span className="leading-tight">{displayError}</span>
              </div>
            )}

            <div className="pt-2">
              <PrimaryBtn type="submit" loading={loading}>
                {loading ? (
                  <>
                    <Spinner />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <span>Sign In to Portal</span>
                )}
              </PrimaryBtn>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
                🛰️
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-grotesk">
                  ISRO Central SSO Gateway
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Log in once at the central identity portal to access all ISRO applications seamlessly.
                </p>
              </div>

              <a
                href={import.meta.env.VITE_SSO_PORTAL_URL || 'http://localhost:5174'}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>Launch ISRO SSO Portal</span>
              </a>
            </div>

            {/* Optional Manual Fallback */}
            <details className="text-[0.7rem] text-slate-400 border-t border-slate-800 pt-3">
              <summary className="cursor-pointer hover:text-slate-200 transition-colors font-medium">
                Advanced: Paste Raw Encrypted SSO Token
              </summary>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
                <FormField
                  id="ssotoken"
                  label="RAW SSO TOKEN"
                  type="text"
                  value={ssoToken}
                  onChange={setSsoToken}
                  placeholder="Paste base64url encrypted token"
                  required
                />
                {displayError && (
                  <div className="p-2 rounded bg-red-950/40 border border-red-800/80 text-xs text-red-300">
                    {displayError}
                  </div>
                )}
                <PrimaryBtn type="submit" loading={loading}>
                  Verify & Enter
                </PrimaryBtn>
              </form>
            </details>
          </div>
        )}

        {/* ── Card Footer ── */}
        <div className="mt-6 pt-4 border-t border-slate-800/90 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[0.64rem] text-slate-400">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Personnel Only · Official ISRO HSFC Network</span>
          </div>
          <div className="text-[0.6rem] text-slate-400">
            CMS Portal v2.4
          </div>
        </div>

      </div>
    </div>
  )
}
