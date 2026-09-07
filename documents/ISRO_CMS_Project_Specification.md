# ISRO Canteen Management System (CMS)

## System Scope

CMS is an enterprise web application for canteen service management, advance meal booking, menu planning, customer-type pricing, serving, wallet transactions for applicable customers, and RFID/kiosk interaction.

### Technology

- Frontend: React
- Backend: Node.js + Express.js
- Database: MySQL / InnoDB
- Database access: MySQL Stored Procedures
- Authentication: local User ID/password during development; ISRO SSO in production
- Password hashing: bcrypt/bcryptjs
- Validation: Zod
- Logging: Pino
- Database: `cms_db`

### Mandatory database boundary

All normal backend database access must use stored procedures.

```text
React
  ↓
Express API
  ↓
Authentication / Authorization / Validation
  ↓
Controller → Service → Repository
  ↓
MySQL Stored Procedure
  ↓
MySQL / InnoDB
```

The backend must not contain arbitrary application SQL for normal CRUD or business operations in production.


---
# 1. Centre and Canteen

A Centre can have multiple canteens.

```
Centre
 ├── Canteen 1
 ├── Canteen 2
 ├── Canteen 3
 └── ...
```

### Canteen Management

- A **Canteen Manager is assigned to a canteen**.
- A Canteen Manager can be assigned to **one or more canteens**.
- The manager's assignment determines which canteens the manager can manage.
- Canteen operational data is maintained separately for each canteen.

### Menu Items and Services

- **Menu Items are global** and are not specific to a canteen.
- **Services are global** and are not specific to a canteen.
- All canteens can use the same global menu items and services.
- **Prices are global** and do not vary based on the canteen.
- A canteen does not maintain its own separate copy of a menu item or service.

### Canteen-Specific Menu and Scheduling

The following are **canteen-specific**:

- **Day Slot**
    - Defines the serving time for a particular canteen.
    - Different canteens may have different serving times for the same service and date.
- **Day Menu**
    - Defines the menu planned by a particular canteen for a specific serving date and service.
    - Different canteens may have different Day Menus for the same service and serving date.
    - The Day Menu uses the globally defined Menu Items.

---

## 2. User, Customer and Customer Type

CMS separates authentication identity from canteen-service identity.

### User

A User is an authentication identity used to access CMS. A User may have CMS roles and may be associated with a Customer.

### Customer

The Customer record provides the identity used to associate canteen records such as bookings and other customer-specific records with that person.
### Customer Types

1. Permanent Employee
2. Contract Employee
3. Visitor
4. Other Centre Employee

Customer Type determines business behavior such as pricing, booking eligibility and wallet applicability. It is not an authorization role.

```text
User
 ├── Authentication
 ├── CMS Roles
 └── Customer
       └── Customer Type
```

A Customer does not necessarily require a normal web User account. Visitors are the primary example.

---

## 3. Customer Access

### Permanent Employee

- Uses the website.
- Uses local credentials during development.
- Uses ISRO SSO after production integration.
- Can make eligible advance bookings.
- Uses Permanent Employee pricing.
- Does not require wallet payment for normal bookings.
- Can use applicable RFID/kiosk workflows.

### Contract Employee

- Uses the website.
- Uses local credentials during development and ISRO SSO in production.
- Can make eligible advance bookings.
- Uses Contract Employee pricing.
- Uses a wallet.
- Can use RFID/kiosk workflows.
- Kiosk can show wallet balance and allow next-day booking.

### Visitor

- Does not use the normal CMS website.
- Does not receive a normal CMS website password.
- Uses Visitor pricing.
- Uses a wallet where required.
- Interacts through the RFID-enabled kiosk.
- Can use supported kiosk next-day booking functionality.

### Other Centre Employee

- Can use the website.
- Uses applicable Other Centre Employee pricing.
- Can make eligible advance bookings.
- Follows the configured business rules for that customer type.

---

## 4. Roles and Authorization

Current CMS roles:

| Role                 | Code     | Responsibility                                                  |
| -------------------- | -------- | --------------------------------------------------------------- |
| System Administrator | `SYSADM` | Identity/access administration                                  |
| Canteen Manager      | `CTNMGR` | Canteen configuration, menu management, approval and operations |
| Canteen Assistant    | `CTNAST` | Canteen configuration and menu preparation                      |
| Canteen Staff        | `CTNSTF` | Serving operations                                              |


Consumer role assignments are maintained through `CMS_CONSUMERROLE`. Consumer role codes must come from the current database definition; do not invent role codes.

### `SYSADM`

- Create/manage users.
- Manage identity/access.
- Assign consumer roles.
- Assign canteen roles.
- Assign authorized users to canteens.

### `CTNMGR`

- Create/edit menu items.
- Manage menu-item prices.
- Create/edit services.
- Create/edit day slots.
- Create/edit day menus.
- Approve Assistant-created day menus.
- Top up Contract Employee and Visitor wallets.
- Monitor bookings.
- Monitor operational quantities.

Manager-created day menus are automatically approved.

### `CTNAST`

- Create/edit menu items.
- Manage menu-item prices.
- Create/edit services.
- Create/edit day slots.
- Create/edit day menus.
- Prepare menus for Manager approval.
- Monitor applicable operational information.

Assistant-created/edited day menus remain **Pending** until Manager approval.

### `CTNSTF`

- View Total bookings each individual items.
- Retrieve bookings for serving.
- Serve individual booking items.
- Serve an entire booking where authorized.
- Record serving staff information.

Role and canteen assignment are separate. Backend authorization must enforce the user's permitted canteen scope.

---

## 5. Authentication

### Development

CMS uses:

```text
User ID + Password
```

Passwords are stored as hashes and verified with bcrypt/bcryptjs.

Login information is obtained through:

```text
CMSLOGININFO
```

The authenticated CMS context includes information such as:

```text
USERID
LOGINID
CUSTOMERID
CTYPECODE
ROLES
```

### Production SSO

ISRO SSO authenticates the employee. CMS remains authoritative for:

- CMS User
- Customer
- Customer Type
- CMS Roles
- Canteen Scope
- CMS Authorization

```text
ISRO SSO
   ↓
Authenticated Identity
   ↓
CMS User
   ↓
Customer + Customer Type
   ↓
CMS Roles + Canteen Scope
   ↓
CMS Authorization
```

SSO integration must be isolated at the authentication boundary so the rest of CMS uses the same CMS identity/authorization model.

---

## 6. Core Database Entities

### Identity

```text
CMS_USER
CMS_ROLE
CMS_CUSTOMER
CMS_PERMEMP
CMS_CONTEMP
CMS_OCEEMP
CMS_VISITOR
CMS_CONSUMERROLE
CMS_CANTEENROLE
CMS_ACCKEY
```

### Common

```text
CMS_CENTER
CMS_CANTEEN
CMS_AUTONOS
CMS_STATUS
```

### Menu and Service

```text
CMS_SERVICE
CMS_DAYSLOT
CMS_MENUITEM
CMS_ITEMPRICE
CMS_ITEMPRICEDT
CMS_DAYMENU
CMS_MENUHIST
CMS_SERVHIST
CMS_SLOTHIST
CMS_DMENUHIS
```

### Booking

```text
CMS_BOOKTYPE
CMS_BOOKING
CMS_BOOKITEM
CMS_BOOKHIST
CMS_PBACTIVE
```

### Wallet
``` text
CMS_WALLET
CMS_WALLETWD
CMS_WALLETTRAN
```
---

## 7. Functional Modules

### Identity & Access

Users, customers, customer types, roles, access keys and authorization scope.

### Menu & Service Management

Services, day slots, menu items, prices, daily menus and history.

### Booking & Serving

Advance booking, booking items, cancellation, serving, no-show and operational quantities.

### Wallet

Wallet balance, top-ups, booking-related debits, refunds and transaction history for applicable customer types.

### Kiosk/RFID

RFID identification, kiosk booking/viewing, serving-table interaction and local cache synchronization.

---

## 8. Menu and Service Model

The core relationship is:

```text
Canteen
   ↓
Service
   ↓
Day Slot
   ↓
Day Menu
   ↓
Menu Items
```

### Service

Supported examples:

- Breakfast
- Lunch
- Snacks
- Tiffin / Evening Tiffin

A service is normally configured once and reused.

### Day Slot

A Day Slot represents the operational configuration for a **specific serving date and service**.

It is used even when a menu is prepared for only one date.

Example:

```text
15-Aug + Breakfast → one Day Slot
```

The slot contains date-specific information such as the applicable cutoff and canteen/service context.

### Bulk Day-Slot / Day-Menu Creation

Creating seven days of a service uses the same logical implementation as creating one date.

Conceptually:

```text
For each date:
    Validate Service
    Create/validate Day Slot
    Create Day Menu
    Attach Menu Items
```

The API may send all dates as one bulk request to a stored procedure. The stored procedure applies the same date-specific rules to each date.

---

## 9. Menu Items and Pricing

Menu items are reusable food data.

Prices are not stored as one permanent price on the menu item.

Relevant structures:

```text
CMS_MENUITEM
CMS_ITEMPRICE
CMS_ITEMPRICEDT
```

Pricing is:

- Customer-type-specific
- Effective-dated
- Resolved using the **serving date**

Example:

```text
Price A → effective 01-Jul
Price B → effective 15-Jul

Booking created: 01-Jul
Serving date:    20-Jul

Applicable price = Price B
```

A financial transaction's recorded amount must remain historically stable after the transaction occurs.

---

## 10. Day Menu

`CMS_DAYMENU` represents the menu for a specific service/date/day-slot context.

It contains the items available for booking.

Where the booking rule requires a base item, at least one valid base item must be selected.

Availability flags:

```text
ISPREBOOK
ISKIOSK
```

`ISPREBOOK` controls normal advance-booking availability.

`ISKIOSK` controls kiosk availability.

---

## 11. Menu Planning

Current planning horizons:

- Breakfast: generally 7 days
- Lunch: generally 30 eligible working/available days
- Snacks/Evening Tiffin: flexible

“Next 30 days” means the next 30 eligible serving days, not 30 calendar dates.

Saturday and Sunday are evaluated independently according to the configured working schedule.

Examples:

- Saturday open, Sunday closed → Saturday may have a menu; Sunday does not.
- Both open → both may have menus.
- Only Saturday open → only Saturday may have a menu.

Holidays and configured week-offs must be respected.

---

## 12. Menu Approval and Publication

Approved and Published are the same business state.

```text
Manager-created
      ↓
APPROVED / PUBLISHED

Assistant-created
      ↓
PENDING
      ↓
Manager approval
      ↓
APPROVED / PUBLISHED
```

Only approved/published menus are available for customer booking.

There is no separate approval-to-publication business state.

---

## 13. Booking

CMS is primarily an **advance/pre-booking system**.

A booking requires validation of:

- Customer eligibility.
- Service availability.
- Valid serving date.
- Valid Day Slot.
- Published Day Menu.
- Selected menu items.
- Base-item rules.
- Booking cutoff.
- Working-day/holiday/week-off rules.
- Duplicate active booking prevention.
- Wallet balance where applicable.

### No general walk-in booking

General walk-in/on-the-spot booking is not part of the current booking model.

The kiosk's next-day booking is still pre-booking.

---

## 14. Booking Periods

Permanent Employees can use the configured:

- Next-day booking
- Next 7 eligible working/available days
- Next 30 eligible working/available days
- Eligible Saturday/Sunday dates

Contract Employee eligibility follows the configured booking rules.

Kiosk booking is restricted to:

```text
Next day only
```

The kiosk must not provide the website's multi-day booking interface.

---

## 15. Booking Cutoff

The applicable Day Slot defines the booking cutoff.

Before cutoff:

- Eligible booking may be created.
- Eligible booking may be cancelled.
- Wallet refund is allowed for a wallet-paid booking.

After cutoff:

- New booking is not allowed.
- Wallet-paid cancellation/refund is not allowed unless a separately defined business rule permits it.

---

## 16. Booking Data and Procedure

A booking contains:

- Customer
- Service
- Serving date
- Booking type/context
- Selected menu/day-menu items
- Quantity
- Applicable price
- Booking status
- Booking user
- Timestamps

A key booking procedure is:

```text
CMSADDBOOK
```

Conceptual inputs:

```text
PBOOKTYPECODE
PCUSTOMERID
PSERVICEID
PSERVICEDATE
PITEMSJSON
PBOOKEDBY
PREMARKS
```

The stored procedure performs database-side validation and booking creation.

---

## 17. Duplicate Booking and Concurrency

The database must prevent duplicate active bookings for the same customer/service/serving-date context.

This cannot rely only on frontend checks.

Concurrent requests must be handled transactionally using appropriate uniqueness and locking mechanisms.

---

## 18. Booking Cancellation and Wallet Refund

Wallet payment is deducted at booking time.

```text
Booking created
    ↓
Wallet debit
```

If the customer cancels before the cutoff:

```text
Wallet debit
    ↓
Cancellation before cutoff
    ↓
Wallet refund
    ↓
Booking cancelled
```

The original debit and refund must remain auditable.

---

## 19. Wallet

Wallet functionality applies primarily to Contract Employees and Visitors.

### Wallet debit

The amount is **deducted at booking creation**.

There is no:

```text
HOLD → CAPTURE
```

lifecycle.

Booking creation and wallet debit must be transactional.

### Wallet top-up

Authorized canteen-management users can top up applicable customer wallets through cash.

### Booking relationship

A booking does not require a wallet transaction.

```text
Permanent Employee
    ↓
Booking
    └── No wallet transaction required
```

For wallet-enabled bookings:

```text
Wallet Transaction
    ↓
Related Booking
```

Non-booking wallet transactions may have no booking reference where applicable.

---

## 20. No-Show

A no-show means the customer has an active booking but does not collect the booked food during the applicable serving period.

No-show processing occurs after the serving period/window.

The daily no-show process identifies eligible unserved bookings and marks them as no-show.

For wallet-enabled bookings, money was already deducted at booking time. No additional wallet deduction occurs when the booking becomes no-show.

No-show information is included in operational reporting.

---

## 21. Serving

Serving operates on an existing booking.

```text
Customer identification
       ↓
Retrieve booking
       ↓
Staff verification
       ↓
Serve item(s)
       ↓
Record serving information
```

Serving supports:

- Individual item serving
- Entire-booking serving if customer wants all booked item at once
- Served-by information
- Serving timestamps
- Serving state

Because a booking may contain multiple items, item-level serving state must be preserved.

---

## 22. Operational Quantities

For a selected serving date/service/item:

```text
Pending = Pre-booked quantity - Served quantity
```

Example:

```text
Pre-booked = 100
Served     = 72
Pending    = 28
```

The operational view should provide:

- Pre-booked quantity (How much food to prepare)
- Served quantity (insight)
- Pending quantity (just insight)
- Drill-down to booking items
- Drill-down to bookings
- Authorized customer/employee information

---

## 23. Monthly Report

CMS provides a monthly operational report containing:

- Total bookings
- Total served bookings
- Total no-show bookings

This is a CMS operational report.

Salary/payroll processing, Accounts processing and other external organizational procedures are not part of CMS.

---

## 24. Kiosk / RFID

Kiosk is part of the **current implementation scope**.

Available hardware:

- Raspberry Pi 5
- 7-inch display
- RFID scanner
- Local HDD/SSD or equivalent persistent storage

The kiosk does not use token numbers.

RFID is used to identify the customer quickly.

---

## 25. Kiosk Local Cache

Kiosk local storage is a **cache**, not an independent database or source of truth.

```text
Central CMS
    ↓
Synchronization
    ↓
Kiosk Cache
    ↓
RFID Scan
    ↓
Fast Local Lookup
```

The cache may contain only the data required for fast kiosk operation, such as:

- RFID/customer mapping
- Customer display information
- Customer type
- Relevant booking information
- Required menu information
- Kiosk configuration

The cache must be synchronized with CMS.

Authoritative business writes, including bookings and financial operations, must be committed to the central CMS database.

---

## 26. Kiosk Mode 1 — Serving Table

CMS supports serving through kiosks used at the serving area and through handheld/tablet kiosks operated by canteen staff.

A serving-table kiosk is positioned at the canteen serving table. The consumer scans their RFID to identify themselves and retrieve their booking.

```text
(Consumer) Employee 
   ↓
RFID Scan
   ↓
Retrieve Booking
   ↓

Staff marks:
   ├── Individual item(s) as served 
   └── All eligible items as served
   
```

Employee-facing and staff-facing information must be appropriately separated.



---

## 27. Kiosk Mode 2 — Information / Booking

A standalone kiosk can allow a customer to:

- Identify using RFID
- View relevant booking information.
- View Wallet Information of applicable customer type (Contract and Visitor).
- View supported current/future bookings.
- Make a next-day booking where enabled

It must not expose unnecessary staff-side events or another customer's information.

---

## 28. Frontend

CMS has two primary web applications/experiences:

```text
Canteen Department
Consumer
```

### Canteen Department

Used by authorized canteen/administrative roles.

Main functions:

- Dashboard
- Menu item management
- Menu-item pricing
- Service management
- Day-slot management
- Day-menu management
- Approval/publication
- Booking monitoring
- Serving
- Operational quantities
- Wallet administration where authorized
- Monthly operational reporting

### Consumer

Used by:

- Permanent Employees
- Contract Employees
- Other Centre Employees

Main functions:

- Authentication
- View published menus
- Select service/date
- Select menu items
- Review booking
- Create booking
- View bookings
- Cancel eligible bookings
- View wallet information where applicable
- View applicable transaction information

Visitors do not use the normal consumer website.

---

## 29. Frontend and Backend Responsibility

Frontend may perform UX validation but is not authoritative.

Frontend must not independently determine:

- Booking eligibility
- Cutoff validity
- Applicable price
- Customer eligibility
- Duplicate booking
- Wallet sufficiency
- Cancellation eligibility
- No-show state

These rules belong to the backend/stored-procedure workflow.

---

## 30. API Boundary

```text
Frontend
   ↓ HTTP/API
Backend
   ↓
Service / Repository
   ↓
Stored Procedures
   ↓
MySQL
```

Frontend never connects directly to MySQL.

The API must enforce authentication and authorization on protected operations.

---

## 31. Transactional Operations

Operations requiring atomicity include, where applicable:

- Booking creation
- Booking + wallet debit
- Booking cancellation + wallet refund
- Wallet top-up
- Serving updates
- Bulk day-slot/day-menu creation
- Menu approval/publication

The system must not leave partial business states.

---

## 32. Database Integrity

Use:

- Primary keys
- Foreign keys
- Unique constraints
- Status validation
- Stored-procedure validation
- Transactions
- Concurrency controls

Foreign-key constraint names must be unique within the database namespace.

---

## 33. Security and Logging

CMS must enforce:

- Password hashing
- JWT/session validation
- Backend authorization
- Input validation
- Stored-procedure-controlled database access
- Duplicate-booking protection
- Kiosk privacy controls
- Financial transaction auditability

Pino provides structured logs for:

- Request tracing
- Authentication failures
- Authorization failures
- Business failures
- Stored-procedure failures
- Unexpected errors

Passwords and authentication secrets must never be logged.

---

## 34. Important Stored Procedures

Known procedures include:

```text
CMSLOGININFO
CMSADDBOOK
```

The complete procedure set is defined by the current database documentation.

Repositories must call existing stored procedures rather than inventing direct SQL replacements.

---

## 35. Centralized Business Rules

The following must remain centralized and consistent across web and kiosk clients:

- Menu publication availability
- Day-slot validity
- Booking cutoff
- Working-day calculation
- Holiday/week-off handling
- Customer eligibility
- Customer-type pricing
- Duplicate booking prevention
- Wallet debit/refund
- Cancellation eligibility
- No-show determination
- Serving state
- Authorization
- Kiosk next-day restriction

---

## 36. Current Non-Goals

The following are not CMS requirements:

- General walk-in/on-the-spot booking
- Token-number queue management
- Visitor website login/password
- `FRONTOFF` role
- `APPROVER` role
- Salary/payroll processing
- Accounts-section processing
- External organizational workflows
- Restaurant marketplace
- Food delivery

---

## 37. Final End-to-End Flow

### Configuration

```text
Canteen
  ↓
Services
  ↓
Menu Items
  ↓
Customer-Type Prices
```

### Menu Preparation

```text
Serving Dates
  ↓
Day Slots
  ↓
Day Menus
  ↓
Manager → Approved/Published
Assistant → Pending → Manager Approval → Approved/Published
```

### Booking

```text
Customer
  ↓
Published Menu
  ↓
Service + Serving Date
  ↓
Menu Items
  ↓
Eligibility / Cutoff / Price Validation
  ↓
Wallet Debit if applicable
  ↓
Booking Confirmed
```

### Serving

```text
Booking
  ↓
Customer Identification
  ↓
Staff Verification
  ↓
Serve Item(s)
  ↓
Serving Recorded
```

### No-Show

```text
Booking
  ↓
Serving Window Ends
  ↓
Not Collected
  ↓
No-Show
```

### Kiosk

```text
RFID
  ↓
Kiosk Cache / CMS Lookup
  ↓
Customer Identification
  ↓
View Booking / Next-Day Booking / Serving
  ↓
Central CMS Database
```

---

## 38. Implementation Authority

When implementing CMS, use this order of authority:

1. Current database schema and stored procedures
2. Current API documentation
3. Current frontend/backend implementation
4. This specification
5. Explicitly confirmed business decisions

Do not infer a feature from an older document.

Do not reintroduce removed concepts such as:

- `ISWALKIN`
- `FRONTOFF`
- `APPROVER`
- Wallet HOLD/CAPTURE
- Salary deduction processing
- Future-phase kiosk implementation

When a required implementation detail is not defined by the current specification or database/API documentation, treat it as **TBD** rather than inventing behavior.
