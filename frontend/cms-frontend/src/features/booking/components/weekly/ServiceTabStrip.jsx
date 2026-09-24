import { getServiceEmoji } from '../../../../utils/serviceEmoji';

/**
 * Meal Service selector tabs with icon/emoji
 */
export default function ServiceTabStrip({
  availableServices = [],
  activeServiceId,
  onServiceSelect,
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        Meal Service
      </label>
      <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
        {availableServices.length === 0 ? (
          <span className="text-slate-400 text-xs px-2 py-1 italic">
            Loading services...
          </span>
        ) : (
          availableServices.map((srv) => {
            const isSelected = String(activeServiceId) === String(srv.SERVICEID);
            return (
              <button
                key={srv.SERVICEID}
                type="button"
                onClick={() => onServiceSelect(srv.SERVICEID)}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{getServiceEmoji(srv.SERVNAME)}</span>
                <span>{srv.SERVNAME}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
