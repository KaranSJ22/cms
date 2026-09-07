import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import { getDefaultTab } from '../../../routes/routeConfig';

export default function SsoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ssoLogin } = useAuth();
  const perms = usePermissions();

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const attemptedRef = useRef(false);

  const token = searchParams.get('token');
  const ssoPortalUrl = import.meta.env.VITE_SSO_PORTAL_URL || 'http://localhost:5174';

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMessage('No SSO authentication token was found in the redirect parameters.');
      return;
    }

    async function authenticate() {
      try {
        const userData = await ssoLogin(token);
        setStatus('success');

        // Allow user to briefly see the success animation before entering
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 600);
      } catch (err) {
        setStatus('error');
        const apiError = err.response?.data?.MESSAGE || err.response?.data?.message || err.message || 'SSO Authentication failed or token expired.';
        setErrorMessage(apiError);
      }
    }

    authenticate();
  }, [token, ssoLogin, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex items-center justify-center p-4 font-inter relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl space-y-6 z-10">
        {/* ISRO Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[0.7rem] font-bold text-orange-400">
          <span>🇮🇳</span> ISRO - HSFC CENTRAL SSO
        </div>

        {status === 'processing' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                🛰️
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-grotesk text-white">
                Verifying SSO Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Decrypting 5-minute security assertion and authenticating session...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/10">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold font-grotesk text-white">
                Authentication Successful
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                Launching Canteen Management System...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              ✕
            </div>
            <div>
              <h2 className="text-xl font-bold font-grotesk text-white">
                SSO Verification Failed
              </h2>
              <p className="text-xs text-rose-300/90 mt-1.5 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={ssoPortalUrl}
                className="w-full py-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-lg shadow-orange-600/20 block"
              >
                Return to ISRO SSO Portal
              </a>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 transition-all"
              >
                Standard Password Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
