import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { kioskApi } from "../api/kioskApi";

export default function KioskBootResolver() {
  const [status, setStatus] = useState("Resolving kiosk configuration...");
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function resolveDevice() {
      try {
        const res = await kioskApi.getConfig();
        const config = res.data?.DATA || res.data;
        setDeviceInfo(config);

        if (config?.registered) {
          if (config.kioskType === "STAFF_COUNTER") {
            setStatus("Directing to Staff Counter Station...");
            setTimeout(() => navigate("/kiosk/serving-terminal", { replace: true }), 500);
          } else {
            setStatus("Directing to Employee Self-Service Kiosk...");
            setTimeout(() => navigate("/kiosk/self-service", { replace: true }), 500);
          }
        } else {
          setError(
            config?.message ||
              `Terminal IP [${config?.ipAddress || "Unknown"}] is not registered in the CMS Kiosk Device table.`
          );
        }
      } catch (err) {
        console.error("Kiosk config error", err);
        setError("Failed to connect to CMS Server. Please check network connection.");
      }
    }

    resolveDevice();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-inter">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <img
          src="/assets/logo.png"
          alt="ISRO"
          className="h-14 w-auto mx-auto object-contain"
        />

        <div>
          <h1 className="text-xl font-bold font-grotesk text-white">
            ISRO CMS Kiosk Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Raspberry Pi Hardware Environment
          </p>
        </div>

        {!error ? (
          <div className="space-y-3 py-4">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-300">{status}</p>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs text-left space-y-2">
              <span className="font-bold block uppercase tracking-wider text-amber-400">
                Notice: Unregistered Terminal
              </span>
              <p>{error}</p>
              {deviceInfo?.ipAddress && (
                <p className="font-mono text-[0.7rem] text-slate-300">
                  Detected IP: <span className="font-bold text-white">{deviceInfo.ipAddress}</span>
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Select mode manually for development / testing:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/kiosk/serving-terminal")}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Staff Counter
              </button>
              <button
                type="button"
                onClick={() => navigate("/kiosk/self-service")}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors"
              >
                Self-Service
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
