import ConfirmDialog from '../../../../components/common/ConfirmDialog';

/**
 * Modal to confirm meal cancellation for a booked slot
 */
export default function CancelBookingModal({
  bookingData,
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!bookingData) return null;

  const { servName, dateStr } = bookingData;

  return (
    <ConfirmDialog
      isOpen={Boolean(bookingData)}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Cancel ${servName} Booking?`}
      message={`Are you sure you want to cancel your ${servName} meal booking for ${dateStr}? The meal slot will be released and any refundable amount will be credited according to policy.`}
      confirmText="Yes, Cancel Booking"
      cancelText="Keep Booking"
      confirmVariant="danger"
      loading={loading}
    />
  );
}
