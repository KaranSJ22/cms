import { useState, useEffect } from "react";
import { getLevelMappings, saveLevelMapping } from "../api/officialApi";
import {
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { PrimaryBtn } from "../../../components/ui/Buttons";

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

  const l1Count = mappings.filter((m) => m.APPRLVL === "L1").length;
  const l2Count = mappings.filter((m) => m.APPRLVL === "L2").length;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* ── Top Header Canvas (Stripe Style) ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 tracking-tight">
              Official Approver Level Configuration
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Map employee grade levels to L1 and L2 approver tiers for official VIP &amp; meeting requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMappings}
            disabled={loading}
            title="Refresh Mappings"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Configured Levels
              </span>
              <UserGroupIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {mappings.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active grade level mappings for official bookings
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Level 1 Approvers
              </span>
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {l1Count}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Initial tier reviewers for catering indents
            </div>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Level 2 Authorities
              </span>
              <ShieldCheckIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-amber-800">
              {l2Count}
            </div>
            <div className="text-xs text-amber-700 mt-1">
              Senior tier officers with final authorization power
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs sm:text-sm flex items-center justify-between border shadow-xs ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs h-fit">
            <h2 className="text-sm font-bold font-grotesk text-slate-900 uppercase tracking-wide mb-4">
              Add / Update Level Mapping
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold font-grotesk text-slate-700 mb-1">
                  Employee LEVEL Value (Integer) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 13, 14, 15"
                  value={empLevel}
                  onChange={(e) => setEmpLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Matches the numerical LEVEL stored on permanent employee records.
                </span>
              </div>

              <div>
                <label className="block font-semibold font-grotesk text-slate-700 mb-1">
                  Approver Classification Tier *
                </label>
                <select
                  value={apprLvl}
                  onChange={(e) => setApprLvl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold transition-colors"
                >
                  <option value="L1">Level 1 (L1 Approver)</option>
                  <option value="L2">Level 2 (Senior / L2 Approver)</option>
                </select>
              </div>

              <div className="pt-2">
                <PrimaryBtn
                  type="submit"
                  disabled={submitting}
                  className="!w-full"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : "Save Mapping"}</span>
                </PrimaryBtn>
              </div>
            </form>

            <div className="mt-6 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              <span className="font-semibold font-grotesk text-slate-800 block mb-1">
                Operational Logic:
              </span>
              Employees with an active L1/L2 mapping appear as eligible approvers when permanent staff submit an official booking indent.
            </div>
          </div>

          {/* Current Mappings Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <h2 className="text-sm font-bold font-grotesk text-slate-900 uppercase tracking-wide mb-4">
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
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[0.7rem] font-grotesk font-semibold">
                      <th className="py-3 px-4">Grade Level</th>
                      <th className="py-3 px-4">Classification Tier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappings.map((m) => (
                      <tr key={m.LVLMAPID} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold font-grotesk text-slate-900 text-sm">
                          LEVEL {m.EMPLEVEL}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold text-[0.7rem] font-grotesk border ${
                              m.APPRLVL === "L2"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            {m.APPRLVL === "L2" ? "L2 (Senior Approver)" : "L1 (Approver)"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEmpLevel(m.EMPLEVEL);
                              setApprLvl(m.APPRLVL === "L1" ? "L2" : "L1");
                            }}
                            className="px-2.5 py-1 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition-colors shadow-2xs cursor-pointer"
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
    </div>
  );
}
