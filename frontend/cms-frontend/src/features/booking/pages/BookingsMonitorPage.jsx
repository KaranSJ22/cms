import { useState, useEffect, useCallback, useMemo } from "react";
import { getBookings, getBooking, serveBooking, noShowBooking } from "../api/bookingApi";
import { getServices } from "../../services/api/servicesApi";
import { getActiveCanteens } from "../../dayslot/api/daySlotsApi";
import { useAuth } from "../../../hooks/useAuth";
import { formatINR } from "../../../utils/formatters";

export default function BookingsMonitorPage() {
  const { user, activeCanteenId, setActiveCanteenId } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(activeCanteenId || "");
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isDateInFuture = useCallback(
    (dateVal) => {
      if (!dateVal) return false;
      const dStr =
        typeof dateVal === "string"
          ? dateVal.slice(0, 10)
          : new Date(dateVal).toISOString().slice(0, 10);
      return dStr > todayStr;
    },
    [todayStr]
  );

  // Filters
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Booking detail modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch Canteens and filter strictly by user's assigned canteen roles (or all if SYSADM)
  useEffect(() => {
    getActiveCanteens()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const userCanteenIds = (user?.CANTEENROLES || []).map((r) => r.CANTEENID);
        const hasAdminRole = (user?.SYSTEMROLES || []).includes("SYSADM");

        const allowed = hasAdminRole
          ? list
          : list.filter((c) => userCanteenIds.includes(c.CANTEENID));

        setCanteens(allowed);

        if (allowed.length > 0) {
          const isCurrentValid = allowed.some((c) => c.CANTEENID === Number(selectedCanteenId));
          if (!isCurrentValid) {
            const matched = allowed.find((c) => c.CANTEENID === Number(activeCanteenId));
            const targetId = matched ? matched.CANTEENID : allowed[0].CANTEENID;
            setSelectedCanteenId(targetId);
            if (!activeCanteenId) {
              setActiveCanteenId(targetId);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load canteens", err));
  }, [user]);

  // Keep selectedCanteenId in sync when activeCanteenId changes in header or sidebar
  useEffect(() => {
    if (activeCanteenId && canteens.some((c) => c.CANTEENID === Number(activeCanteenId))) {
      setSelectedCanteenId(Number(activeCanteenId));
    }
  }, [activeCanteenId, canteens]);

  const loadBookings = useCallback(async () => {
    if (!selectedCanteenId && canteens.length > 0) return;
    setLoading(true);
    try {
      const params = {};
      if (selectedCanteenId) {
        params.canteenId = selectedCanteenId;
      }
      if (filterDate) {
        params.fromDate = filterDate;
        params.toDate = filterDate;
      }
      if (filterService) {
        params.serviceId = filterService;
      }

      const data = await getBookings(params);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCanteenId, filterDate, filterService, canteens.length]);

  useEffect(() => {
    getServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleOpenDetail = async (bookingId) => {
    try {
      const details = await getBooking(bookingId);
      setSelectedBooking(details);
    } catch (err) {
      console.error("Failed to load booking details", err);
    }
  };

  const handleServe = async (bookingId) => {
    setActionLoading(true);
    try {
      await serveBooking(bookingId);
      loadBookings();
      if (selectedBooking?.HEADER?.BOOKID === bookingId) {
        const details = await getBooking(bookingId);
        setSelectedBooking(details);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark booking as served.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (bookingId) => {
    if (!window.confirm("Are you sure you want to mark this booking as No-Show?")) return;
    setActionLoading(true);
    try {
      await noShowBooking(bookingId);
      loadBookings();
      if (selectedBooking?.HEADER?.BOOKID === bookingId) {
        const details = await getBooking(bookingId);
        setSelectedBooking(details);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark booking as no-show.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter bookings by status & search query
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      filterStatus === "ALL" ||
      b.STATUSCODE === filterStatus ||
      (filterStatus === "CRT" && (b.STATUSID === 30 || b.STATUSCODE === "CRT")) ||
      (filterStatus === "SRV" && (b.STATUSID === 32 || b.STATUSCODE === "SRV")) ||
      (filterStatus === "CAN" && (b.STATUSID === 33 || b.STATUSCODE === "CAN")) ||
      (filterStatus === "NOS" && (b.STATUSID === 34 || b.STATUSCODE === "NOS"));

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      b.BOOKNO?.toLowerCase().includes(query) ||
      b.CUSTOMERNAME?.toLowerCase().includes(query) ||
      b.LOGINID?.toLowerCase().includes(query) ||
      String(b.CUSTOMERID).includes(query);

    return matchesStatus && matchesQuery;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCanteenId, filterDate, filterService, filterStatus, searchQuery]);

  const currentCanteen = useMemo(() => {
    return canteens.find((c) => c.CANTEENID === Number(selectedCanteenId)) || null;
  }, [canteens, selectedCanteenId]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Calculate summary counts
  const totalCount = filteredBookings.length;
  const servedCount = filteredBookings.filter((b) => b.STATUSCODE === "SRV" || b.STATUSID === 31).length;
  const pendingCount = filteredBookings.filter((b) => b.STATUSCODE === "CRT" || b.STATUSID === 30).length;
  const totalAmount = filteredBookings.reduce((sum, b) => sum + (Number(b.TOTALAMOUNT) || 0), 0);

  return (
    <div className="flex-1 bg-slate-50 p-6 md:p-8 space-y-6 font-inter overflow-y-auto">
      {/* ── Header ── */}
      <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-slate-950 font-grotesk tracking-wide">
                MONITORING & AUDIT
              </span>
              {currentCanteen && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  📍 {currentCanteen.CANTEENNAME} ({currentCanteen.CANTEENCODE})
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-grotesk mt-2 tracking-tight">
              Bookings Monitor
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Live audit of advance meal reservations, serving status, and order details.
            </p>
          </div>
          <button
            onClick={loadBookings}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Canteen Facility Dropdown */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Canteen Facility
            </label>
            <select
              value={selectedCanteenId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedCanteenId(newId);
                setActiveCanteenId(newId);
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              {canteens.length === 0 ? (
                <option value="">No Canteen Assigned</option>
              ) : (
                canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID}>
                    {c.CANTEENNAME} ({c.CANTEENCODE})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Serving Date */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Serving Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Service Dropdown */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Service
            </label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All Services</option>
              {services.map((s) => (
                <option key={s.SERVICEID} value={s.SERVICEID}>
                  {s.SERVNAME}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="CRT">Pending at Counter (CRT)</option>
              <option value="SRV">Served (SRV)</option>
              <option value="CAN">Cancelled (CAN)</option>
              <option value="NOS">No-Show (NOS)</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Booking / Customer
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. PB-BK01 or Emp Name"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {/* ── Summary Stats Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.68rem] font-bold uppercase text-slate-400">Total Bookings</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.68rem] font-bold uppercase text-orange-500">Ready at Counter</span>
          <p className="text-2xl font-black text-orange-600 font-mono mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.68rem] font-bold uppercase text-emerald-600">Served</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{servedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.68rem] font-bold uppercase text-slate-400">Total Value</span>
          <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{formatINR(totalAmount)}</p>
        </div>
      </div>

      {/* ── Bookings Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No bookings found matching your selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Booking No</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5 text-center">Items</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBookings.map((b) => {
                  const isServed = b.STATUSCODE === "SRV" || b.STATUSID === 32;
                  const isPending = b.STATUSCODE === "CRT" || b.STATUSID === 30;
                  const isCancelled = b.STATUSCODE === "CAN" || b.STATUSID === 33;
                  const isNoShow = b.STATUSCODE === "NOS" || b.STATUSID === 34;
                  const isFuture = isDateInFuture(b.SERVICEDATE || filterDate);

                  return (
                    <tr key={b.BOOKID} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{b.BOOKNO}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {b.CUSTOMERNAME || `Customer #${b.CUSTOMERID}`}
                        {b.LOGINID && <span className="block text-[0.65rem] text-slate-400 font-mono">{b.LOGINID}</span>}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {b.SERVNAME || `Service #${b.SERVICEID}`}
                        {b.CANTEENNAME && <span className="block text-[0.65rem] text-slate-400">{b.CANTEENNAME}</span>}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">{b.TOTALITEMS || b.TOTALQTY}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">{formatINR(b.TOTALAMOUNT)}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase ${
                            isServed
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-orange-100 text-orange-800"
                              : isCancelled
                              ? "bg-rose-100 text-rose-800 line-through"
                              : isNoShow
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {b.STATUSCODE || "Active"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(b.BOOKID)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                        >
                          View
                        </button>
                        {isPending && !isFuture && (
                          <button
                            onClick={() => handleServe(b.BOOKID)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm disabled:opacity-50"
                          >
                            Serve
                          </button>
                        )}
                        {isPending && isFuture && (
                          <span
                            title={`Scheduled for ${b.SERVICEDATE?.slice(0, 10) || filterDate}. Serving opens on the day of service.`}
                            className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                          >
                            Future Order
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(totalPages > 1 || filteredBookings.length > 25) && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredBookings.length)} of {filteredBookings.length} bookings
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
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
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Booking Detail Modal ── */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-500">
                  Booking Details
                </span>
                <h3 className="text-2xl font-black text-slate-900 font-mono">
                  {selectedBooking.HEADER.BOOKNO}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Customer</span>
                <strong className="text-slate-800">{selectedBooking.HEADER.CUSTOMERNAME}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Canteen Facility</span>
                <strong className="text-slate-800">{selectedBooking.HEADER.CANTEENNAME || currentCanteen?.CANTEENNAME || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Service / Date</span>
                <strong className="text-slate-800">
                  {selectedBooking.HEADER.SERVNAME} ({selectedBooking.HEADER.SERVICEDATE?.slice(0, 10)})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Total Amount</span>
                <strong className="text-slate-800 font-mono">{formatINR(selectedBooking.HEADER.TOTALAMOUNT)}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Current Status</span>
                <span className="font-bold text-orange-600 uppercase">{selectedBooking.HEADER.STATUSCODE}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Booked Items</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedBooking.ITEMS.map((item) => {
                  const itemServed = item.STATUSCODE === "SRV" || item.STATUSID === 31;
                  return (
                    <div
                      key={item.BOOKITEMID}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className={`font-bold ${itemServed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                          {item.ITEMNAME || `Item #${item.MENUITEMID}`}
                        </p>
                        <p className="text-[0.65rem] text-slate-400 font-mono">Qty: {item.QTY} · {formatINR(item.AMOUNT)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${
                          itemServed ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {itemServed ? "Served" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            {isDateInFuture(selectedBooking.HEADER.SERVICEDATE) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <span className="text-base leading-none">ℹ️</span>
                <div>
                  <strong className="font-bold">Future Booking Notice:</strong>
                  <p className="mt-0.5 text-amber-800">
                    This order is scheduled for {selectedBooking.HEADER.SERVICEDATE?.slice(0, 10)}. Food dispensing and attendance status can only be recorded on the day of service.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
              {(selectedBooking.HEADER.STATUSCODE === "CRT" || selectedBooking.HEADER.STATUSID === 30) &&
                !isDateInFuture(selectedBooking.HEADER.SERVICEDATE) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNoShow(selectedBooking.HEADER.BOOKID)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-all disabled:opacity-50"
                    >
                      Mark No-Show
                    </button>
                    <button
                      type="button"
                      onClick={() => handleServe(selectedBooking.HEADER.BOOKID)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      Mark Served
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
