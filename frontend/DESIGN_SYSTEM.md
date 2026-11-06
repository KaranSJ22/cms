# CMS Design System and UI Standards (ISRO Theme)

> **Notice:** The comprehensive design system, component guidelines, color tokens, and hardware ergonomics specifications are maintained in the canonical architecture document:
> [Frontend Architecture Specification](file:///e:/CMS/Code/cms/documents/architecture/frontend-architecture.md#11-uiux-design-system-typography-and-hardware-optimization).

---

## 1. Global Colors (Tailwind v4)
This application strictly follows an ISRO-inspired color palette:

* **Primary Brand (Space Blue):**
  * Backgrounds/Headers: `bg-blue-900` or `bg-slate-900`
  * Text: `text-blue-900` or `text-slate-900`
  * Use for: Top navigation, sidebars, primary headings, and active navigation states.
* **Accent and Primary Actions (ISRO Saffron):**
  * Buttons: `bg-orange-500`, hover: `bg-orange-600`
  * Text Accent: `text-orange-500`
  * Use for: Primary action buttons (e.g., "Book Meal", "Submit"), badges, active sidebar borders, and loading spinners.
* **Secondary / Surface (Clean Tech):**
  * Cards/Modals: `bg-white`
  * Borders: `border-slate-200`
  * Use for: Data table backgrounds, form containers, and content cards.
* **App Background:**
  * Base: `bg-slate-50`
  * Use for: The main application canvas to make white surfaces pop.
* **Text and Typography:**
  * Headings: `text-slate-900` (Bold, Space Grotesk / Inter)
  * Body Text: `text-slate-600` (Inter)
* **Status Badges and Alerts:**
  * Success / Served: `bg-emerald-500/10` / `text-emerald-700`
  * Error / Cancelled: `bg-red-500/10` / `text-red-700`
  * Warning / Review: `bg-amber-500/10` / `text-amber-700`

---

## 2. Page Layout Order Standard
Every feature page follows this structured top-to-bottom layout hierarchy:
1. **Page Header:** Title on the left (Space Blue), primary action buttons on the right (Saffron).
2. **Filters & Search Surface:** Full-width surface below the header with subtle slate borders.
3. **Main Content Area:** Data tables, responsive card grids, or form builders (white surface).
4. **Pagination and Summary Footer:** Bottom-aligned server pagination (`usePagination`) and count metrics.

---

## 3. Shared Components
Always reuse global components from `src/components/` instead of building from scratch:
* When an action button is needed, map it to the Saffron accent (`Buttons.jsx`).
* Ensure all tables use the `bg-white` surface with `text-slate-600` for data rows (`Cell.jsx`).
