import { useNavigate } from "react-router-dom";
import OfficialBookingForm from "../components/OfficialBookingForm";
import { SparklesIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function OfficialBookingPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/my-official-bookings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to My Bookings
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Request Official Meeting / Event Catering
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit an official catering booking for your division or official meeting. Requires designated Officer L1/L2 approval and Canteen confirmation.
            </p>
          </div>
        </div>

        <OfficialBookingForm onSuccess={() => navigate("/my-official-bookings")} />
      </div>
    </div>
  );
}
