import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal dialog for creating an official catering service
 */
export default function ServiceFormModal({
  isOpen,
  onClose,
  serviceForm,
  setServiceForm,
  canteenName,
  canteenCode,
  submitting = false,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-grotesk">
            Create Official Service
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-600 dark:text-orange-400 font-medium">
            Catering Facility:{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {canteenName || 'Selected Canteen'} ({canteenCode || ''})
            </strong>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Official Meeting Snack / High Tea"
              value={serviceForm.SERVNAME}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, SERVNAME: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Brief description of when this service applies"
              value={serviceForm.DESCR}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, DESCR: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cutoff Notice (Hours Prior) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={serviceForm.CUTOFFHOURS}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  CUTOFFHOURS: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Minimum advance notice needed before the event date/time.
            </span>
          </div>

          {/* Required Approval Level */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Required Approval Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex flex-col p-2.5 rounded-xl border-2 cursor-pointer transition ${
                  serviceForm.REQAPPRLVL === 'L1'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reqApprLvl"
                  value="L1"
                  checked={serviceForm.REQAPPRLVL === 'L1'}
                  onChange={() =>
                    setServiceForm({ ...serviceForm, REQAPPRLVL: 'L1' })
                  }
                  className="hidden"
                />
                <span className="text-xs font-bold">Level 1 Approval</span>
                <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                  Employee can select either Level 1 or Level 2 officer
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-xl border-2 cursor-pointer transition ${
                  serviceForm.REQAPPRLVL === 'L2'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reqApprLvl"
                  value="L2"
                  checked={serviceForm.REQAPPRLVL === 'L2'}
                  onChange={() =>
                    setServiceForm({ ...serviceForm, REQAPPRLVL: 'L2' })
                  }
                  className="hidden"
                />
                <span className="text-xs font-bold">Level 2 Approval</span>
                <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                  Employee can strictly select only a Level 2 officer
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
