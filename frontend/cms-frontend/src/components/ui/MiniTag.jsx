/** MiniTag — shows active/inactive state as a small badge */
export default function MiniTag({ active, label }) {
  return (
    <span
      className={`
        inline-block px-1.5 py-0.5 rounded text-[0.62rem] font-bold tracking-[0.06em] font-grotesk border
        ${active
          ? 'bg-blue-900/8 text-blue-900 border-blue-900/22'
          : 'bg-slate-100 text-slate-400 border-slate-200'}
      `}
    >
      {active ? label : 'OFF'}
    </span>
  )
}
