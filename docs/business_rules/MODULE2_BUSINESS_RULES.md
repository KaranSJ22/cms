
# MODULE2_BUSINESS_RULES

## Canteen Menu & Service Management

Version: 2.0

---

# 1. Purpose

Module 2 manages the complete lifecycle of canteen services and menus before any customer booking occurs.

It allows administrators to:

- Create meal services (Breakfast, Lunch, Dinner, etc.)
- Maintain master menu items
- Configure service slots for specific dates
- Assign menu items to slots
- Define booking windows
- Define cancellation deadlines
- Configure available quantity
- Configure customer booking channels
- Approve or reject menus before publication

Only approved menus become visible to customers.

---

# 2. Status Codes

## 2.1 Service Status

| Code | Meaning | Description |
|-------|----------|-------------|
| A | Active | Service is available for scheduling. |
| D | Disabled | Service is manually disabled. |
| EXP | Expired | Service validity period has ended. |
| BLK | Blocked | Service temporarily blocked by administrator. |

---

## 2.2 Menu Item Status

| Code | Meaning |
|-------|----------|
| A | Active |
| D | Disabled |
| EXP | Expired |
| BLK | Blocked |

Inactive menu items cannot be assigned to any day menu.

---

## 2.3 Day Slot Status

| Code | Meaning |
|-------|----------|
| A | Active |
| D | Disabled |
| EXP | Expired |
| BLK | Blocked |

Only active day slots may receive menu assignments.

---

## 2.4 Day Menu Approval Status

| Code | Meaning |
|-------|----------|
| P | Pending Approval |
| APP | Approved |
| REJ | Rejected |

Approval status controls customer visibility.

---

# 3. Approval Workflow

Every Day Menu follows the workflow below.

```
Created
    │
    ▼
Pending (P)
    │
 ┌──┴──┐
 │     │
 ▼     ▼
APP   REJ
```

Rules:

- Newly created Day Menus always start as **Pending**.
- Only Pending menus may be approved or rejected.
- Approved or Rejected menus cannot be processed again.
- Approval records:
  - Approver
  - Approval time
  - Remarks

---

# 4. Service Rules

## 4.1 Service Code

- Mandatory
- Unique
- Cannot be empty

---

## 4.2 Service Name

Mandatory.

---

## 4.3 Default Time

Every service defines

- Default Start Time
- Default End Time

Business Rule:

```
End Time > Start Time
```

---

## 4.4 Validity

A service may optionally define

- Valid From
- Valid Until

Business Rule

```
Valid Until ≥ Valid From
```

A day slot cannot be created outside this validity period.

---

## 4.5 Active Service Requirement

A Day Slot may only reference a Service whose status is:

```
A (Active)
```

---

# 5. Day Slot Rules

A Day Slot represents one occurrence of a service on a particular date.

Example

Breakfast

```
05-Aug-2026
07:30 - 09:30
```

---

## Rules

Only one slot may exist for:

```
(Service, Date)
```

---

Slot duration must satisfy

```
End Time > Start Time
```

---

Only Active services may create slots.

---

The slot date must lie inside the service validity period.

---

# 6. Menu Rules

A Menu Item is the permanent master definition of food.

Example

- Idli
- Dosa
- Meals
- Tea

---

Rules

Menu Code must be unique.

---

All prices must be

```
>= 0
```

---

Special Item flag

```
0 = Normal

1 = Special
```

---

Only Active menu items can be assigned to Day Menus.

---

# 7. Day Menu Rules

A Day Menu represents one food item available during one Day Slot.

Example

```
Breakfast
↓

Idli
```

---

A Menu Item may appear only once inside a Day Slot.

Unique Key

```
(Day Slot, Menu Item)
```

---

Each Day Menu automatically receives

```
DMENUNO
```

using the Auto Number module.

Example

```
DM202600001
```

Generation is transactional to prevent duplicate numbers.

---

# 8. Quantity Rules

Every Day Menu stores two quantities.

---

## MAXQTY

Maximum quantity a single customer may purchase.

Rule

```
MAXQTY >= 1
```

---

## AVAILQTY

Total inventory available.

Rule

```
AVAILQTY >= 0
```

---

Business Meaning

Example

```
AVAILQTY = 250

MAXQTY = 3
```

means

- 250 total meals exist
- one customer cannot buy more than 3

Module 3 will decrement AVAILQTY during booking.

---

# 9. Booking Window Rules

Each Day Menu defines

- Booking Start
- Booking End

Rule

```
Booking End > Booking Start
```

Customers may book only during

```
Booking Start
↓

Booking End
```

Menus outside this period remain invisible for booking.

---

# 10. Cancellation Rules

Each Day Menu defines one cancellation deadline.

Business Rule

```
Cancellation Deadline
<
Service Start Time
```

Customers cannot cancel after this time.

Module 3 will enforce this rule during cancellation.

---

# 11. Pricing Rules

Each Menu Item stores four independent prices.

| Customer Type | Price Used |
|--------------|------------|
| Permanent Employee | PERMPRICE |
| Other Centre Employee | PERMPRICE |
| Contract Employee | CONTPRICE |
| Visitor | VISPRICE |
| Default | VISPRICE |

All prices

```
>= 0
```

Price selection occurs dynamically when viewing menus.

---

# 12. Customer Visibility Rules

Customers can only view menus satisfying ALL conditions below.

✓ Service is Active

✓ Day Slot is Active

✓ Menu Item is Active

✓ Day Menu is Approved

✓ Current Time lies inside Booking Window

Only then will CMSVIEWMENU return the menu.

---

# 13. Booking Channel Rules

Every Day Menu specifies where it may be ordered.

| Field | Description |
|--------|-------------|
| ISPREBOOK | Available for advance booking |
| ISWALKIN | Available for walk-in purchase |
| ISKIOSK | Available through kiosk |

Each field is Boolean.

```
0 = Disabled

1 = Enabled
```

Module 3 will use these flags when validating bookings.

---

# 14. History / Audit Rules

Every update captures the previous record before modification.

History tables

- CMS_SERVHIST
- CMS_MENUHIST
- CMS_SLOTHIST
- CMS_DMENUHIS

Each history record stores

- Previous values
- User
- Timestamp
- Change Reason

No historical records are modified after creation.

---

# 15. Assumptions for Module 3

Module 3 (Booking & Orders) assumes the following.

- Only Approved Day Menus are bookable.
- Booking is allowed only within the configured booking window.
- Cancellation is allowed only before CANCELAT.
- AVAILQTY will decrease after successful booking.
- MAXQTY limits quantity per booking.
- Booking channel validation uses:
  - ISPREBOOK
  - ISWALKIN
  - ISKIOSK
- Customer price is selected using customer type.
- Day Menu configuration becomes read-only once bookings exist (recommended enforcement).

---

# 16. Future Considerations

The following enhancements are intentionally deferred.

## Dynamic Pricing

Support promotional or seasonal pricing.

---

## Multiple Approval Levels

Department approval before canteen approval.

---

## Menu Versioning

Maintain multiple revisions of the same Day Menu.

---

## Nutritional Information

Store

- Calories
- Protein
- Allergens

---

## Combo Meals

Support meal combinations.

---

## Inventory Integration

Automatically update available quantity based on kitchen inventory.

---

## Booking Freeze Rules

Prevent administrators from editing approved menus after customer bookings begin.

---

## Recurring Day Slots

Automatically generate recurring schedules.

Example

```
Breakfast

Every Monday

08:00–09:30
```

---

## Waitlist

Allow customers to join a waiting list when inventory becomes unavailable.

---

## Dynamic Channel Rules

Different booking windows for

- Mobile
- Web
- Kiosk

---

## Analytics

Future reporting may include

- Most ordered items
- Peak meal hours
- Service utilization
- Food wastage
- Cancellation trends

---

## Scope

Module 2 includes:

- Service Management
- Menu Item Management
- Day Slot Scheduling
- Day Menu Configuration
- Approval Workflow
- Customer Menu Publication

Module 2 does NOT include:

- Customer Booking
- Payment
- Order Lifecycle
- Food Serving
- Inventory Deduction
- Refund Processing

These are handled in Module 3 and later modules.