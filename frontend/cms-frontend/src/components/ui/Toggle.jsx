/** Toggle switch component */
export default function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer gap-2 select-none">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className="relative flex-shrink-0 transition-all duration-200"
        style={{
          width: 40, height: 22, borderRadius: 11,
          backgroundColor: checked ? '#F97316' : 'rgba(255,255,255,0.12)',
          boxShadow: checked ? '0 0 8px rgba(255,153,51,0.4)' : 'none',
        }}
      >
        <div
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: checked ? 21 : 3 }}
        />
      </div>
    </label>
  )
}
