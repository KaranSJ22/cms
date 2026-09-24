import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Standard Search Input Component with Icon and Clear Button
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  size = 'md', // 'sm' | 'md'
}) {
  const sizeClasses =
    size === 'sm'
      ? 'pl-8 pr-7 py-1.5 text-xs rounded-lg'
      : 'pl-9 pr-8 py-2 text-xs rounded-xl';

  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4 left-3';

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon
        className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${iconClasses}`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${sizeClasses}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          title="Clear search"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
