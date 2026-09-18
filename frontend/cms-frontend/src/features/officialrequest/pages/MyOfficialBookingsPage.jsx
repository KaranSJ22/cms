import { useState, useEffect } from "react";
import {
  getMyOfficialBookings,
  getOfficialBookingDetails,
  resubmitOfficialBooking,
} from "../api/officialApi";
import OfficialBookingForm from "../components/OfficialBookingForm";
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function MyOfficialBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [resubmitBooking, setResubmitBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyOfficialBookings();
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load my official bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const openDetails = async (bookingId) => {
    try {
      const details = await getOfficialBookingDetails(bookingId);
      setSelectedBooking(details);
    } catch (err) {
      console.error("Failed to fetch booking details", err);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "SUBMITTED") return b.STATUSCODE === "SUB";
    if (activeTab === "PENDING_MGR") return b.STATUSCODE === "PENMGR";
    if (activeTab === "CONFIRMED") return b.STATUSCODE === "CNF";
    if (activeTab === "REJECTED") return b.STATUSCODE === "REJ";
    return true;
  });

  const getStatusBadge = (statusCode, statusName) => {
    switch (statusCode) {
      case "SUB":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ClockIcon className="w-3.5 h-3.5" />
            Submitted (Pending Approver)
          </span>
        );
      case "PENMGR":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
            Pending Canteen Manager
          </span>
        );
      case "CNF":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case "REJ":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircleIcon className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {statusName}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Catering Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage official requests for meetings, VIP delegations, and departmental seminars.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Official Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-800 text-sm font-medium">
        {[
          { key: "ALL", label: "All Requests", count: bookings.length },
          { key: "SUBMITTED", label: "Pending Approver", count: bookings.filter((b) => b.STATUSCODE === "SUB").length },
          { key: "PENDING_MGR", label: "Pending Manager", count: bookings.filter((b) => b.STATUSCODE === "PENMGR").length },
          { key: "CONFIRMED", label: "Confirmed", count: bookings.filter((b) => b.STATUSCODE === "CNF").length },
          { key: "REJECTED", label: "Rejected", count: bookings.filter((b) => b.STATUSCODE === "REJ").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <DocumentTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No requests found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === "ALL"
              ? "You haven't submitted any official bookings yet. Click 'New Official Request' to begin."
              : `No requests currently in '${activeTab}' status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map((b) => (
            <div
              key={b.OFFBOOKID}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wider">
                    {b.BOOKNO}
                  </span>
                  {getStatusBadge(b.STATUSCODE, b.STATUSNAME)}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 line-clamp-1">
                  {b.PURPOSE}
                </h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-3">
                  {b.SERVNAME} • {b.COMBONAME}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.EVENTDATETIME).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="line-clamp-1">{b.VENUE}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Approver: {b.APPROVER_NAME}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    {b.QUANTITY} Servings ({b.NOOFPEOPLE} People)
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    ₹{Number(b.TOTALAMOUNT).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {b.STATUSCODE === "REJ" && (
                    <button
                      onClick={() => setResubmitBooking(b)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                    >
                      Resubmit
                    </button>
                  )}
                  <button
                    onClick={() => openDetails(b.OFFBOOKID)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Create Official Catering Request
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Only permanent employees are authorized to book official catering for meetings and events.
            </p>
            <OfficialBookingForm
              onSuccess={() => {
                setShowCreateModal(false);
                loadBookings();
              }}
            />
          </div>
        </div>
      )}

      {/* Details & Audit Trail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {selectedBooking.BOOKNO}
              </span>
              {getStatusBadge(selectedBooking.STATUSCODE, selectedBooking.STATUSNAME)}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {selectedBooking.PURPOSE}
            </h2>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-4">
              {selectedBooking.CANTEENNAME} • {selectedBooking.SERVNAME} • {selectedBooking.COMBONAME}
            </p>

            {/* Event Specs Grid */}
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 mb-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Event Date & Time</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedBooking.EVENTDATETIME).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Venue</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedBooking.VENUE}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Quantity & Headcount</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedBooking.QUANTITY} servings ({selectedBooking.NOOFPEOPLE} attendees)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Approver</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedBooking.APPROVER_NAME} ({selectedBooking.APPROVER_DESIG || "Officer"})
                </span>
              </div>
            </div>

            {/* Combo Menu Items */}
            {selectedBooking.ITEMS && selectedBooking.ITEMS.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Combo Contents
                </h4>
                <div className="space-y-1.5">
                  {selectedBooking.ITEMS.map((it) => (
                    <div
                      key={it.COMBOITEMID}
                      className="text-xs flex justify-between items-center py-1.5 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{it.MENUNAME}</span>
                      <span className="text-slate-500 font-semibold">Qty: {it.QTY}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Approval & Action Audit Trail
              </h4>
              <div className="space-y-3">
                {(selectedBooking.HISTORY || []).map((h, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {h.ACTION} by {h.ACTIONBY_NAME} ({h.ACTIONROLE})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(h.ACTIONAT).toLocaleString()}
                        </span>
                      </div>
                      {h.REJREASON && (
                        <p className="text-red-600 dark:text-red-400 text-xs font-medium mt-1">
                          Reason: {h.REJREASON}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block">Calculated Official Total</span>
                <span className="text-[11px] text-slate-400">
                  ({selectedBooking.QUANTITY} servings × ₹{Number(selectedBooking.UNITPRICE || 0).toFixed(2)} Food Rate)
                  {Number(selectedBooking.HANDLINGCHARGE || 0) > 0 && ` + ₹${Number(selectedBooking.HANDLINGCHARGE).toFixed(2)} Flat Handling`}
                </span>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(selectedBooking.TOTALAMOUNT).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {resubmitBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setResubmitBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Modify & Resubmit Request
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Booking: <span className="font-semibold text-slate-800 dark:text-slate-200">{resubmitBooking.BOOKNO}</span>
            </p>
            <ResubmitForm
              booking={resubmitBooking}
              onSuccess={() => {
                setResubmitBooking(null);
                loadBookings();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ResubmitForm({ booking, onSuccess }) {
  const [purpose, setPurpose] = useState(booking.PURPOSE || "");
  const [venue, setVenue] = useState(booking.VENUE || "");
  const [eventDateTime, setEventDateTime] = useState(
    booking.EVENTDATETIME ? new Date(booking.EVENTDATETIME).toISOString().slice(0, 16) : ""
  );
  const [quantity, setQuantity] = useState(booking.QUANTITY || 10);
  const [noOfPeople, setNoOfPeople] = useState(booking.NOOFPEOPLE || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await resubmitOfficialBooking(booking.OFFBOOKID, {
        PURPOSE: purpose.trim(),
        VENUE: venue.trim(),
        EVENTDATETIME: new Date(eventDateTime).toISOString(),
        QUANTITY: Number(quantity),
        NOOFPEOPLE: Number(noOfPeople),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.MESSAGE || err.message || "Failed to resubmit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>
      )}

      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose *</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue *</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date & Time *</label>
        <input
          type="datetime-local"
          value={eventDateTime}
          onChange={(e) => setEventDateTime(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">No. of People *</label>
          <input
            type="number"
            min="1"
            value={noOfPeople}
            onChange={(e) => setNoOfPeople(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="pt-3 flex justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Resubmit for Approval"}
        </button>
      </div>
    </form>
  );
}
