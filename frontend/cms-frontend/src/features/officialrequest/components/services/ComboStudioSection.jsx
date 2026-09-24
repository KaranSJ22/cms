import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ComboItemPicker from '../ComboItemPicker';
import ComboCostCalculator from '../ComboCostCalculator';
import ComboPackageForm from './ComboPackageForm';
import ComboDishesTray from './ComboDishesTray';

/**
 * In-Page Dual-Column Studio for Creating / Editing Combos with Live Costing
 */
export default function ComboStudioSection({
  activeService,
  editingComboId,
  comboForm,
  setComboForm,
  handlingCharge,
  onHandlingChange,
  grossTotal,
  totalPortions,
  availableItems,
  loadingItems,
  submitting,
  onAddItem,
  onRemoveItem,
  onUpdateQty,
  onSyncSuggestedPrice,
  onSaveCombo,
  onClose,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar Navigation for Studio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Back to Services"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                Combo Studio
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-grotesk tracking-tight">
                {activeService?.SERVNAME || 'Official Catering Service'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bundle catalog items into fixed-price packages. Browse dishes on the
              left, review live pricing on the right.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveCombo}
            disabled={
              submitting ||
              comboForm.ITEMS.length === 0 ||
              !comboForm.COMBONAME.trim()
            }
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>
              {submitting
                ? 'Saving...'
                : editingComboId
                ? 'Update Combo'
                : 'Save Combo Package'}
            </span>
          </button>
        </div>
      </div>

      {/* Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Menu Items Catalog Shelf (7 cols / ~58%) */}
        <div className="lg:col-span-7">
          <ComboItemPicker
            availableItems={availableItems}
            loadingItems={loadingItems}
            selectedItems={comboForm.ITEMS}
            onAddItem={onAddItem}
          />
        </div>

        {/* RIGHT COLUMN: Combo Details, Added Items, and Cost Calculator (5 cols / ~42%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Package Identity */}
          <ComboPackageForm
            comboForm={comboForm}
            setComboForm={setComboForm}
          />

          {/* Card 2: Selected Dishes Tray */}
          <ComboDishesTray
            items={comboForm.ITEMS}
            totalPortions={totalPortions}
            onUpdateQty={onUpdateQty}
            onRemoveItem={onRemoveItem}
          />

          {/* Card 3: Live Costing & Price Breakdown Calculator */}
          <ComboCostCalculator
            grossTotal={grossTotal}
            handlingCharge={handlingCharge}
            onHandlingChange={onHandlingChange}
            comboPrice={comboForm.COMBOPRICE}
            onComboPriceChange={(val) =>
              setComboForm({ ...comboForm, COMBOPRICE: val })
            }
            onSyncSuggested={onSyncSuggestedPrice}
          />

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveCombo}
              disabled={
                submitting ||
                comboForm.ITEMS.length === 0 ||
                !comboForm.COMBONAME.trim()
              }
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editingComboId
                ? 'Update Combo Package'
                : 'Save Combo Package'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
