// ── Design tokens — ISRO Light Theme ─────────────────────────────────────────
export const T = {
  navy:        "#F8FAFC",
  card:        "#FFFFFF",
  panel:       "#FFFFFF",
  surface:     "#F1F5F9",
  surfaceAlt:  "#F8FAFC",
  border:      "#E2E8F0",
  borderHover: "#CBD5E1",
  saffron:     "#F97316",
  saffronDim:  "rgba(249,115,22,0.10)",
  white:       "#0F172A",
  silver:      "#475569",
  muted:       "#94A3B8",
  active:      { bg: "rgba(22,163,74,0.10)",  text: "#16a34a", border: "rgba(22,163,74,0.25)" },
  deactivated: { bg: "rgba(220,38,38,0.09)",  text: "#dc2626", border: "rgba(220,38,38,0.2)"  },
  pending:     { bg: "rgba(202,138,4,0.10)",  text: "#b45309", border: "rgba(202,138,4,0.22)" },
  expired:     { bg: "rgba(100,116,139,0.10)",text: "#64748b", border: "rgba(100,116,139,0.22)" },
  blocked:     { bg: "rgba(124,58,237,0.09)", text: "#7c3aed", border: "rgba(124,58,237,0.2)" },
}

// Nav header always stays dark navy regardless of theme
export const NAV = { bg: "#0F172A", text: "#FFFFFF", muted: "rgba(255,255,255,0.55)", border: "rgba(255,255,255,0.08)" }
