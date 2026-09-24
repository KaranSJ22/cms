import {
  CalendarDaysIcon,
  TableCellsIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useMyBookings } from "../hooks/useMyBookings";
import BookingsTableView from "../components/mybookings/BookingsTableView";
import BookingsCalendarView from "../components/mybookings/BookingsCalendarView";
import BookingDetailModal from "../components/mybookings/BookingDetailModal";
import DayBookingsDrawer from "../components/mybookings/DayBookingsDrawer";

export default function MyBookingsPage() {
  const {
    user,
    bookings,
    loading,
    error,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    serverPagination,
    filteredBookings,
    monthName,
    prevMonth,
    nextMonth,
    setToday,
    monthlyMetrics,
    calendarDays,
    selectedBooking,
    setSelectedBooking,
    selectedDayBookings,
    setSelectedDayBookings,
    loadingDayDetails,
    handleViewBooking,
    handleSelectDay,
  } = useMyBookings();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Booking History
            </h1>
            <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm">
              Comprehensive log of your meal reservations, monthly expenditure, and service records.
            </p>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span>Calendar View</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-3">
          <XCircleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-sm font-medium">Loading your booking history...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-2xl shadow-sm border border-slate-200">
          <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No Booking History Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You haven&apos;t made any meal bookings yet. Go to Pre-Book Meals to plan your catering.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <BookingsTableView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          serverPagination={serverPagination}
          paginatedBookings={filteredBookings}
          handleViewBooking={handleViewBooking}
        />
      ) : (
        <BookingsCalendarView
          monthName={monthName}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          setToday={setToday}
          monthlyMetrics={monthlyMetrics}
          calendarDays={calendarDays}
          handleSelectDay={handleSelectDay}
        />
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        selectedBooking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        user={user}
      />

      {/* Day Breakdown Drawer/Modal */}
      <DayBookingsDrawer
        selectedDayBookings={selectedDayBookings}
        loadingDayDetails={loadingDayDetails}
        onClose={() => setSelectedDayBookings(null)}
      />
    </div>
  );
}
