import { BuildingStorefrontIcon, EyeIcon } from "@heroicons/react/24/outline";
import BookingsFilterBar from "./BookingsFilterBar";

export default function BookingsTableView({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  pageSize,
  serverPagination,
  paginatedBookings,
  handleViewBooking,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Filters Toolbar */}
      <BookingsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setCurrentPage={setCurrentPage}
      />

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Booking No</th>
              <th className="py-3 px-4">Canteen</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Service Date</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No bookings matched your filter criteria.
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => {
                const { HEADER } = b;
                const statusCode = HEADER.STATUSCODE || HEADER.STATUS;

                return (
                  <tr key={HEADER.BOOKID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {HEADER.BOOKNO}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <BuildingStorefrontIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{HEADER.CANTEENNAME || "Main Canteen"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {HEADER.SERVNAME}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {new Date(HEADER.SERVICEDATE).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      ₹{parseFloat(HEADER.TOTALAMOUNT).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          statusCode === "CRT"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : statusCode === "SRV"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : statusCode === "CAN"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {statusCode === "CRT"
                          ? "Active"
                          : statusCode === "SRV"
                          ? "Served"
                          : statusCode === "CAN"
                          ? "Cancelled"
                          : statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewBooking(b)}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {(serverPagination.totalPages > 1 || serverPagination.totalRows > pageSize) && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {((currentPage - 1) * pageSize) + 1} to{" "}
            {Math.min(currentPage * pageSize, serverPagination.totalRows || paginatedBookings.length)} of {serverPagination.totalRows || paginatedBookings.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-700">
              {currentPage} / {serverPagination.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(serverPagination.totalPages || 1, p + 1))}
              disabled={currentPage >= (serverPagination.totalPages || 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
