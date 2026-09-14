import { useState, useEffect } from "react";
import { getLevelMappings, saveLevelMapping } from "../api/officialApi";
import {
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function LevelMappingPage() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empLevel, setEmpLevel] = useState("");
  const [apprLvl, setApprLvl] = useState("L1");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await getLevelMappings();
      setMappings(data || []);
    } catch (err) {
      console.error("Failed to load level mappings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!empLevel) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      await saveLevelMapping({
        EMPLEVEL: Number(empLevel),
        APPRLVL: apprLvl,
        ISACTIVE: 1,
      });
      setFeedback({
        type: "success",
        message: `Level ${empLevel} successfully mapped to ${apprLvl}.`,
      });
      setEmpLevel("");
      loadMappings();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.MESSAGE || err.message || "Failed to save mapping",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <ShieldCheckIcon className="w-7 h-7 text-orange-500" />
          Official Approver Level Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Map employee grade levels to L1 and L2 approver tiers. Levels are dynamic classifications based on employee profiles.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapping Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Add / Update Level Mapping
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee LEVEL Value (Integer) *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 13, 14, 15"
                value={empLevel}
                onChange={(e) => setEmpLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <span className="text-[11px] text-slate-400">
                Matches the numerical LEVEL stored on permanent employee records.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approver Classification Tier *
              </label>
              <select
                value={apprLvl}
                onChange={(e) => setApprLvl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
              >
                <option value="L1">Level 1 (L1 Approver)</option>
                <option value="L2">Level 2 (Senior / L2 Approver)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Save Mapping"}</span>
            </button>
          </form>

          <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Operational Logic:
            </span>
            Employees with an active L1/L2 mapping appear as eligible approvers when permanent staff submit an official booking.
          </div>
        </div>

        {/* Current Mappings Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Current Grade Level Classifications ({mappings.length})
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No level mappings configured.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">Grade Level</th>
                    <th className="pb-3 px-3">Classification Tier</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mappings.map((m) => (
                    <tr key={m.LVLMAPID} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white text-sm">
                        LEVEL {m.EMPLEVEL}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                            m.APPRLVL === "L2"
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          {m.APPRLVL === "L2" ? "L2 (Senior Approver)" : "L1 (Approver)"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setEmpLevel(m.EMPLEVEL);
                            setApprLvl(m.APPRLVL === "L1" ? "L2" : "L1");
                          }}
                          className="text-orange-600 hover:text-orange-700 font-semibold underline cursor-pointer"
                        >
                          Switch Tier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
