import { useState } from 'react';
import { generateSsoToken } from './utils/ssoEncrypt';

export default function App() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('http://localhost:5173/sso/callback');
  const [secretKey, setSecretKey] = useState('1234567890123456');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const PRESET_USERS = [
    {
      id: 'perm1',
      name: 'Permanent Employee 1',
      role: 'Perm Staff (Payroll Billed)',
      dept: 'Flight Dynamics Division',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'cont1',
      name: 'Contract Employee 1',
      role: 'Contract Staff (Prepaid Wallet)',
      dept: 'Facility Maintenance',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'mgr1',
      name: 'Canteen Manager 1',
      role: 'Canteen Manager (CNTMGR)',
      dept: 'Canteen Admin & Ops',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'staff1',
      name: 'Canteen Staff 1',
      role: 'Counter Staff (Serving)',
      dept: 'Counter Operations',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'admin',
      name: 'System Administrator',
      role: 'Super Admin (SYSADM)',
      dept: 'IT Infrastructure',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  ];

  const handleLaunch = (targetLoginId) => {
    const selectedId = targetLoginId || loginId;
    if (!selectedId || !selectedId.trim()) {
      setErrorMsg('Please enter a valid ISRO Login ID.');
      return;
    }

    setErrorMsg('');
    try {
      const token = generateSsoToken(selectedId.trim(), secretKey);
      setGeneratedToken(token);
      setIsRedirecting(true);

      const targetDestination = `${callbackUrl}?token=${encodeURIComponent(token)}`;

      // Brief animation before redirecting
      setTimeout(() => {
        window.location.href = targetDestination;
      }, 750);
    } catch (err) {
      setErrorMsg('Failed to generate encrypted token: ' + err.message);
      setIsRedirecting(false);
    }
  };

  const selectPreset = (preset) => {
    setLoginId(preset.id);
    setPassword('••••••••••••');
    handleLaunch(preset.id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0F1D',
      backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(249, 115, 22, 0.15), rgba(255, 255, 255, 0))',
      color: '#E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Background Glows */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'rgba(249, 115, 22, 0.08)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '20%',
        width: '350px',
        height: '350px',
        background: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '860px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        zIndex: 10
      }}>
        {/* ISRO Header Banner */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '1.5rem 2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '1rem',
              backgroundColor: '#1F2937',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
            }}>
              🛰️
            </div>
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: '#F97316',
                textTransform: 'uppercase'
              }}>
                भारतीय अंतरिक्ष अनुसंधान संगठन • ISRO - HSFC
              </div>
              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: '#FFFFFF',
                margin: '0.15rem 0 0 0',
                letterSpacing: '-0.02em'
              }}>
                Central Single Sign-On (SSO) Portal
              </h1>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.7rem',
            fontWeight: '700',
            color: '#34D399'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 8px #10B981'
            }} />
            GATEWAY ONLINE (5-MIN TOKEN)
          </div>
        </div>

        {/* Two-Column Layout: Direct Login & Fast Presets */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Card 1: User Credential Login Form */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🔐</span>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF' }}>
                  Enterprise User Login
                </h2>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: '1.4' }}>
                Authenticate with your official ISRO Login ID. Upon successful authorization, an encrypted 5-minute security assertion will launch the Canteen Management System.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLaunch(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem'
                }}>
                  ISRO Login ID / Username *
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. perm1, cont1, mgr1"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#1F2937',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your SSO password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#1F2937',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem'
                }}>
                  Target CMS Application Endpoint
                </label>
                <input
                  type="text"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#1A2234',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isRedirecting}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  border: 'none',
                  cursor: isRedirecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.39)',
                  transition: 'all 0.2s',
                  opacity: isRedirecting ? 0.7 : 1
                }}
              >
                {isRedirecting ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    Authenticating & Redirecting...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Authenticate & Launch CMS
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card 2: 1-Click Fast Presets for Development & Testing */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1rem' }}>⚡</span>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF' }}>
                  1-Click Test Profiles
                </h2>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: '1.4' }}>
                Click any pre-configured ISRO profile below to instantly generate a signed security assertion and jump directly into that user role.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PRESET_USERS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  disabled={isRedirecting}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '1rem',
                    backgroundColor: '#1A2234',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: isRedirecting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.backgroundColor = '#1A2234'; }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{preset.name}</strong>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'monospace',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '0.35rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#CBD5E1'
                      }}>
                        @{preset.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      {preset.role} • {preset.dept}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#F97316' }}>➔</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Cryptographic Handshake Specs */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: '#64748B'
        }}>
          <div>
            <strong style={{ color: '#94A3B8' }}>Payload:</strong> <code style={{ color: '#F97316' }}>loginId:timestamp</code> |{' '}
            <strong style={{ color: '#94A3B8' }}>Cipher:</strong> AES-128-ECB (PKCS7) |{' '}
            <strong style={{ color: '#94A3B8' }}>Validity:</strong> 300 Seconds (5 Mins)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Key:</span>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.35rem',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                width: '140px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
