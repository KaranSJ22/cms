import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getBookings } from "../booking/api/bookingApi";
import { fetchWallet } from "../wallet/api/walletApi";
import { formatINR } from "../../utils/formatters";
import {
  ShoppingBagIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function EmployeeHomePage() {
  const { user, customer } = useAuth();
  const navigate = useNavigate();

  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  const isContractWorker =
    customer?.CTYPECODE === "CNT" || customer?.CTYPECODE === "CONTEMP";

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeHomeData() {
      if (!customer?.CUSTOMERID) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch bookings for today & tomorrow
        const bookingsRes = await getBookings({
          customerId: customer.CUSTOMERID,
          startDate: todayStr,
          fromDate: todayStr,
        }).catch(() => []);

        const allBookings = Array.isArray(bookingsRes) ? bookingsRes : [];

        if (isMounted) {
          // Exclude cancelled bookings from active meal reservations
          setTodayBookings(
            allBookings.filter(
              (b) =>
                b.SERVICEDATE?.slice(0, 10) === todayStr &&
                b.STATUSCODE !== "CAN" &&
                b.STATUSCODE !== "NOS"
            )
          );
          setUpcomingBookings(
            allBookings.filter(
              (b) =>
                b.SERVICEDATE?.slice(0, 10) > todayStr &&
                b.STATUSCODE === "CRT"
            )
          );
        }

        // Fetch wallet if contract employee
        if (isContractWorker) {
          const walletRes = await fetchWallet(customer.CUSTOMERID).catch(() => null);
          if (isMounted) setWallet(walletRes);
        }
      } catch (err) {
        console.error("Failed to load employee dashboard", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEmployeeHomeData();

    return () => {
      isMounted = false;
    };
  }, [customer?.CUSTOMERID, todayStr, isContractWorker]);

  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 space-y-4 font-inter">
      {/* ── Welcome Banner ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4 md:p-5 shadow-sm text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-orange-500 text-slate-950 font-grotesk tracking-wider uppercase">
                ISRO HSFC CANTEEN PORTAL
              </span>
              <span className="text-[0.68rem] text-slate-400 font-mono">
                SELF SERVICE
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-grotesk mt-1 tracking-tight text-white">
              Welcome, {user?.FULLNAME || customer?.DISPNAME || "Employee"}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Track your daily meal reservations, check serving counters, and schedule advance bookings.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-1 md:pt-0">
            <button
              type="button"
              onClick={() => navigate("/prebooking")}
              className="px-3.5 py-2 rounded-md text-xs font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              Pre-Book Meals
            </button>
            <button
              type="button"
              onClick={() => navigate("/mybookings")}
              className="px-3.5 py-2 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <DocumentTextIcon className="w-4 h-4" />
              My Bookings
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Summary Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Today's Meals Counter */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider">Today's Reservations</span>
            <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">
            {loading ? "—" : todayBookings.length}
          </p>
          <p className="text-[0.72rem] text-slate-500">
            {todayBookings.length > 0
              ? `${todayBookings.filter((b) => b.STATUSCODE === "SRV").length} served, ${
                  todayBookings.filter((b) => b.STATUSCODE === "CRT").length
                } ready for collection`
              : "No meals pre-booked for today"}
          </p>
        </div>

        {/* Upcoming Advance Bookings */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider">Upcoming Bookings</span>
            <ClockIcon className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">
            {loading ? "—" : upcomingBookings.length}
          </p>
          <p className="text-[0.72rem] text-slate-500">Advance meal bookings scheduled for future dates</p>
        </div>

        {/* Wallet Balance Card (For Contract Employees) or Profile Badge */}
        {isContractWorker ? (
          <div
            onClick={() => navigate("/my-wallet")}
            className="bg-slate-900 text-white p-4 rounded-md border border-slate-800 shadow-xs space-y-1.5 cursor-pointer hover:border-orange-500 transition-colors group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-orange-400">
                Wallet Balance
              </span>
              <CreditCardIcon className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400 font-mono">
              {loading ? "—" : formatINR(wallet?.AVAILABLEBALANCE ?? wallet?.BALANCE ?? 0)}
            </p>
            <p className="text-[0.72rem] text-slate-400 group-hover:text-slate-200 transition-colors">
              Contract Employee Wallet · View Ledger →
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider">Employee Badge</span>
              <UserIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {user?.LOGINID || `ID: ${customer?.CUSTOMERID}`}
            </p>
            <p className="text-[0.72rem] text-slate-500">
              {customer?.CTYPENAME || "Permanent Staff"} · HSFC Facility Access
            </p>
          </div>
        )}
      </div>

      {/* ── Today's Active Meals ── */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-grotesk uppercase tracking-wide">
              Today's Meal Schedule
            </h2>
            <p className="text-xs text-slate-500">Present your Employee ID / QR token at the serving counter.</p>
          </div>
          {todayBookings.length > 0 && (
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
              {todayStr}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Loading today's meal schedule...</div>
        ) : todayBookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-md border border-dashed border-slate-300 space-y-2">
            <p className="text-sm font-bold text-slate-800">No Meals Booked for Today</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not pre-booked any meals for today. Pre-booking must be completed before service slot cutoff times.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/prebooking")}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Book Advance Meals →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayBookings.map((b) => {
              const isServed = b.STATUSCODE === "SRV" || b.STATUSID === 31;
              return (
                <div
                  key={b.BOOKID}
                  className={`p-4 rounded-md border transition-colors space-y-3 ${
                    isServed
                      ? "bg-slate-50 border-slate-200 opacity-80"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[0.62rem] font-bold uppercase tracking-wider text-orange-600">
                        {b.SERVNAME || `Service #${b.SERVICEID}`}
                      </span>
                      <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{b.BOOKNO}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                        isServed
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-orange-50 text-orange-800 border-orange-200"
                      }`}
                    >
                      {isServed ? "✓ Served" : "Ready at Counter"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Total Items: <strong className="text-slate-900 font-semibold">{b.TOTALITEMS || b.TOTALQTY}</strong>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(b.TOTALAMOUNT)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
