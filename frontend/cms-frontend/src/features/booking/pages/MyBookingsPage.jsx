import { useState, useEffect, useCallback } from "react";
import { getBookings, getBooking, cancelBooking } from "../api/bookingApi";
import { useAuth } from "../../../hooks/useAuth";

export default function MyBookingsPage() {
  const { user, customer } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      if (!customer?.CUSTOMERID) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const headers = await getBookings({ customerId: customer?.CUSTOMERID });
      
      // Fetch full details for each booking to get the itemized list
      const detailedBookings = await Promise.all(
        headers.map(h => getBooking(h.BOOKID))
      );

      // Sort by service date (newest first)
      detailedBookings.sort((a, b) => new Date(b.HEADER.SERVICEDATE) - new Date(a.HEADER.SERVICEDATE));
      
      setBookings(detailedBookings);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.MESSAGE || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [customer?.CUSTOMERID]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      setCancellingId(bookingId);
      await cancelBooking(bookingId, { PCANCELLEDBY: user.USERID });
      alert("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.MESSAGE || "Failed to cancel booking. The cancellation window may have closed.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your bookings...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            My Bookings
          </h1>
          <p className="mt-2 text-blue-100/80 max-w-xl">
            View your active pre-bookings. Show this screen at the serving counter to receive your food.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg className="mt-0.5 shrink-0 text-rose-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-lg">You have no bookings.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const { HEADER, ITEMS } = booking;
            const statusCode = HEADER.STATUSCODE || HEADER.STATUS;
            const isCancellable = statusCode === 'CRT';

            return (
              <div key={HEADER.BOOKID} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left side: Identifiers */}
                <div className="bg-slate-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center items-center text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                    Booking No
                  </div>
                  <div className="text-4xl font-black text-[#0F172A] tracking-tight mb-4">
                    {HEADER.BOOKNO}
                  </div>
                  
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                    Customer
                  </div>
                  <div className="text-xl font-bold text-[#F4C430] tracking-wider mb-4">
                    {HEADER.CUSTOMERNAME || user?.LOGINID}
                  </div>

                  <span className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded-full ${
                    statusCode === 'CRT' ? 'bg-blue-100 text-blue-700' :
                    statusCode === 'SRV' ? 'bg-emerald-100 text-emerald-700' :
                    statusCode === 'CAN' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {statusCode === 'CRT' ? 'Active' : 
                     statusCode === 'SRV' ? 'Served' : 
                     statusCode === 'CAN' ? 'Cancelled' : statusCode}
                  </span>
                </div>

                {/* Right side: Details & Items */}
                <div className="p-6 md:w-2/3 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{HEADER.SERVNAME}</h3>
                      <p className="text-slate-500 font-medium">{new Date(HEADER.SERVICEDATE).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {isCancellable && (
                      <button
                        onClick={() => handleCancel(HEADER.BOOKID)}
                        disabled={cancellingId === HEADER.BOOKID}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                      >
                        {cancellingId === HEADER.BOOKID ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Itemized List</h4>
                    <ul className="space-y-3">
                      {ITEMS.map(item => {
                        const isItemCancelled = item.STATUSCODE === 'CAN' || item.STATUSID === 33;
                        return (
                          <li key={item.BOOKITEMID || item.BOOKDTID} className={`flex justify-between items-center py-2 border-b border-slate-100 last:border-0 ${isItemCancelled ? 'opacity-50 line-through' : ''}`}>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-800">{item.ITEMNAME || `Item #${item.DAYMENUID}`}</span>
                              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">x{item.QTY}</span>
                              {isItemCancelled && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase no-underline">Cancelled</span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-700">
                              ₹{parseFloat(item.AMOUNT).toFixed(2)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Total Amount</span>
                    <span className="text-2xl font-black text-slate-800">₹{parseFloat(HEADER.TOTALAMOUNT).toFixed(2)}</span>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
