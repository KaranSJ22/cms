import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Standard confirmation dialog for destructive or state-changing actions
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  loading = false,
}) {
  const buttonStyles = {
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 shadow-md',
    primary:
      'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 shadow-md',
    warning:
      'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 shadow-md',
  }[confirmVariant] || 'bg-rose-600 hover:bg-rose-700 text-white';

  const footer = (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={onClose}
        className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onConfirm}
        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${buttonStyles}`}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      maxWidth="max-w-md"
      showCloseButton={!loading}
      footer={footer}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            confirmVariant === 'danger'
              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              : confirmVariant === 'warning'
              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              : 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
          }`}
        >
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-grotesk">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
