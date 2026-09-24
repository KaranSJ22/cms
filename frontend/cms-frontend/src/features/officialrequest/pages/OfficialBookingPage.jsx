import { useNavigate } from "react-router-dom";
import OfficialBookingForm from "../components/OfficialBookingForm";
import { SparklesIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function OfficialBookingPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* ISRO Space Blue Hero Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Official Meeting & Event Catering
              </h1>
              <p className="mt-1 text-blue-100/80 max-w-2xl text-sm">
                Submit an official catering booking for your division or official meeting. Requires designated Officer L1/L2 approval and Canteen confirmation.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => navigate("/my-official-bookings")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to My Bookings</span>
            </button>
          </div>
        </div>
      </div>

      <OfficialBookingForm onSuccess={() => navigate("/my-official-bookings")} />
    </div>
  );
}
