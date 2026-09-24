import { ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import ComboCard from './ComboCard';

/**
 * Service card container with Cutoff Hours, Approval Level, and list of Combos
 */
export default function ServiceListCard({
  svc,
  expandedCombos = {},
  onToggleExpandCombo,
  onAddComboClick,
  onEditComboClick,
  onDeleteComboClick,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-grotesk">
              {svc.SERVNAME}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                svc.REQAPPRLVL === 'L2'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}
            >
              {svc.REQAPPRLVL === 'L2'
                ? 'Level 2 Approval Required'
                : 'Level 1 Approval Required'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {svc.DESCR || 'Departmental and conference catering service.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Cutoff Notice
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-orange-500" />
              {svc.CUTOFFHOURS} hours prior
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddComboClick(svc.OFFSERVID)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Combo</span>
          </button>
        </div>
      </div>

      {/* Combos Grid */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-grotesk">
            Predefined Combos under this service ({svc.COMBOS?.length || 0})
          </h4>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any combo card to view included dishes
          </span>
        </div>

        {!svc.COMBOS || svc.COMBOS.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-400 text-center border border-dashed border-slate-200 dark:border-slate-700">
            No combos added yet. Click &apos;Add Combo&apos; to configure packaged options
            with live dish costing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {svc.COMBOS.map((combo) => (
              <ComboCard
                key={combo.OFFCOMBOID}
                combo={combo}
                serviceId={svc.OFFSERVID}
                isExpanded={
                  expandedCombos[svc.OFFSERVID] === combo.OFFCOMBOID
                }
                onToggleExpand={() =>
                  onToggleExpandCombo(svc.OFFSERVID, combo.OFFCOMBOID)
                }
                onEdit={() => onEditComboClick(svc.OFFSERVID, combo)}
                onDelete={() =>
                  onDeleteComboClick(combo.OFFCOMBOID, combo.COMBONAME)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
