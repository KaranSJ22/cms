import React, { useState } from "react";

const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "_"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "@"],
  ["Z", "X", "C", "V", "B", "N", "M", "."],
];

/**
 * Reusable On-Screen Virtual Keyboard for touch kiosks
 * Handles uppercase/lowercase, symbols, backspace, clear, space, and submit actions.
 */
export default function VirtualKeyboard({
  onChar,
  onBackspace,
  onClear,
  onSubmit,
  submitLabel = "Verify & Proceed ➔",
  submitDisabled = false,
  loading = false,
  uppercaseOnly = false,
  showSpace = false,
  extraActions = null,
  compact = false,
}) {
  const [isShiftActive, setIsShiftActive] = useState(false);

  const handleKeyClick = (char) => {
    if (!onChar) return;
    if (uppercaseOnly) {
      onChar(char.toUpperCase());
    } else {
      onChar(isShiftActive ? char.toUpperCase() : char.toLowerCase());
    }
  };

  const keyHeightClass = compact ? "h-11 md:h-12" : "h-12 md:h-14";
  const fontSizeClass = compact ? "text-sm md:text-base" : "text-base md:text-lg";

  return (
    <div className="w-full select-none">
      {/* Keyboard Grid */}
      <div className="space-y-2 mb-3">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5 md:gap-2">
            {/* Shift/Caps Toggle on the 4th row */}
            {rIdx === 3 && !uppercaseOnly && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsShiftActive((prev) => !prev)}
                className={`px-3 md:px-4 ${keyHeightClass} rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
                  isShiftActive
                    ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
              >
                {isShiftActive ? "⇧ Caps ON" : "⇧ Caps"}
              </button>
            )}

            {row.map((char) => {
              const displayChar = uppercaseOnly || isShiftActive ? char.toUpperCase() : char.toLowerCase();
              return (
                <button
                  key={char}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKeyClick(char)}
                  className={`flex-1 max-w-[56px] ${keyHeightClass} bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white active:scale-95 text-white font-mono font-bold ${fontSizeClass} rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer flex items-center justify-center`}
                >
                  {displayChar}
                </button>
              );
            })}

            {/* Backspace and Clear on row 4 when in compact or standard layout */}
            {rIdx === 3 && (
              <>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onBackspace}
                  title="Backspace"
                  className={`px-3 md:px-4 ${keyHeightClass} bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold text-base md:text-lg rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer flex items-center justify-center`}
                >
                  ⌫
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onClear}
                  title="Clear All"
                  className={`px-2.5 md:px-3 ${keyHeightClass} bg-slate-800 hover:bg-rose-950 hover:text-rose-300 active:scale-95 text-slate-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer flex items-center justify-center`}
                >
                  Clr
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Spacebar if enabled */}
      {showSpace && (
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChar && onChar(" ")}
            className={`w-1/2 ${keyHeightClass} bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-mono font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer flex items-center justify-center`}
          >
            ␣ Space
          </button>
        </div>
      )}

      {/* Control / Submit Bar */}
      {(extraActions || onSubmit) && (
        <div className="flex items-center justify-between gap-2 pt-1">
          {extraActions && <div className="flex items-center gap-2 flex-wrap">{extraActions}</div>}

          {onSubmit && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSubmit}
              disabled={loading || submitDisabled}
              className={`flex-1 min-w-[140px] ${keyHeightClass} bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 active:scale-95 text-slate-950 font-black text-sm md:text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide`}
            >
              {loading ? <span>Verifying...</span> : <span>{submitLabel}</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
