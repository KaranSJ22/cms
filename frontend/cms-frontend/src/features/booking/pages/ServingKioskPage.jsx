import { useState, useRef, useEffect } from "react";
import { resolveBooking, serveBooking } from "../api/bookingApi";

export default function ServingKioskPage() {
  const [identifier, setIdentifier] = useState("");
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serving, setServing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const inputRef = useRef(null);

  // Auto-focus the input on load and after actions
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeBooking, error, successMsg]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setActiveBooking(null);

    try {
      const data = await resolveBooking(identifier.trim());
      setActiveBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || "No active booking found for this ID.");
    } finally {
      setLoading(false);
      setIdentifier(""); // clear input for next scan if needed
    }
  };

  const handleServe = async () => {
    if (!activeBooking) return;
    
    setServing(true);
    setError(null);

    try {
      await serveBooking(activeBooking.HEADER.BOOKID);
      setSuccessMsg(`Booking ${activeBooking.HEADER.BOOKNO} marked as SERVED.`);
      setActiveBooking(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as served.");
    } finally {
      setServing(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleCancelKiosk = () => {
    setActiveBooking(null);
    setError(null);
    setSuccessMsg(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
      
      <div className="w-full max-w-3xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Kiosk Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            Serving Kiosk
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Scan ID Card or Type Booking Number
          </p>
        </div>

        {/* Input Form (Hardware Scanner Ready) */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <form onSubmit={handleResolve} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading || activeBooking}
              placeholder="e.g. BK-100234 or EMP1001"
              className="w-full text-center text-4xl font-bold uppercase tracking-wider p-6 rounded-2xl bg-slate-100 border-2 border-slate-300 focus:border-[#F4C430] focus:ring-4 focus:ring-[#F4C430]/20 transition-all disabled:opacity-50 text-slate-800 placeholder-slate-300"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-[#F4C430] rounded-full animate-spin"></div>
              </div>
            )}
            {/* Hidden submit to handle enter key seamlessly */}
            <button type="submit" className="hidden" />
          </form>

          {/* Feedback Messages */}
          {error && (
            <div className="mt-6 p-4 bg-rose-100 text-rose-800 rounded-xl font-bold text-center text-lg border-2 border-rose-200">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-6 p-4 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-center text-lg border-2 border-emerald-200">
              {successMsg}
            </div>
          )}

          {/* Active Booking Display */}
          {activeBooking && (
            <div className="mt-8 pt-8 border-t-2 border-slate-100 space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-[#0F172A] text-white p-6 rounded-2xl">
                <div>
                  <p className="text-blue-200 font-semibold uppercase tracking-widest text-sm mb-1">Booking Confirmed</p>
                  <p className="text-3xl font-black">{activeBooking.HEADER.BOOKNO}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 font-semibold uppercase tracking-widest text-sm mb-1">Customer</p>
                  <p className="text-2xl font-bold text-[#F4C430]">{activeBooking.HEADER.CUSTOMERNAME}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Items to Serve:</h3>
                <ul className="space-y-3">
                  {activeBooking.ITEMS.map((item) => (
                    <li key={item.BOOKDTID} className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 flex justify-between items-center">
                      <span className="text-3xl font-bold text-[#0F172A]">
                        {item.ITEMNAME || `Item #${item.DAYMENUID}`}
                      </span>
                      <span className="text-4xl font-black bg-[#F4C430] text-[#0F172A] px-6 py-2 rounded-xl shadow-sm">
                        x{item.QTY}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancelKiosk}
                  disabled={serving}
                  className="flex-1 py-5 rounded-2xl font-bold text-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleServe}
                  disabled={serving}
                  className="flex-[2] py-5 rounded-2xl font-black text-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-70 disabled:animate-pulse"
                >
                  {serving ? "Serving..." : "MARK AS SERVED"}
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
