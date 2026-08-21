# Canteen Workflow Refactoring & Implementation Plan

## Purpose

This plan completes the canteen configuration workflow before expanding booking work. It keeps the database, Express API, and React frontend aligned so that only a complete, priced, approved day menu is visible for pre-booking.

## Confirmed Business Rules

| Area | Decision |
| --- | --- |
| Roles | `CTNMNG` is Canteen Manager; `CTNAST` is Canteen Assistant. Both are canteen-scoped roles. |
| Approval scope | One **day slot**: `CANTEENID + SERVICEID + SERVDATE`. Approval covers the complete menu in that slot, not individual item rows. |
| Menu prices | A menu item must have effective prices for **every active customer type** before it can be added to a day menu. Revalidate against the slot serving date before approval. |
| Customer canteen eligibility | Any active customer type may use any canteen. |
| Base item | `ISBASE` is a boolean on each day-menu item. An approved, publishable slot needs at least one active base item. |
| Per-customer limit | `MAXQTY` is the maximum quantity one customer can book for an item. |
| Shared capacity | `AVAILQTY` is optional total capacity. When set, booking must enforce it atomically; when unset, no shared capacity limit applies. |
| Same service at multiple canteens | Supported. A slot must be unique per `(CANTEENID, SERVICEID, SERVDATE)`. |
| Canteen access | Canteen Manager and Canteen Assistant may access only canteens to which their `CANTEENROLES` assignment grants the relevant role. Multiple assignments grant access to each assigned canteen only. |

## Target Workflow

```text
Create menu item
  -> configure effective price for every active customer type
  -> create day slot (canteen + service + date)
  -> build the complete slot menu in draft
     (ISBASE, MAXQTY, optional AVAILQTY, channels, cutoffs)
  -> assistant submits OR manager approves
  -> server validates prices, base item, slot state, and cutoffs
  -> published menu becomes visible to customers
  -> pre-booking later uses the same validated capacity and price rules
```

## Implementation Order

Work in this order. Each phase must be verified before the next phase begins.

1. Database migration and stored procedures.
2. Backend authorization and API contracts.
3. Frontend day-menu planning and approval experience.
4. End-to-end canteen workflow verification.
5. Booking hardening after menu approval is dependable.

## Progress Snapshot

| Plan item | Status | Recorded implementation state |
| --- | --- | --- |
| 1.1 Day-slot uniqueness | Partially complete | `CMS_DAYSLOT.UQ_DAYSLOT` now uses `(CANTEENID, SERVICEID, SERVDATE)`. Stored-procedure comments and multi-canteen test coverage remain. |
| 1.3 `ISBASE` item attribute | Partially complete | `CMS_DAYMENU.ISBASE` has been added with `NOT NULL DEFAULT 1`. History, procedure/API payloads, validation, and the slot-level base-item rule remain. |

---

# 1. Database Plan

## 1.1 Migrate day-slot uniqueness — schema complete

**Files:** `database/schema/splited/DAYSLOT_SCHEMA.sql`, `database/procedures/splited/DAYSLOT_PROCEDURES.sql`

- **Completed:** `UQ_DAYSLOT` now uses `(CANTEENID, SERVICEID, SERVDATE)`.
- The current `CMSADDSLOT` procedure already inserts `CANTEENID`, so the new constraint is applied by the database without a parameter/signature change.
- Update list/create procedure comments to state that a service is reusable across canteens, and add multi-canteen regression tests.
- If this schema is deployed over existing data rather than recreated, supply a migration that checks for duplicates before replacing the old constraint.

**Acceptance:** Breakfast at Canteen A and Breakfast at Canteen B can both be created for the same date; a duplicate in Canteen A cannot.

## 1.2 Use the day slot as the approval unit

**Files:** `database/schema/splited/DAYSLOT_SCHEMA.sql`, `database/schema/splited/DAYMENU_SCHEMA.sql`, and their procedures.

`CMS_DAYSLOT` already represents one `CANTEENID + SERVICEID + SERVDATE` context. It is therefore the approval owner for the complete menu; no new day-menu header table is required.

Add menu workflow fields to `CMS_DAYSLOT`:

```text
MENUAPPRSTATUS, MENUSUBMITTEDBY, MENUSUBMITTEDAT,
MENUAPPROVEDBY, MENUAPPROVEDAT, MENUREMARKS
```

- `MENUAPPRSTATUS`: `DRF`, `PEN`, `APP`, `REJ`.
- Only a day slot with `MENUAPPRSTATUS = 'APP'` is published.
- Add menu workflow history to `CMS_SLOTHIST`, or create a focused `CMS_DMENUAPPHIST` table only if existing slot history cannot accurately retain submit/approve/reject/reopen records.
- Keep `CMS_DAYMENU` as item details with item-level operational `STATUS`; remove item-level approval as the publication authority after migration.

**Acceptance:** one manager action approves all valid item rows in one day slot, and the audit trail identifies the actor and decision.

## 1.3 Extend day-menu item data — `ISBASE` schema partially complete

**Files:** `database/schema/splited/DAYMENU_SCHEMA.sql`, related history table and procedures.

- **Completed:** `CMS_DAYMENU.ISBASE TINYINT(1) NOT NULL DEFAULT 1` has been added.
- Add `ISBASE` to `CMS_DMENUHIST`, update insert/select lists in every day-menu procedure, and expose it through the API and frontend payload.
- Ensure the selected default is intentional: `DEFAULT 1` classifies every newly inserted item as base unless the caller explicitly sends `ISBASE = 0`; `DEFAULT 0` requires the planner to deliberately choose base items. In either case, approval must enforce at least one active base item for the complete slot.
- Change `AVAILQTY` to nullable (`INT NULL`), where `NULL` means unlimited. Do not use `0` to mean unlimited.
- Retain `MAXQTY >= 1` as a required per-customer limit.
- Record `BOOKUNTIL` and `CANCELUNTIL` in item history. Deadline changes are material changes.
- Ensure edits to `ISBASE`, channels, quantities, `BOOKUNTIL`, or `CANCELUNTIL` reopen the approved day slot to draft/pending as appropriate.

**Acceptance:** an approved slot becomes non-published after a material change until it is approved again.

## 1.4 Enforce price readiness in stored procedures

**Files:** `database/procedures/splited/MENUITEM_PRICE_PROCEDURES.sql`, `DAYMENU_PROCEDURES.sql`, common/customer-type procedures as needed.

Create reusable procedure logic that, for a menu item and a serving date:

- loads every active customer type;
- resolves its effective price at the serving date;
- returns missing customer types in a structured result or raises a business error.

Apply this rule to:

- add an item to a draft day menu;
- submit a day-slot menu for approval;
- approve a day-slot menu.

Reject when any active customer type has no effective price. Do not rely on a nullable `DISPLAYPRICE` in the customer menu view.

**Acceptance:** an item missing any active customer-type price cannot enter an approvable slot.

## 1.5 Create batch day-menu procedures

**New/updated procedures:**

```text
CMSREPLACEDMENUITEMS(DAYSLOTID, ITEMSJSON, USERID, REMARKS)
CMSSUBMITDMENU(DAYSLOTID, USERID, REMARKS)
CMSAPPROVEDMENU(DAYSLOTID, USERID, REMARKS)
CMSREJECTDMENU(DAYSLOTID, USERID, REMARKS)
CMSGETDMENUWORKSPACE(DAYSLOTID)
CMSLISTPENDINGDMENUS(...)
```

`ITEMSJSON` should carry `MENUITEMID`, `ISBASE`, `ISPREBOOK`, `ISKIOSK`, `MAXQTY`, optional `AVAILQTY`, deadlines, and optional remarks.

The replacement operation must run in one transaction: validate all entries first, then insert/update/delete the slot detail set together. Do not leave a partially saved menu after one invalid item.

## 1.6 Update published-menu and booking database rules

- `CMSVIEWMENU` must require `CMS_DAYSLOT.MENUAPPRSTATUS = 'APP'` and only return items from that approved slot.
- Return a non-null price by construction; missing price should be impossible after approval.
- Update booking procedures to enforce shared capacity only when `AVAILQTY IS NOT NULL` using row locks.
- Define one source of truth for remaining capacity. Recommended: keep `AVAILQTY` as configured total and calculate booked quantity under lock, rather than decrementing it as a mutable balance.
- On cancel, served, and no-show, follow the selected capacity policy consistently. Recommended: capacity is reserved by active `CR` bookings; cancellation releases it; served/no-show consume it historically.

## 1.7 Database tests / seed updates

- Update seed scripts for day-slot menu workflow fields, `ISBASE`, and prices for all active customer types.
- Add SQL test cases for multi-canteen same-service slots, missing price, no base item, an approved slot, re-approval after edits, optional capacity, and concurrent capacity booking.
- Update `database_reference.md` and ERD files after schema finalization.

---

# 2. Backend Plan

## 2.1 Correct canteen-scoped authorization

**Files:** `backend/src/middlwares/role.middleware.js`, menu/service/day-slot/day-menu routes.

- Use `authorizeCanteenRoles` or a resource-derived equivalent for canteen operations.
- Do not use `authorizeRoles` / `authorizeSystemRoles` for `CTNMNG` and `CTNAST` routes.
- For an existing resource identified only by ID, load its canteen/slot context before checking the caller’s assignment; never trust a client-provided canteen ID for an update/approval.
- Enforce: assistants can create/edit/submit drafts; only managers assigned to the same canteen can approve/reject.
- Apply the same resource-derived canteen check to kitchen preparation, booking monitoring, serving, RFID lookup, kiosk availability, and price-management operations.

### Current access defect to remove

Current routes are not safe for multi-canteen access. `GET /canteens` returns all canteens, some canteen routes use `authorizeRoles` (system roles) for canteen-role codes, and several routes use `authorizeAnyCanteenRole`, which confirms only that the user has a role at *some* canteen. Once a manager passes that role check, they can supply or query another canteen ID without an assignment check.

Required behavior:

```text
Manager assigned to Canteen A      -> access Canteen A only
Manager assigned to Canteens A, B  -> access Canteens A and B only
Manager not assigned to Canteen C  -> 403 for all Canteen C operations
```

Implement a small resource-context helper/repository lookup for `DAYSLOTID`, `DAYMENUID`, and `BOOKID` that returns the owning `CANTEENID`. Run that lookup before every mutation or sensitive read by ID, then call the canteen-role authorization guard with the trusted ID.

## 2.2 Replace item approval API with slot-menu API

**Files:** `backend/src/modules/daymenu/*`, `backend/src/routes/index.routes.js`, Swagger docs.

Recommended contract:

| Method | Endpoint | Purpose | Roles |
| --- | --- | --- | --- |
| GET | `/day-slots/:id/menu` | Complete slot status + item workspace | manager, assistant for that canteen |
| PUT | `/day-slots/:id/menu` | Atomic replacement of draft items | manager, assistant |
| POST | `/day-slots/:id/menu/submit` | Submit assistant draft | manager, assistant |
| POST | `/day-slots/:id/menu/approve` | Approve complete menu | manager only |
| POST | `/day-slots/:id/menu/reject` | Reject complete menu | manager only |
| GET | `/day-menus/pending` | Pending slot menus | manager |
| GET | `/menus` | Published customer menu | authenticated customer |

- Validate `ISBASE`, `MAXQTY`, optional `AVAILQTY`, and time values using Zod.
- Use `REMARKS` consistently; remove the frontend/backend `CHGREASON` vs `REMARKS` mismatch.
- Return complete workspace data after every mutation.

## 2.3 Make price readiness discoverable

Add a manager/assistant endpoint such as:

```text
GET /menu-items/:id/price-readiness?serviceDate=YYYY-MM-DD
```

Return active customer types, effective prices, and missing types. The backend must still enforce the rule on write; this endpoint is only for UX feedback.

## 2.4 Stabilize datetime handling

- Accept local business datetime strings in one documented format, or accept a local date plus time and construct it in the server’s configured timezone.
- Avoid browser `toISOString()` for cutoffs because it changes the displayed local time into UTC.
- Document the API timezone as `Asia/Kolkata` unless deployment configuration explicitly changes it.

## 2.5 Backend verification

- Add integration tests covering manager/assistant scope and approval transitions.
- Test the API against stored procedures in a disposable database schema.
- Make Swagger examples match exact required payload fields.
- Run backend smoke checks for every new route and expected business error.

---

# 3. Frontend Plan

## 3.1 Reshape the day-menu planner around one slot menu

**Files:** `frontend/cms-frontend/src/features/daymenu/*`.

- Keep the canteen/date/service context selector, resolving one `DAYSLOTID`.
- Replace sequential `POST /day-menus` calls with one atomic save of the complete draft.
- Load existing draft/approved slot items into the builder.
- Add fields per selected item: `ISBASE`, pre-book/kiosk flags, `MAXQTY`, optional `AVAILQTY`, booking cutoff, cancellation cutoff.
- Show price-readiness state before an item can be selected: ready, missing customer types, or price loading.
- Disable “submit for approval” until every selected item is price-ready and at least one item is base.

## 3.2 Add manager approval and assistant submission UX

- Assistant: `Save draft` and `Submit for approval`.
- Manager: `Save draft`, `Approve menu`, `Reject menu`, and `Reopen for edits` where business rules allow.
- Present the day slot's menu status badge and a complete review table instead of item-level approve/reject buttons.
- Rejection requires remarks; approval remarks are optional.
- Show exactly which price/customer types or configuration values prevent submission.

## 3.3 Correct route and permission behavior

**Files:** `src/hooks/usePermissions.js`, `src/routes/AppRoutes.jsx`, `src/routes/routeConfig.js`.

- Ensure manager/assistant UI permissions are based on `CANTEENROLES`.
- Make UI route checks match backend authorization, but keep backend as the authority.
- Do not expose manager approval actions to assistants.
- Fetch/filter the canteen selector using the authenticated user's role assignments. Do not show unassigned canteens in management, day-slot, day-menu, kitchen, serving, or pricing screens.
- When the active canteen assignment changes or is removed, clear the selected context and redirect away from canteen-specific operations.
- Customer pre-booking is intentionally different: all active canteens remain selectable because any active customer type may use any canteen.

## 3.4 Update published-menu and preparation screens

- Customer pre-booking must render only slot-approved items and never use `DISPLAYPRICE || 0`.
- If a price is unexpectedly absent, show an unavailable state and report the contract defect rather than showing ₹0.
- Kitchen preparation should display the complete approved slot menu, booked/reserved quantities, served quantities, and remaining preparation quantities.

## 3.5 Frontend verification

- Component tests for price readiness, base-item validation, capacity optionality, and approval action visibility.
- API mock tests for validation errors and atomic save failure.
- Run `npm run lint` and `npm run build` in `frontend/cms-frontend`.

---

# 4. Deferred Booking Work (After Menu Workflow Acceptance)

Do not expand booking features until the preceding phases pass. Then address:

1. Derive `PCUSTOMERID` from authenticated identity for consumer booking; never trust a body value.
2. Enforce booking ownership for list/detail/edit/cancel; staff access must be canteen-scoped.
3. Repair item-level booking update/serving contract so backend payload matches `CMSUPDBOOKITEM`.
4. Implement missing RFID/resolution repository methods and matching routes, or remove the incomplete frontend calls.
5. Correct status code presentation (`CAN`, not `CANC`) and customer sourcing in My Bookings.
6. Complete the bookings monitor and serving workflow after its authorization model is tested.

---

# 5. Definition of Done for the Canteen Workflow

The canteen workflow is ready for booking only when all of the following are demonstrated:

- A manager or assistant can manage only their assigned canteen(s).
- A manager/assistant cannot obtain another canteen's data or mutate it by changing a request ID, query parameter, or frontend state.
- The same service/date can exist independently in two canteens.
- A day slot has one complete draft menu and owns its menu approval state.
- Every selected item has a serving-date-effective price for every active customer type.
- A menu without a base item cannot be submitted or approved.
- Approved menus become unavailable after material edits until reapproved.
- Published-menu queries return only approved slot menus and non-null prices.
- Optional capacity is correctly enforced when configured and ignored when unset.
- Save/submit/approve/reject are atomic, auditable, and show actionable errors.
- Database, API documentation, frontend behavior, and automated verification all use the same contract.
