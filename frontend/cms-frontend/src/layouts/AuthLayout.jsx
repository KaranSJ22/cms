import { Outlet } from 'react-router-dom'

/**
 * ISRO HSFC Authentication Layout
 * Professional Deep Space Blue canvas with subtle structural grid.
 */
export default function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center font-inter bg-slate-950 text-slate-100 px-4 py-8">
      {/* Subtle utilitarian grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative z-10 w-full flex justify-center">
        <Outlet />
      </div>
    </div>
  )
}
