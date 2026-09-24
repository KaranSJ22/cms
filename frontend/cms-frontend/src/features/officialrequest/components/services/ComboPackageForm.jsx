/**
 * Card 1: Package Identity Form (Name and Service Notes)
 */
export default function ComboPackageForm({ comboForm, setComboForm }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
        1. Combo Package Info
      </h3>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Combo Package Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Samosa + Filter Coffee Snack Pack"
          value={comboForm.COMBONAME}
          onChange={(e) =>
            setComboForm({ ...comboForm, COMBONAME: e.target.value })
          }
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Description / Service Notes
        </label>
        <input
          type="text"
          placeholder="e.g. Served in paper conference trays with mint chutney"
          value={comboForm.DESCR}
          onChange={(e) =>
            setComboForm({ ...comboForm, DESCR: e.target.value })
          }
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>
    </div>
  );
}
