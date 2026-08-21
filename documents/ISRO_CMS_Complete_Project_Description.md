# ISRO Canteen Management System (CMS)
## Comprehensive Project Description & System Specification

> **Document purpose:** This document describes the Canteen Management System as actually designed and discussed for the ISRO enterprise/intranet environment. It captures the project's scope, business rules, architecture, database concepts, frontend/backend responsibilities, booking and pricing behavior, wallet model, operational workflows, kiosk requirements, and important design decisions.

---

# 1. Executive Summary

The **ISRO Canteen Management System (CMS)** is an enterprise web application intended to digitize the management and operation of institutional canteens serving employees, contract employees, visitors, and other authorized users.

CMS is not designed as a generic food-delivery or restaurant-ordering platform. Its primary purpose is **advance/pre-booking of meals for an institutional canteen**, combined with menu planning, customer-specific pricing, booking management, serving operations, and controlled payment handling for customer categories that require wallet-based transactions.

The system is designed around a canteen department workflow in which authorized canteen personnel prepare services and menus in advance, publish those menus, monitor bookings, and use booking information to prepare and serve the required quantities.

Customers use the consumer-facing application to view published menus and make eligible advance bookings. The system validates the booking against service availability, menu publication, serving date, cutoff rules, customer type, existing bookings, working-day rules, and applicable pricing.

The project is being implemented as a web application using:

- **React** for the frontend.
- **Node.js + Express.js** for the backend.
- **MySQL/InnoDB** for persistence.
- **MySQL Stored Procedures** as the application database-access boundary.
- **JWT** for authentication.
- **bcrypt/bcryptjs** for password verification.
- **Zod** for request validation.
- **Pino** for logging.

A future kiosk phase will extend the system to Raspberry Pi 5 devices with RFID scanners and displays, but the primary web application is the immediate priority.

---

# 2. Project Context

CMS is intended for an **enterprise/intranet deployment across ISRO centres**.

The system is designed for controlled organizational use rather than unrestricted public registration.

The principal operating environment consists of:

- ISRO organizational centres.
- One or more canteens associated with a centre.
- Canteen-department personnel.
- Employees.
- Contract employees.
- Visitors.

The database retains a Centre master even though the deployment model means that an individual deployment is associated with its own organizational environment. The Centre entity remains useful as organizational/reference data and for maintaining the intended data model.

---
# 3. Core Problem

The system is intended to replace manual or fragmented canteen processes such as:

- Preparing menus manually.
- Maintaining future meal plans separately.
- Collecting booking information through disconnected mechanisms.
- Calculating customer-specific prices manually.
- Tracking contract/visitor payments independently.
- Manually determining preparation quantities.
- Manually checking whether a customer has already booked.
- Manually identifying served and pending meals.
- Handling no-shows without a centralized record.
- Maintaining historical menu and price information.
- Giving different users access to different operational functions.

CMS brings these activities into one controlled system.

---

# 4. Primary Objectives

The system aims to:

1. Digitize institutional canteen operations.
2. Support multiple canteens and organizational reference data.
3. Manage customers and their customer types.
4. Provide role-based access.
5. Manage canteen services and day slots.
6. Manage reusable menu items.
7. Plan and publish future menus.
8. Support advance meal booking.
9. Apply customer-type-specific prices.
10. Resolve prices according to the **serving date**.
11. Prevent invalid and duplicate bookings.
12. Handle configured booking cutoff rules.
13. Support working-day, holiday, and week-off logic.
14. Provide serving and no-show workflows.
15. Provide wallet-based transactions for Contract Employees and Visitors.
16. Maintain historical and auditable information.
17. Provide operational visibility into pre-booked, served, and pending quantities.
18. Provide a foundation for future RFID/kiosk operation.
19. Keep business rules consistent by using stored procedures for database operations.

---

# 5. What CMS Is and Is Not

## 5.1 CMS Is Primarily a Pre-Booking System

The current system is centered around **advance/pre-booking**.

A customer normally books a meal for a future serving date after the relevant menu has been prepared and published.

## 5.2 On-the-Spot Booking Is Not the Current Core Model

CMS is not currently designed around general on-the-spot booking at the serving counter.

Future kiosk functionality has a separate next-day booking mode, but that does not change the core principle that the web system is primarily an advance-booking platform.

## 5.3 CMS Is Not a Generic Food-Delivery System

The system does not attempt to provide:

- Restaurant marketplace functionality.
- Delivery tracking.
- Public restaurant discovery.
- Generic e-commerce shopping carts.
- Token-based queue management.

---
# 6. User Interface
We have two ways where customers can interact with the backend
## Office PCs
- Permanent Employee working on their desk can login to website using credentials or SSO(Explained later in this file).
- Can Book for next day, next 7 days or next 30 days only if menu exists for those days.
## Kiosk 
- Every Kiosk has an RFID scanner, any employee can scan their ID card
- Kiosk is only used for booking meals for next day.
- For Contract Employee after scanning it should also show their wallet balance.
- Kiosk also has a HDD/SSD where the user details is stored so we can retrieve their information faster, but need to keep synced with the main database(We still need to discuss more on this).
- Some Kiosk are placed in front of the serving desk so when the consumer tap their ID they should see their booking and the serving staff's PC should also be able to see the booking with option to mark individual item or entire booking as served.(Need to discuss more on this).
---

# 6. Customer Model

The system distinguishes the concept of a **user account** from the **customer who consumes a canteen service**.

The major customer categories are:

1. Permanent Employee.
2. Contract Employee.
3. Visitor.
4. Other Centre Employee.
Customer type affects business behavior such as pricing, eligibility, and payment handling.

---

# 7. Permanent Employee

A Permanent Employee is an organizational employee who is eligible to use the canteen according to configured rules.

Important characteristics:

- Can make eligible advance bookings.
- Uses Permanent Employee pricing.
- Does **not** require a wallet transaction for normal bookings.
- Can be subject to no-show rules.
- A no-show may participate in a salary-deduction process according to organizational policy.
- They are eligible to use Office PC for placing order (website), currently it uses a login id and password, while deployment ISRO have their SSO system which they will integrate with this, the concept of SSO  is described later in this file.
The existence of a booking therefore does not imply the existence of a wallet transaction.

---

# 8. Contract Employee

A Contract Employee is a customer category with payment behavior different from a Permanent Employee.

Important characteristics:

- Can make eligible advance bookings.
- Uses Contract Employee pricing.
- Uses wallet-based payment functionality.
- When a booking is created, the applicable amount is placed on wallet HOLD; it is not immediately debited.
- The amount is captured/debited when the canteen staff serves the applicable order/item or when the booking reaches the defined no-show outcome.
- A booking-related debit transaction references the associated booking; a non-booking wallet withdrawal may have a NULL booking reference.
- Transaction history must remain auditable.

---

# 9. Visitor

Visitors can be registered as customers and may be permitted to use applicable canteen services.

Important characteristics:

- Uses Visitor pricing.
- Uses wallet/payment functionality with the same HOLD → CAPTURE/DEBIT lifecycle as Contract Employees.
- Booking eligibility is controlled by system rules.

---

# 10. Other Centre Employee

The database supports an **Other Centre Employee** customer category.
This category exists for customer classification and associated business behavior, including applicable pricing.

---

# 11. Identity and Access Management

Identity and access are separate from the business concept of customer type.

The identity model includes concepts such as:

- User.
- Customer.
- Customer subtype.
- Consumer roles.
- Canteen roles.
- Authentication credentials.
- Access keys.
- Authorization configuration.

A user can have multiple roles.

This avoids the incorrect assumption that one user can have exactly one system responsibility.

---

# 12. Roles

The CMS role model distinguishes consumer-side responsibilities from canteen-side responsibilities.

Important canteen roles include:

### Admin — `ADM`

Authorized for Identity & Access Management operations
- Create Users.
- Assign Consumer Roles and Canteen Roles.
- Assign Canteen Manager, Assistant, Staff.
### Canteen Manager — `CTNMNG`

Responsible for higher-level canteen administration and configuration.
- Create/Edit Menu Items .
- Create Menu Items prices.
- Create/Edit Services.
- Create/Edit Day Slots.
- Create/Edit Day Menu.(Auto Approved).
- Approve Menu from Assistant.
- Top-up Contract Employee and Visitors Wallets.

### Canteen Assistant

Supports day-to-day canteen operations and administrative tasks.
- Create/Edit Menu Items.
- Create Menu Items prices.
- Create/Edit Services.
- Create/Edit Day Slots.
- Create/Edit Day Menu (Stays as pending needs to be approved by Canteen Manager).
### Canteen Staff — `CTNSTF`

Responsible for serving/operational workflows.
- Serves the employees.
- Marks each individual item or complete booking as served.
- Every Booking which is served should have served by information.
The role architecture is extensible and does not require all future functionality to be represented by a single role.

---

# 13. Identity Tables and Concepts

Important identity-related entities include:

- `CMS_USER`
- `CMS_ROLE`
- `CMS_CUSTOMER`
- `CMS_PERMEMP`
- `CMS_CONTEMP`
- `CMS_OCEEMP`
- `CMS_VISITOR`
- `CMS_CONSUMERROLE`
- `CMS_CANTEENROLE`
- `CMS_ACCKEY`

The final schema separates role assignments and customer classification instead of embedding all authorization behavior directly into the user record.

---

# 14. Authentication

The backend login process uses a stored procedure such as:

`CMSLOGININFO`

The procedure provides information needed by the backend to authenticate and construct the authenticated user context.

The login result can contain information including:

- User ID is same as LoginID, Currently both are separate columns needs to merged and make only one column.
- Password hash.
- Authentication provider.
- Active status.
- Customer ID.
- Customer type code.
- Display name.
- Assigned role codes.

The backend verifies the password using bcrypt/bcryptjs.

A successful login produces a JWT containing the authenticated identity context.

A representative JWT payload contains:

```text
USERID
LOGINID
ROLES
CUSTOMERID
CTYPECODE
```

---

# 15. Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> What is this user allowed to do?

Protected backend operations use authenticated identity and role information.

Examples:

- Customers can access customer booking functions.
- Canteen Managers can manage menu/service operations.
- Canteen Staff can perform serving operations.
- Administrative users can perform appropriate administrative operations.

Authorization must be enforced on the backend and must not rely solely on hiding frontend screens.

---

# 16. System Architecture

The logical architecture consists of:

```text
React Frontend
       |
       v
Express.js API
       |
       v
Authentication / Authorization / Validation
       |
       v
Controller
       |
       v
Service
       |
       v
Repository
       |
       v
MySQL Stored Procedures
       |
       v
MySQL / InnoDB Database
```

The architecture keeps UI concerns, HTTP concerns, business orchestration, and database operations separated.

---

# 17. Backend Technology

The backend uses:

- Node.js
- Express.js
- MySQL
- `mysql2/promise`
- JSON Web Tokens
- bcrypt/bcryptjs
- Zod
- Pino

The backend follows ES module conventions.

---

# 18. Backend Layer Responsibilities

## Routes

Define HTTP endpoints and route requests to controllers.

## Controllers

Handle HTTP-level concerns:

- Request extraction.
- Calling services.
- Returning responses.

## Services

Contain application-level orchestration and business workflow coordination.

## Repositories

Provide the backend/database boundary.

Repositories call stored procedures rather than embedding normal application CRUD SQL.

## Middleware

Responsible for concerns such as:

- Authentication.
- Authorization.
- Validation.
- Error handling.

---

# 19. Stored Procedure Architecture

One of the strongest architectural decisions in CMS is:

> **Normal application database access must be performed through MySQL Stored Procedures.**

The backend should not independently recreate complex database business rules using arbitrary SQL queries.

Repositories call procedures such as:

```text
CALL CMSLOGININFO(...)
CALL CMSADDBOOK(...)
```

and process their result sets.

This approach centralizes important database rules and transaction behavior.

---

# 20. Why Stored Procedures Are Used

Stored procedures provide:

- Centralized business rules.
- Transaction boundaries.
- Consistent validation.
- Reusable database operations.
- Reduced duplication.
- Controlled data modification.
- Better support for concurrency-sensitive workflows.
- Easier auditing of critical database operations.

The backend therefore acts as an application API layer over the stored-procedure-driven database.

---

# 21. Database

The database is:

**MySQL / InnoDB**

Database name:

```text
cms_db
```

The schema is organized conceptually into:

1. Common/master data.
 2. Identity and access.
3. Menu and service management.
4. Booking and serving.
5. Wallet and transactions.
6. Historical/audit information.

---

# 22. Common Master Data

The common/master area contains organizational and reusable reference information.

Important entities include:

- `CMS_CENTER`
- `CMS_CANTEEN`
- `CMS_AUTONOS`
- `CMS_STATUS`


A centre can have multiple canteens.

The canteen entity contains information needed to identify and configure an individual canteen.

The Centre entity remains part of the model for organizational reference.

AUTONOS is used to generate structured ids for most of the table so that it is easy to read when ever reports are generated such as BK for booking, SRV for service, DM for day menu, MI for menu items etc. 

---

# 23. Menu & Service Module

The Menu & Service module is responsible for preparing what the canteen will serve and when it will be served.

Core concepts include:

- Service.
- Day slot.
- Menu item.
- Item price.
- Item price detail.
- Daily menu.
- Menu history.
- Service history.
- Slot history.
- Daily menu history.

Representative tables include:

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

---

# 24. Services

CMS supports services such as:

- Breakfast.
- Lunch.
- Snacks.
- Tiffin / Evening Tiffin.

Services have operational characteristics such as:

- Service identity.
- Service timing.
- Day slots.
- Booking behavior.
- Menu association.

The system is designed so that service behavior is configurable rather than hard-coded into the frontend.

---

# 25. Day Slots

A service can have configured day slots.

A day slot represents the operational time period associated with a service.

The slot configuration is important for:

- Serving schedules.
- Canteen ID to identity which canteen does this slot belong too.
- Booking cutoff time.
- Operational display.
- Service planning.

---

# 26. Menu Items

A menu item represents a reusable food item.

A menu item is not itself a daily booking.

It can be reused across different menus and serving dates.

Examples conceptually include breakfast items, lunch items, snacks, and other configured food items.

---

# 27. Menu Items Do Not Own a Single Permanent Price

A critical design decision was to **not store the active customer price directly on the menu item**.

Instead, pricing is represented separately through:

```text
CMS_ITEMPRICE
CMS_ITEMPRICEDT
```

This allows the same menu item to have different prices for different customer types and different effective periods.

---

# 28. Effective-Dated Pricing

Prices are effective from a particular date.

The system does not need a separate arbitrary end date for every price period.

Conceptually:

```text
Price A
Effective From: 01-Jul

Price B
Effective From: 15-Jul
```

Price B becomes applicable from 15 July.

The previous price remains historically meaningful for dates before the new effective date.

---

# 29. Pricing Is Based on Serving Date

This is one of the most important CMS business rules.

> **The applicable menu-item price is determined using the serving date, not merely the booking creation date.**

Example:

```text
Booking Created: 01-Jul
Serving Date:    20-Jul

Price A effective: 01-Jul
Price B effective: 15-Jul
```

The booking for 20 July must use the price applicable to 20 July.

This matters particularly for long-range bookings.

---

# 30. Why Serving-Date Pricing Matters

Suppose an employee books lunch for 30 future working days on 1 July.

If a price change becomes effective on 15 July, future servings after 15 July cannot incorrectly continue using the old price merely because the booking was created on 1 July.

The system therefore evaluates pricing against the **serving date**.

---

# 31. Daily Menus

`CMS_DAYMENU` represents the menu planned for a particular day/service context.

It connects:

- Serving date.
- Service.
- Applicable menu configuration.
- Booking-related availability.

The daily menu is what ultimately becomes visible to customers for advance booking once it has been prepared and published.

---

# 32. Pre-Booking and Kiosk Availability Flags

The daily menu model includes flags such as:

```text
ISPREBOOK
ISKIOSK
```

`ISPREBOOK` indicates availability through the normal advance-booking workflow, while `ISKIOSK` indicates whether the applicable menu/service context is exposed through the kiosk workflow.

The kiosk workflow is primarily for next-day booking/viewing and defined serving-table operations.

---

# 33. Base Items

A service/day menu must have appropriate base item configuration.

The booking model requires customers to select at least one valid base item where the business rule applies.

This prevents a booking from being created against an unusable or incomplete menu.

Multiple base items may be supported.

---

# 34. Menu Planning Periods

The project uses different planning horizons for different services.

The current operational model includes:

### Breakfast

Generally planned and published for **7 days**.

### Lunch

Generally planned and published for **30 days**.

### Snacks / Evening Tiffin

More flexible planning is supported.

The purpose is to reflect actual canteen operations rather than forcing every service into one identical planning period.

---

# 35. Menu Publication

Customers should not be able to book an arbitrary unpublished menu.

The menu is prepared by authorized canteen personnel and published according to the configured workflow.

Once published, the customer can see the applicable menu subject to:

- Serving date.
- Cutoff.
- Service availability.
- Other booking rules.

### Assistant → Manager Approval

When a Canteen Assistant creates or edits a day menu, it remains **Pending** until reviewed and approved by the Canteen Manager.

```text
Assistant
   ↓
Create / Edit Day Menu
   ↓
PENDING
   ↓
Manager Review
   ↓
APPROVED
   ↓
Published / Available for Booking
```

This is a current menu-management workflow, not merely a future generic approval framework.

---

# 36. Booking Module

The Booking module is the core consumer transaction module.

Its responsibilities include:

- Creating bookings.
- Validating booking eligibility.
- Selecting menu items.
- Resolving prices.
- Preventing invalid duplicates.
- Maintaining booking history.
- Tracking booking state.
- Supporting serving.
- Supporting no-show (booked but not collected at canteen) processing.

Representative booking concepts include:

- Booking header.
- Booking items.
- Booking type.
- Booking history.
- Booking contract/context.
- Active booking state.
- Serving state.

---

# 37. Booking Procedure

A key stored procedure discussed for booking creation is:

```text
CMSADDBOOK
```

Its conceptual parameters include:

```text
PBOOKTYPECODE
PCUSTOMERID
PSERVICEID
PSERVICEDATE
PITEMSJSON
PBOOKEDBY
PREMARKS
```

The procedure is responsible for performing the database-side booking operation and its associated validation/transaction logic.

---

# 38. Booking Request

A booking contains at least the conceptual information:

- Booking type.
- Customer.
- Service.
- Serving date.
- Selected menu items.
- Booking user.
- Remarks where applicable.

The item selection is represented as structured data rather than requiring the frontend to independently create arbitrary booking-item records.

---

# 39. Booking Validation

Before creating a booking, the system must consider:

- Customer exists.
- Customer is active/eligible.
- Service exists and is available.
- Serving date is valid.
- Serving date is within the customer's allowed booking period.
- Menu exists.
- Menu is published/available.
- Selected items are valid.
- Selected items belong to the applicable menu.
- At least one required base item is selected.
- Cutoff rules are satisfied.
- Working-day rules are satisfied.
- Duplicate booking does not already exist.
- Wallet availability/hold rules are satisfied where applicable.

---

# 40. Working Days, Holidays, and Week-Offs

Booking periods cannot be treated as simple calendar-day arithmetic.

The system must account for:

- Canteen working days.
- Holidays.
- Week-offs.
- Configured service availability.

The design discussed support for canteen-specific week-off configuration and holiday handling.

A 30-day booking period therefore means the applicable **working/available serving days**, not necessarily 30 consecutive calendar dates.

---

# 41. Booking Cutoff

Booking cutoff is configurable.

A customer should not be able to create a booking after the applicable cutoff for that serving date/service.

The cutoff is intended to give the canteen sufficient time to finalize preparation quantities.

The exact cutoff can vary according to canteen/service configuration.

---

# 42. Booking Periods

The booking system can support different advance-booking periods.

For Permanent Employees, the discussed model includes:

- Next day.
- Next 7 days.
- Next 30 days.
- Applicable Saturday/Sunday booking scenarios.

The applicable period is determined by system rules and service/menu configuration.

For Contract Employees, the discussed model includes:
- Next day.

---

# 43. Duplicate Booking Prevention

The system must prevent inappropriate duplicate bookings for the same customer/service/serving-date context.

This validation belongs at the database/business-rule level rather than relying solely on frontend checks.

This is important because two requests can arrive concurrently.

---

# 44. Concurrency and Locking

Booking creation is concurrency-sensitive.

For example, two requests could attempt to create the same logical booking at nearly the same time.

The stored procedure/transaction design therefore needs appropriate:

- Transaction boundaries.
- Uniqueness constraints.
- Row locking where necessary.
- Validation inside the transaction.

`FOR UPDATE`-style locking can be used where the relevant row/state needs to be protected.

The objective is to prevent race conditions rather than merely checking duplicates before beginning a transaction.

---

# 45. Booking History

Booking changes and operational events must remain auditable.

Historical booking information is important for:

- Customer queries.
- Canteen operations.
- No-show investigation.
- Financial reconciliation.
- Reporting.
- Audit.

---

# 46. Serving

Serving is performed against an existing booking.

A serving operation should not create a second booking.

The basic flow is:

```text
Existing Booking
      |
      v
Customer Identification
      |
      v
Booking Retrieval
      |
      v
Staff Verification
      |
      v
Serve
      |
      v
Update Serving State
```

The serving state can be used to distinguish served quantities from pending quantities.

---

# 47. Item-Level Serving

The operational model supports serving at the booking-item level.

This is important because a booking may contain multiple items.

The canteen should be able to determine which booked items have been served and which remain pending according to the serving workflow.

---

# 48. Canteen Operational Dashboard

The canteen-side dashboard is not merely a CRUD dashboard.

A major operational requirement is **day-wise quantity visibility**.

For a selected serving day/service, the dashboard should aggregate each item's:

- Pre-booked quantity.
- Served quantity.
- Pending quantity.

The relationship is:

```text
Pending = Pre-booked - Served
```

The dashboard should allow drill-down from an item quantity to:

- Relevant bookings.
- Employees/customers.
- Booking items.

This makes the dashboard useful for actual food preparation and serving operations.

---

# 49. No-Show

A customer can fail to use a booking.

The system needs a distinct no-show concept rather than treating every unserved booking as automatically identical.

No-show information is useful for:

- Operational reporting.
- Customer history.
- Employee policy.
- Salary deduction workflows.

For Permanent Employees, no-show handling can participate in salary deduction according to organizational rules.

---

# 50. Wallet Module

The wallet subsystem is designed for customer types that require controlled monetary payment.

The current requirement is specifically relevant to:

- Contract Employees.
- Visitors.

The wallet is not required for ordinary Permanent Employee bookings.

### Wallet Hold Lifecycle

For wallet-enabled customers, booking creation does not immediately consume money:

```text
Available Balance
      ↓
    HOLD
      ↓
  ┌───┴────┐
  ↓        ↓
SERVED   NO-SHOW
  └───┬────┘
      ↓
CAPTURE / DEBIT
```

Where the business workflow requires release without debit, the hold is released back to the available balance.

---

# 51. Wallet and Booking Relationship

An important database design decision was made around the relationship between bookings and wallet transactions.

A booking should **not require a wallet transaction**.

Reason:

```text
Permanent Employee
    |
    +--> Booking
          |
          +--> No wallet transaction required
```

Whereas:

```text
Contract Employee
    |
    +--> Booking
          |
          +--> Wallet debit transaction
```

Therefore, making every booking point to a transaction would incorrectly force permanent employee bookings into a financial model.

The transaction side can instead reference the booking when a transaction exists.

---

# 52. Why Transaction-to-Booking Association Is Useful

A wallet transaction can be queried for its related booking when necessary.

For example:

```text
Wallet Transaction
       |
       +--> Booking
              |
              +--> Customer
              +--> Service
              +--> Serving Date
              +--> Booking Items
```

This makes contract/visitor transaction reconciliation straightforward while keeping permanent employee bookings valid without financial records.

---

# 53. Wallet Transactions

The wallet subsystem is expected to support transaction types such as:

- Credit.
- Hold.
- Hold release.
- Debit/Capture.
- Adjustment where required.

The finalized schema may represent hold/release through transaction types, statuses, or dedicated wallet structures, but the business distinction must remain explicit.

A transaction should retain enough information to support:

- Amount.
- Transaction type.
- Customer/wallet.
- Related booking where applicable.
- Timestamp.
- Reference information.
- Auditability.

---

# 54. Contract Employee Payment Flow

A conceptual Contract Employee booking flow is:

```text
Contract Employee
       |
       v
Select Menu
       |
       v
Resolve Contract Price for Serving Date
       |
       v
Validate Booking
       |
       v
Check Wallet Balance
       |
       v
Place Amount on HOLD
       |
       v
Create / Confirm Booking
       |
       +------------------+
       |                  |
       v                  v
    SERVED             NO-SHOW
       |                  |
       +--------+---------+
                ↓
          CAPTURE / DEBIT
```

The booking and wallet state must be handled transactionally.

---

# 55. Visitor Payment Flow

Visitors follow the applicable visitor pricing and payment workflow.

Where wallet payment is required:

```text
Visitor
   |
   v
Create Booking
   |
   v
Resolve Visitor Price
   |
   v
Check Wallet
   |
   v
Place HOLD
   |
   v
Serve / No-Show
   |
   v
CAPTURE / DEBIT
```

The transaction must remain auditable.

---

# 56. Permanent Employee Financial Flow

A normal Permanent Employee booking does not require a wallet debit.

The employee's financial consequence, where applicable, can be handled through the organizational salary/no-show process rather than incorrectly treating the booking as a wallet transaction.

---

# 57. Menu and Booking Price Snapshot Consideration

A major design consideration was whether future price changes could cause historical booking values to become ambiguous.

The system's effective-dated pricing resolves the price according to the serving date.

For transaction/history integrity, the architecture also supports the concept of freezing/snapshotting the applicable price into the relevant transactional context where necessary.

The key principle is that once a financial transaction has occurred, its historical amount must not change merely because a future price configuration changes.

---
# 58. Database History

The design intentionally contains historical structures for mutable configuration.

Examples include history for:

- Menus.
- Services.
- Slots.
- Daily menus.
- Other configuration.

Historical records are important because current configuration should not erase the meaning of past operations.

---

# 59. Database Naming and Constraint Conventions

The database follows a consistent `CMS_` naming convention.

Stored procedures use names such as:

```text
CMSLOGININFO
CMSADDBOOK
```

Foreign-key constraints must have unique names.

This was an explicit implementation consideration because duplicate foreign-key constraint names can cause MySQL errors.

Therefore, constraint names must be globally unique within the relevant database namespace.

---

# 60. Important Database Design Decisions

Several design decisions were made deliberately.

### Decision 1 — Menu Item Does Not Own a Single Price

Pricing is separated into price structures.

### Decision 2 — Price Uses Serving Date

Future bookings use the price applicable to their serving date.

### Decision 3 — Booking Does Not Always Require a Transaction

Permanent employees can have bookings without wallet transactions.

### Decision 4 — Transaction Can Reference Booking

This makes financial reconciliation possible without forcing all bookings into the financial model.

### Decision 5 — No Generic Token System

The serving model is based on bookings and customer identification.

### Decision 6 — Pre-Booking Is the Core Workflow

On-spot booking is not the current primary operating model.
### Decision 7 — Stored Procedures Are the Database Boundary

Normal backend data access is performed through stored procedures.

---

# 61. Frontend Architecture

The frontend is implemented using React.

There are two major experiences:

```text
CMS Frontend
├── Canteen Department
└── Consumer
```

The exact codebase has been undergoing restructuring
The goal is to maintain a clean feature-oriented structure rather than leaving the application as one large prototype.

---

# 62. Canteen Department Frontend

The canteen department application is intended for:

- Canteen Manager (can manage one or more canteens).
- Canteen Assistant (assigned to one canteen).
- Canteen Staff (can work in any canteen).
- Authorized administrative users.

The main focus is operational management.

Important screens/workflows include:

- Dashboard.
- Menu item management.
- Service management.
- Day slot management.
- Daily menu management.
- Pricing.
- Booking monitoring.
- Serving.
- Operational quantity analysis.

---

# 63. Consumer Frontend

The consumer application is intended for:

- Permanent Employees.
- Contract Employees.
- Visitors.
- Other Centre Employees.

Important capabilities include:

- Login.
- Viewing available menus.
- Selecting service.
- Selecting serving date.
- Selecting menu items.
- Booking.
- Viewing bookings.
- Viewing booking status.
- Wallet information for applicable customer types.
- Transaction information where applicable.

---

# 64. Frontend Prototype and Backend Integration

The project previously used a Figma Make-generated frontend prototype.

The prototype was useful for establishing:

- Page layouts.
- User flows.
- Dashboard concepts.
- Booking screens.
- Role-based navigation.

However, the prototype was not originally connected to the backend.

The implementation phase therefore requires translating the prototype into the actual project folder structure and connecting it to the real API rather than treating the prototype as the production architecture.

---

# 65. Demonstration Authentication

During frontend development, a frontend-only demonstration authentication mechanism can be used.

Representative demo users include:

- Manager.
- Assistant.
- Permanent Employee.
- Contract Employee.

The demo user determines the appropriate application experience.

This is intended only for frontend demonstration and development and must eventually be replaced/integrated with the real backend authentication mechanism.

---

# 66. API Architecture

The frontend communicates with the backend through REST-style APIs.

The API documentation defines:

- Base URLs.
- Authentication.
- Standard response format.
- Endpoints.
- Request parameters.
- Request bodies.
- Authentication requirements.
- Error behavior.

The frontend should consume documented APIs rather than directly accessing the database.

---

# 67. Standard API Responsibility

The frontend should not contain database business rules.

For example, the frontend should not independently determine:

- Whether a booking is valid.
- Whether the cutoff has passed.
- Whether a price is applicable.
- Whether a customer is eligible.
- Whether a duplicate booking exists.

The frontend can provide UX validation, but the backend/database remains authoritative.

---

# 68. Canteen Manager/Assistant Operational Flow

A typical management workflow is:

```text
Login
  |
  v
Dashboard
  |
  +--> Manage Menu Items
  |
  +--> Manage Menu Items Prices
  |
  +--> Manage Services
  |
  +--> Manage Day Slots
  |
  +--> Prepare Day Menus
  |
  +--> Configure Prices
  |
  +--> Publish Menus
  |
  +--> View Published Menus
  |
  +--> Monitor Bookings
  |
  +--> View Preparation Quantities
```

The dashboard should provide operational information rather than merely links to CRUD screens.

---

# 69. Day-Wise Preparation Dashboard

For a selected day and service, the canteen should be able to see:

| Item   | Pre-Booked | Served | Pending |
| ------ | ---------: | -----: | ------: |
| Item A |          X |      Y |     X-Y |
| Item B |          X |      Y |     X-Y |

The quantities can be drilled into to identify:

- Customers.
- Employees.
- Bookings.
- Booking items.

This helps the canteen department determine how much of each item is required and how much remains to be served.

---

# 70. Consumer Booking Flow

The intended consumer flow is approximately:

```text
Login
  |
  v
Consumer Dashboard
  |
  v
Select Service
  |
  v
Select Serving Date
  |
  v
View Published Menu
  |
  v
Select Base Item(s)
  |
  v
Review Booking
  |
  +--> Permanent Employee
  |        |
  |        +--> Create Booking
  |
  +--> Contract/Visitor
           |
           +--> Validate Wallet
           |
           +--> Create Booking + Transaction
```

---

# 71. Booking Confirmation

A successful booking should provide enough information for the customer to understand:

- Service.
- Serving date.
- Selected items.
- Quantity where applicable.
- Applicable price.
- Booking status.
- Payment status where applicable.

---

# 72. Kiosk System and Local Synchronization

Kiosk functionality is a later implementation phase, but it is expected to become a major channel for next-day pre-booking.

Planned hardware includes:

- Raspberry Pi 5.
- 7-inch display.
- RFID scanner.
- Local persistent storage such as an SSD or other suitable storage medium.

The kiosk maintains synchronized local data/cache for fast retrieval. Depending on the finalized kiosk schema, this may include:

- User/customer identification information.
- Customer type.
- Menu items.
- Applicable day-menu data.
- Kiosk configuration.

The central CMS database remains the authoritative source of truth. Local kiosk storage is a synchronized cache/data layer and must not become an independent business-data authority.

The kiosk is primarily used for **next-day booking and booking viewing**. At serving locations, the employee-facing display can show the employee's booking after RFID identification while the staff-facing screen provides the authorized serving workflow.

# 73. Kiosk Mode 1 — Serving Table

The first kiosk mode is positioned at the canteen serving table.

The environment contains:

```text
Employee
   |
 RFID Scan
   |
   v
Kiosk Display
   |
   +---- Booking Information
   |
   +---- Employee-facing information

Staff PC
   |
   +---- Booking information
   |
   +---- Mark as Served
```

The employee scans their RFID identifier.

The system retrieves the employee's relevant booking.

The employee-facing display shows the appropriate booking information.

The staff-side PC provides authorized staff with the serving control.

---

# 74. Kiosk Mode 2 — Information Kiosk

Some kiosks may be placed independently around the canteen or organizational environment.

Their purpose is informational.

They allow a customer to view relevant bookings and place a booking for the next day only.

A critical privacy requirement is:

> **A standalone information/booking kiosk must not expose the customer's RFID interaction or unnecessary staff-side serving events to canteen staff.**

The information kiosk therefore has a different interaction model from the serving-table kiosk.

---

# 75. Kiosk Mode 3 — Next-Day Booking

A kiosk can also be used to make a booking for the next day.

The key restriction is:

> **The kiosk should allow booking only for the next day.**
> **Allow to view there bookings.**

It should not become a general multi-day booking interface.

The web application remains responsible for broader booking periods such as the configured 7-day/30-day workflows.

---
# 76. Kiosk Privacy Model

Different kiosk modes have different privacy requirements.

### Serving Kiosk

Can expose the information necessary for the customer and serving staff to complete the serving workflow.

### Information Kiosk

Must expose only the customer's relevant booking information and must not expose unnecessary staff-side events.

### Booking Kiosk

Provides a controlled next-day booking experience.

The frontend and backend must therefore distinguish kiosk modes rather than implementing one generic kiosk screen.

---

# 77. Security Requirements

CMS must protect organizational and customer data.

Important requirements include:

- Password hashing.
- JWT validation.
- Role authorization.
- Input validation.
- Stored-procedure-controlled database access.
- Transactional integrity.
- Protection against duplicate booking.
- Controlled kiosk information exposure.
- Auditability of financial operations.
- Proper database constraints.

---

# 78. Data Integrity

Important relationships must be protected using:

- Primary keys.
- Foreign keys.
- Unique constraints.
- Status validation.
- Stored-procedure validation.
- Transactions.

The database should reject invalid references and inconsistent states rather than relying exclusively on the frontend.

---

# 79. Transactional Operations

The following types of operations may require database transactions:

- Booking creation with wallet hold where applicable.
- Wallet hold/release/capture operations.
- Wallet credit.
- Serving updates.
- Multi-record configuration updates.
- Approval state transitions.

For example, a Contract Employee booking must not be confirmed without the required wallet hold.

Final wallet capture/debit must correspond to the defined serving or no-show outcome and must not occur without that business event.

---

# 80. Error Handling

The backend should provide consistent errors through the API layer.

The architecture uses common middleware/utilities for:

- Validation errors.
- Authentication errors.
- Authorization errors.
- Database/business errors.
- Unexpected server errors.

Database procedure failures should be translated into appropriate API responses.

---

# 81. Logging

Pino is used for structured application logging.

Logs should assist with:

- Request tracing.
- Authentication failures.
- Business operation failures.
- Database procedure errors.
- Unexpected application errors.

Sensitive information such as raw passwords must never be logged.

---

# 82. Development Phases

The project has evolved through multiple phases.

## Phase 1 — Core Web Application

The priority is to complete/refine:

- Identity.
- Access.
- Menu items-price, service, day slot, day menu management.
- Booking.
- Canteen department frontend.
- Consumer frontend(Permanent Employee).

## Phase 2 — Wallet

Wallet and financial transactions are required for:

- Contract Employees.
- Visitors.

This is the remaining major business module for the MVP/core system.

## Phase 3 — Kiosk

After the website is operational:

- Raspberry Pi integration.
- RFID.
- Serving kiosk.
- Information kiosk.
- Next-day booking kiosk.

---

# 83. MVP Focus

The current MVP should prioritize the actual web application.

The immediate focus is not to overbuild the kiosk system before the main canteen and consumer workflows are complete.

The core MVP is:

```text
Identity(login)
   +
Menu / Service
   +   
Canteen Operations
   +
Booking
   +
Consumer Frontend
```

---

# 84. Reports and Operational Visibility

The system should eventually support reporting/analysis around:

- Bookings.
- Served meals.
- Pending meals.
- No-shows.
- Customer activity.
- Menu utilization.
- Wallet transactions.
- Daily preparation quantities.

The day-wise operational dashboard is especially important because it directly supports food preparation and serving.

---

# 85. Example End-to-End Scenario
### Canteen Department Flow

1. Canteen Manager or Assistant creates the services which is mostly one time like once I define breakfast as service I will use it always.
2. Manager or Assistant creates/add menu items, which is also one time work, adding menu items daily doesn't make sense unless required.
3. Manager or Assistant assigns prices to menu items according to the employee type, effective dated prices.
4. Manager or Assistant create day slots like on date "dd-mm-yyyy" canteen will provide breakfast service along with cutoff time like employees need to book before or cancel before this cutoff time on that date of slot.
5. once day slot is defined, if manager prepares menu for that day and service it is auto approved, else if assistant prepares it, stays as pending which needs to be approved by manager.
6. once approved the menu will be visible for the employees to book their orders.
7. Better UX would be create a 7 days slot for a single service with menu items at once instead on first create day slot, then create menu for that particular day, which is redundant work.
### Consumer Flow

1. Now Employees see the menu for the date or days which they want to make booking, prices will be shown according to their employment type.
2. They select items to make booking, which should be shown in some cart, they can add or remove items from their booking until cutoff time or may cancel entire booking. 

---

# 86. Example Permanent Employee Scenario

A Permanent Employee books lunch for a future date.

The system:

1. Identifies the customer as a Permanent Employee.
2. Retrieves the applicable published menu.
3. Resolves the Permanent Employee price for the serving date.
4. Validates the booking.
5. Creates the booking.
6. Does **not** create a wallet transaction.

On the serving day, the booking can be served normally.

If the employee does not attend, the booking can subsequently participate in no-show processing.

---

# 87. Example Future Price Change

Suppose:

```text
01-Jul
Employee books lunch for:
01-Jul through 30-Jul

15-Jul
New price becomes effective
```

The booking dates before 15 July use the price applicable to those serving dates.

The dates from 15 July onward use the new applicable price.

This is why the CMS pricing model is effective-dated and serving-date-aware.

---

# 88. Example Operational Quantity Scenario

Suppose 100 portions of a particular item were pre-booked.

During serving:

```text
Pre-booked = 100
Served     = 72
Pending    = 28
```

The dashboard should show:

```text
100 - 72 = 28 pending
```

The canteen operator can drill down into the 28 pending booking items to determine which customers have not yet been served.

---

# 89. Important Architectural Boundaries

The system should preserve the following boundaries:

```text
Frontend
    |
    | HTTP/API
    v
Backend
    |
    | Stored Procedure Calls
    v
Database
```

and:

```text
User
    |
    +--> Authentication
    |
    +--> Role
    |
    +--> Customer
             |
             +--> Customer Type
```

and:

```text
Booking
    |
    +--> Booking Items
    |
    +--> Serving State
    |
    +--> Optional Financial Transaction
```

The financial relationship is optional because not every customer type uses wallet payment.

---

# 90. What Should Not Be Mixed

Several concepts must remain separate.

### User vs Customer

A login identity is not identical to a canteen customer record.

### Customer Type vs Role

Customer type determines business classification.

Role determines authorization.

### Menu Item vs Price

A menu item is reusable food data.

Price is effective-dated and customer-type-specific.

### Booking vs Transaction

A booking is a canteen reservation.

A transaction is a financial event.

### Booking vs Serving

A booking represents the customer's planned meal.

Serving represents fulfillment of that booking.

### Kiosk vs Main Web Application

Kiosk is a specialized future client, not the core CMS itself.

---

# 91. Maintainability Requirements

The implementation should maintain:

- Consistent naming.
- Modular folders.
- Small focused services.
- Repository isolation.
- Reusable validation.
- Consistent API responses.
- Centralized authentication.
- Centralized authorization.
- Stored procedure naming conventions.
- Unique database constraint names.
- Documentation synchronized with implementation.

The frontend should not remain dependent on prototype-specific folder structures.

---

# 92. Documentation

The project maintains documentation for areas such as:

```text
docs/
└── database/
    ├── Overview
    ├── Common
    ├── IdentityAccess
    ├── MenuService
    ├── Booking
    ├── StoredProcedures
    ├── BackendGuide
    ├── FrontendGuide
    └── DataFlow
```

Additional API documentation describes the frontend/backend contract.

The documentation should be treated as part of the engineering deliverable rather than an optional artifact.

---

# 93. Overall System Flow

The complete system can be summarized as:

```text
                    ┌─────────────────────┐
                    │     CMS Database    │
                    │       MySQL         │
                    └──────────┬──────────┘
                               │
                     Stored Procedures
                               │
                    ┌──────────▼──────────┐
                    │    Node / Express   │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                         REST APIs
                               │
              ┌────────────────┴────────────────┐
              │                                 │
      ┌───────▼────────┐              ┌────────▼────────┐
      │ Canteen Portal │              │ Consumer Portal │
      └───────┬────────┘              └────────┬────────┘
              │                                 │
       Canteen Staff/                      Employees/
       Managers                            Contract/
                                          Visitors
              │                                 │
              └──────────────┬──────────────────┘
                             │
                         CMS Workflow
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
      Menu                Booking              Wallet
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                          Serving
                             │
                     Future Kiosk Layer
                             │
                 Raspberry Pi + RFID + Display
```

---

# 94. Final System Definition

The **ISRO Canteen Management System** is a controlled enterprise canteen platform whose central workflow is:

```text
Configure Canteen
      ↓
Configure Services
      ↓
Configure Menu Items
      ↓
Configure Customer-Type Prices
      ↓
Prepare Future Menus
      ↓
Publish Menus
      ↓
Customers Pre-Book
      ↓
Validate Eligibility / Cutoff / Menu / Price
      ↓
Optional Wallet Transaction
      ↓
Booking Confirmed
      ↓
Canteen Prepares Food
      ↓
Customer Identified
      ↓
Booking Served
      ↓
Operational Quantities Updated
      ↓
No-Show / Completion / Audit
```

The system is therefore not simply a collection of CRUD screens. It is an integrated business system in which **identity, customer classification, menu planning, effective-dated pricing, booking, payment, serving, operational quantities, and historical records** must remain consistent.

---

# 95. Project Vision

The long-term vision is to provide a reliable digital platform for ISRO canteen operations that can:

- Serve multiple organizational canteens.
- Handle different customer categories.
- Support complex advance-booking periods.
- Automatically apply correct customer-specific pricing.
- Reduce manual preparation effort.
- Provide real-time operational booking quantities.
- Integrate controlled wallet payments.
- Support RFID-based serving.
- Provide privacy-aware kiosks.
- Maintain strong auditability.
- Remain extensible for future organizational integrations.

The core design principle is:

> **Build the web-based canteen management and pre-booking system correctly first, with a strong database and business-rule foundation, and then extend that foundation to specialized kiosk and operational clients.**
