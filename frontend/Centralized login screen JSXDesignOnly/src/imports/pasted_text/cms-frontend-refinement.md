Refine the existing CMS frontend based on the screens already created in this project.

IMPORTANT:
Do not rebuild the application from scratch.
Do not change the existing backend/API assumptions.
Preserve the existing components, layouts and working interactions wherever possible.

The goal is to make the current frontend more professional, consistent, role-aware and suitable for an ISRO internal enterprise application.
## 1. Visual Direction
Keep the existing visual identity:
- Deep navy header/navigation
- ISRO-inspired orange accent
- White/light-gray content areas
- Clean tables
- Right-side drawers
- Existing typography

Refine the visual design so it feels:
- Professional
- Technical
- Clean
- Restrained
- Enterprise/government-oriented
- Easy to use on office PCs

Avoid making it look like a food-delivery, restaurant or e-commerce application.
Reduce unnecessary:
- Emojis
- Decorative graphics
- Excessive rounded cards
- Excessive colors
- Marketing-style elements

Use orange primarily for primary actions and important highlights.

## 2. Separate the Application by User Role

The current design combines Canteen Department and Employee functionality into one navigation flow.

Separate them logically based on the logged-in user's role.

### Canteen Department
Manager / Assistant:

- Dashboard
- Menu Management
  - Menu Items
  - Services
  - Day Slots
- Menu Planning
  - Breakfast — 7 Days
  - Lunch — 30 Days
  - Other Services
- Bookings / Operations
- Kitchen Preparation / Day-wise Booking Summary
- Pricing
- Reports

Canteen Staff:

- Dashboard
- Today's Operations
- Booking / Serving Information

### Employee

Keep the employee experience simple:

- Home
- Pre-Booking
- My Bookings
- Booking History
- Wallet where applicable
- Profile

Employees should not see administrative/configuration screens.

## 3. Canteen Department Dashboard

Refine/create a dashboard that answers:

"What needs attention today?"

Show:

- Today's date
- Today's services
- Total pre-bookings
- Total items to prepare
- Items served
- Items remaining
- No-shows
- Menu planning status
- Pending actions

Provide useful quick actions such as:

- Plan Breakfast
- Plan Lunch
- Create Day Menu
- Add Menu Item
- View Today's Bookings

## 4. Menu Management

Keep the existing Menu Catalog/table design.

It should manage:

- Menu Items
- Services
- Day Slots

Use an enterprise master-data style rather than a restaurant product-catalog style.

Keep the existing drawer pattern for creating/editing records.

## 5. Menu Planning

The existing Day Menu Planning screen is a good foundation.

Refine it around the actual workflow:

Breakfast:
- Planned for 7 days

Lunch:
- Planned for 30 days

Other services:
- Flexible planning

The workflow should feel like:

Plan → Review → Publish

Clearly distinguish:

- Draft
- Pending
- Approved
- Published

Make planning multiple days efficient instead of forcing the user to repeatedly perform unrelated actions.

## 6. Booking / Kitchen Operations

Keep the existing Kitchen Production List / Bookings Monitor concept.

This screen should help the Canteen Department understand how much food needs to be prepared.

For each menu item show:

- Pre-booked
- Served
- Remaining
- No-show

Allow filtering by:

- Date
- Service
- Slot
- Remaining

Prioritize information that is useful for daily canteen operations.

## 7. Employee Pre-Booking

Keep the existing Pre-Booking screen and improve its UX.

Employees should primarily see:

- Published menus
- Available services
- Dates
- Menu items
- Prices
- Booking status
- Booking cutoff
- Cancellation cutoff

The workflow should be:

Select period
→ Select service
→ Select menu item
→ Review
→ Confirm booking

Keep this experience simple and intuitive.

## 8. Pricing and Wallet

Keep Pricing as an administrative feature for the Canteen Department.

Use the existing pricing drawer/table patterns.

Wallet should be presented as an account/financial feature for applicable employee types.

Do not make these features unnecessarily prominent for users who do not need them.

## 9. Navigation

Do not use one universal navigation containing every module.

The navigation should adapt to the user's role.

The user should only see features relevant to their responsibilities.

## 10. Consistency

Create a consistent design system across all existing screens.

Maintain consistency for:

- Header
- Navigation
- Page titles
- Buttons
- Tables
- Forms
- Drawers
- Status badges
- Filters
- Empty states
- Error/success states
- Spacing
- Typography

Use readable full status names such as:

Active
Inactive
Draft
Pending
Approved
Published
Cancelled
Served
No-show

instead of relying primarily on codes such as A, D, P, EXP, BLK.

## Final Goal

The final frontend should feel like:

"Modern ISRO internal enterprise software"

not:

"Food ordering website"

Prioritize clarity, workflow efficiency, information hierarchy and professional presentation.

Most importantly, refine the existing design rather than replacing it.