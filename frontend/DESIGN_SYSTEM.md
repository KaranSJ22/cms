# CMS Design System & UI Order (ISRO Theme)

## 1. Global Colors (Tailwind v4)
This application strictly follows an ISRO-inspired color palette.

*   **Primary Brand (Space Blue):**
    *   Backgrounds/Headers: `bg-blue-900` 
    *   Text: `text-blue-900`
    *   Use for: Top navigation, sidebars, primary headings, and active navigation states.
*   **Accent & Primary Actions (ISRO Saffron):**
    *   Buttons: `bg-orange-500`, hover: `bg-orange-600`
    *   Text Accent: `text-orange-500`
    *   Use for: Primary action buttons (e.g., "Book Meal", "Submit"), badges, and active tab underlines.
*   **Secondary/Surface (Clean Tech):**
    *   Cards/Modals: `bg-white`
    *   Borders: `border-slate-200`
    *   Use for: Data table backgrounds, form containers, and content cards.
*   **App Background:**
    *   Base: `bg-slate-50`
    *   Use for: The main application canvas to make white surfaces pop.
*   **Text & Typography:**
    *   Headings: `text-slate-900` (Bold, professional)
    *   Body Text: `text-slate-600`
*   **Status/Alerts:**
    *   Success: `bg-emerald-500` / `text-emerald-700`
    *   Error: `bg-red-500` / `text-red-700`
    *   Warning: `bg-amber-500` / `text-amber-700`

## 2. Page Layout Order
Every feature page MUST follow this exact top-to-bottom order to maintain structural consistency across the application:
1.  **Page Header:** Title on the left (using Space Blue), primary action buttons (using Saffron) on the right.
2.  **Filters/Search Bar:** Full-width surface below the header with a subtle slate border.
3.  **Main Content Area:** Data tables, grid layouts, or form containers (white surface with slight shadow).
4.  **Pagination/Footer (if applicable):** Bottom center.

## 3. Shared Components
Always reuse global components from `src/components/` instead of building them from scratch.
*   When a button is needed, map it to the Saffron accent.
*   Ensure all tables use the `bg-white` surface with `text-slate-600` for data rows.