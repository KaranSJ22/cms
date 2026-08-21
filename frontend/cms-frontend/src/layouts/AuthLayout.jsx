import { Outlet } from 'react-router-dom'

/** Unauthenticated layout — dark navy background with dot-grid pattern (Login page) */
export default function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center font-inter"
      style={{ backgroundColor: '#0F172A' }}>
      {/* Base dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at center,rgba(0,0,0,0.04) 1.2px,transparent 1.4px)', backgroundSize: '22px 22px' }} />
      {/* Saffron radial glow */}
      <div className="absolute pointer-events-none"
        style={{ width: 520, height: 520, borderRadius: '50%', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 70%)' }} />
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  )
}
