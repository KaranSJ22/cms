# ISRO CMS — Database Reference Report
**Database:** `cms_db` (MySQL / InnoDB)  
**Schema source:** `database/schema/splited/`  
**Procedures source:** `database/procedures/splited/`  
**Generated:** 2026-08-20

---

## 1. Naming Conventions

| Rule | Value |
|---|---|
| Table prefix | `CMS_` |
| Column names | `UPPERCASE`, no underscores |
| Procedure names | `CMS` prefix, e.g. `CMSADDBOOK` |
| Primary keys | `{ENTITYNAME}ID` (e.g. `BOOKID`) |
| FK columns | Same name as the PK they reference |
| Status columns | `STATUS VARCHAR(20)` — single-letter codes (`'A'`/`'D'`) unless noted |
| Audit columns | `CREATEDAT`, `UPDATEDAT`, `CREATEDBY`, `CHANGEDBY`, `CHGREASON` |

---

## 2. Entity Map (Tables by Domain)

```
SYSTEM MASTER
  CMS_STATUS      CMS_CUSTTYPE      CMS_SCREEN      CMS_AUTONOS

ORGANISATION
  CMS_CENTER  →  CMS_CANTEEN

IDENTITY
  CMS_USER   (login accounts)
  CMS_ROLE   (roles)  →  CMS_ROLESCN  (role ↔ screen mapping)
  CMS_CUSTOMER  (all bookable persons — FK to CMS_USER)
     ├── CMS_PERMEMP   (permanent employees)
     ├── CMS_CONTEMP   (contract employees)
     ├── CMS_OCEEMP    (other-centre employees)
     └── CMS_VISITOR   (one-day visitors)
  CMS_CONSUMERROLE   (which ROLE the CUSTOMER has as a consumer)
  CMS_CANTEENROLE    (which ROLE a USER has in a CANTEEN — staff)
  CMS_ACCKEY         (access keys / badges per CUSTOMER)

SERVICE & MENU
  CMS_SERVICE         (global: Breakfast / Lunch / Dinner …)
  CMS_SERVHIST        (audit log of service changes)
  CMS_MENUITEM        (global item catalog: Idli, Rice, …)
  CMS_MENUHIST        (audit log of item changes)
  CMS_ITEMPRICE       (price header — effective-from date)
  CMS_ITEMPRICEDT     (price per customer type — CTYPECODE)
  CMS_MENUTPL         (reusable menu template)
  CMS_MENUTPLDT       (items within a template)

DAY OPERATIONS
  CMS_DAYSLOT         (dated instance of a service, canteen-scoped)
  CMS_SLOTHIST        (audit log of slot changes)
  CMS_DAYMENU         (item offered on a dayslot — the daily menu)
  CMS_DMENUHIST       (audit log of daymenu changes)

BOOKING
  CMS_BOOKTYPE        (PB = Pre-Book, KS = Kiosk)
  CMS_BOOKCTR         (sequence counter per booktype × service)
  CMS_BOOKING         (booking header)
  CMS_BOOKITEM        (booking line items)
  CMS_PBACTIVE        (uniqueness guard — one PB per customer/service/date)
  CMS_BOOKHIST        (booking terminal-event history)
  CMS_BOOKITMHS       (item snapshot at each terminal event)

WALLET
  CMS_WALLET          (balance ledger per customer)
  CMS_WALLETTRAN      (immutable transaction ledger)
  CMS_WALLETWD        (withdrawal request)
```

---

## 3. Table Reference

### 3.1 System Masters

#### `CMS_STATUS` — Status master (lookup table)
| Column | Type | Notes |
|---|---|---|
| `STATUSID` | INT PK | |
| `STATUSCODE` | VARCHAR(10) | e.g. `'A'`, `'D'`, `'PEN'` |
| `STATUSNAME` | VARCHAR(50) | Display name |
| `STATUSGRP` | VARCHAR(30) | Groups codes by context (e.g. `'BOOKING'`, `'WALLET'`) |
| `ISACTIVE` | TINYINT(1) | `1` = active |

#### `CMS_CUSTTYPE` — Customer type master
| Column | Type | Notes |
|---|---|---|
| `CTYPEID` | INT PK | |
| `CTYPECODE` | VARCHAR(20) UNIQUE | `'PERM'`, `'CONT'`, `'OCE'`, `'VIS'` |
| `CTYPENAME` | VARCHAR(80) | |
| `ISACTIVE` | TINYINT(1) | |

> **Note for backend/frontend:** `CTYPECODE` is the key used everywhere in pricing (`CMS_ITEMPRICEDT.CTYPECODE`) and wallet eligibility checks. Never use `CTYPEID`.

#### `CMS_SCREEN` — Screen / route registry
| Column | Type | Notes |
|---|---|---|
| `SCREENID` | INT PK | |
| `SCREENCODE` | VARCHAR(50) UNIQUE | e.g. `'BOOKING_LIST'` |
| `SCREENNAME` | VARCHAR(100) | Display name |
| `ROUTEPATH` | VARCHAR(150) | Frontend route path |
| `ISACTIVE` | TINYINT(1) | |

#### `CMS_AUTONOS` — Auto-number config
Used by `CMSGENAUTO` to generate formatted document numbers. Not called directly by business features; used for reference numbers if needed outside booking.

---

### 3.2 Organisation

#### `CMS_CENTER`
| Column | Type | Notes |
|---|---|---|
| `CENTERID` | INT PK | |
| `CENTERCODE` | VARCHAR(20) UNIQUE | |
| `CENTERNAME` | VARCHAR(120) | |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |
| `CREATEDBY` | INT FK→USER | |

#### `CMS_CANTEEN`
| Column | Type | Notes |
|---|---|---|
| `CANTEENID` | INT PK | |
| `CENTERID` | INT FK→CENTER | |
| `CANTEENCODE` | VARCHAR(20) | Unique within center |
| `CANTEENNAME` | VARCHAR(120) | |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

---

### 3.3 Identity & Access

#### `CMS_USER`
| Column | Type | Notes |
|---|---|---|
| `USERID` | INT PK | |
| `LOGINID` | VARCHAR(50) UNIQUE | Used for serving-counter lookup |
| `PASSHASH` | VARCHAR(255) | bcrypt hash |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

#### `CMS_ROLE`
| Column | Type | Notes |
|---|---|---|
| `ROLEID` | INT PK | |
| `ROLECODE` | VARCHAR(20) UNIQUE | |
| `ROLENAME` | VARCHAR(80) | |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

#### `CMS_ROLESCN` — Role ↔ Screen mapping
Defines which screens a role can access. Backend uses `CMSGETROLESCN` to load permissions after login.

#### `CMS_CUSTOMER` — All bookable persons
| Column | Type | Notes |
|---|---|---|
| `CUSTOMERID` | INT PK | |
| `USERID` | INT FK→USER UNIQUE | May be NULL for visitors without login |
| `CTYPECODE` | VARCHAR(20) FK→CUSTTYPE | `'PERM'`/`'CONT'`/`'OCE'`/`'VIS'` |
| `DISPNAME` | VARCHAR(120) | Display name used in booking views |
| `MOBILE` | VARCHAR(20) | |
| `EMAIL` | VARCHAR(120) | |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

#### Customer Type Extension Tables (1:1 with CMS_CUSTOMER)

| Table | Type | Key Extra Columns |
|---|---|---|
| `CMS_PERMEMP` | Permanent Employee | `EMPCODE`, `DEPT`, `DESIG` |
| `CMS_CONTEMP` | Contract Employee | `CONTCODE`, `VENDORNAME`, `CONTSTART`, `CONTEND` |
| `CMS_OCEEMP` | Other-Centre Employee | `EMPCODE`, `CENTERNAME`, `VALIDFROM`, `VALIDUNTIL` |
| `CMS_VISITOR` | Visitor | `VISNAME`, `VISMOBILE`, `VISORG`, `VISDATE`, `VALIDUNTIL` |

> **Backend note:** `CMSREGPERM`, `CMSREGCONT`, `CMSREGOCE`, `CMSREGVIS` create CMS_USER + CMS_CUSTOMER + extension row atomically.

#### `CMS_CONSUMERROLE` — Consumer role assignment
Links a `CUSTOMERID` to a `ROLEID` for portal access control.

#### `CMS_CANTEENROLE` — Staff role assignment
Links a `USERID` to a `ROLEID` scoped to a `CANTEENID`.

#### `CMS_ACCKEY` — Access keys / badges
| Column | Type | Notes |
|---|---|---|
| `ACCKEYID` | INT PK | |
| `CUSTOMERID` | INT FK | |
| `KEYCODE` | VARCHAR(80) | Card UID / QR value |
| `KEYTYPE` | VARCHAR(20) | `'CARD'`, `'QR'`, etc. |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

---

### 3.4 Service & Menu

#### `CMS_SERVICE` — Global service catalog *(fixed in this session)*
| Column | Type | Notes |
|---|---|---|
| `SERVICEID` | INT PK | |
| `SERVCODE` | VARCHAR(20) UNIQUE | `'BF'`, `'LN'`, `'DN'` etc. |
| `SERVNAME` | VARCHAR(80) | `'Breakfast'`, `'Lunch'` |
| `DEFSTART` | TIME | Default slot start time |
| `DEFEND` | TIME | Default slot end time |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

> No `CANTEENID` — services are **global**. Canteen scoping is at `CMS_DAYSLOT` level.

#### `CMS_MENUITEM` — Global item catalog
| Column | Type | Notes |
|---|---|---|
| `MENUITEMID` | INT PK | |
| `MENUCODE` | VARCHAR(20) UNIQUE | Short code |
| `SHORTNAME` | VARCHAR(30) | Used in kitchen/compact views |
| `ITEMNAME` | VARCHAR(100) | Full name |
| `ITEMDESCR` | VARCHAR(255) | Optional description |
| `ISSPECIAL` | TINYINT(1) | `1` = special/premium item |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

#### `CMS_ITEMPRICE` + `CMS_ITEMPRICEDT` — Tiered pricing

**Price resolution query (use this pattern everywhere in backend):**
```sql
SELECT IPD.PRICE
FROM   CMS_ITEMPRICE    IP
JOIN   CMS_ITEMPRICEDT  IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
WHERE  IP.MENUITEMID = :menuItemId
  AND  IPD.CTYPECODE = :cTypeCode     -- e.g. 'PERM', 'CONT', 'VIS'
  AND  IP.EFFFROM   <= :serviceDate
  AND  IP.STATUS     = 'A'
ORDER BY IP.EFFFROM DESC
LIMIT 1;
```

`CMS_ITEMPRICE` — price band header (one per item per effective-from date)  
`CMS_ITEMPRICEDT` — one row per customer type within a band

| Column (ITEMPRICEDT) | Type | Notes |
|---|---|---|
| `ITEMPRICEID` | INT FK→ITEMPRICE | |
| `CTYPECODE` | VARCHAR(20) FK→CUSTTYPE | The customer type this price applies to |
| `PRICE` | DECIMAL(10,2) | |

---

### 3.5 Day Operations

#### `CMS_DAYSLOT` — Dated service instance (canteen-scoped)
| Column | Type | Notes |
|---|---|---|
| `DAYSLOTID` | INT PK | |
| `SERVICEID` | INT FK→SERVICE | |
| `CANTEENID` | INT FK→CANTEEN | Canteen scoping at this level |
| `SERVDATE` | DATE | |
| `STARTTIME` | TIME | |
| `ENDTIME` | TIME | |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |
| Unique | | `(SERVICEID, SERVDATE)` — one slot per service per day |

#### `CMS_DAYMENU` — Items on a day's menu
| Column | Type | Notes |
|---|---|---|
| `DAYMENUID` | INT PK | |
| `DMENUNO` | VARCHAR(20) UNIQUE | Auto-generated document number |
| `DAYSLOTID` | INT FK→DAYSLOT | |
| `MENUITEMID` | INT FK→MENUITEM | |
| `ISSPECIAL` | TINYINT(1) | Override special flag for this day |
| `ISPREBOOK` | TINYINT(1) | `1` = available for pre-booking |
| `ISKIOSK` | TINYINT(1) | `1` = available at kiosk |
| `BOOKUNTIL` | DATETIME | Pre-booking cutoff — **enforced by CMSADDBOOK** |
| `CANCELUNTIL` | DATETIME | Cancel/edit cutoff — **enforced by CMSCANCELBOOK, CMSUPDBOOKITEM** |
| `AVAILQTY` | INT | Total available units |
| `MAXQTY` | INT | Max per booking |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` (operational — can flip many times) |
| `APPRSTATUS` | VARCHAR(20) | `'PEN'` / `'APP'` / `'REJ'` — approval workflow |
| `APPROVEDBY` | INT FK→USER NULL | |
| `APPROVEDAT` | DATETIME NULL | |
| Unique | | `(DAYSLOTID, MENUITEMID)` — one item once per slot |

> **Trigger `TRG_DAYMENU_APPR_RESET`:** If an approved (`APP`) daymenu row is edited (qty/flags change), `APPRSTATUS` is automatically reset to `'PEN'` and approval cleared.

---

### 3.6 Booking

#### `CMS_BOOKTYPE` — Booking type master
| `BOOKTYPECODE` | Meaning |
|---|---|
| `'PB'` | Pre-Book (MVP focus) |
| `'KS'` | Kiosk (future) |

#### `CMS_BOOKCTR` — Sequence counter
Scoped per `(BOOKTYPEID, SERVICEID)`. Locked with `FOR UPDATE` inside `CMSADDBOOK` and `CMSBULKBOOK` to guarantee unique sequential booking numbers.

#### `CMS_BOOKING` — Booking header
| Column | Type | Notes |
|---|---|---|
| `BOOKID` | INT PK | Internal ID — **not for UI display** |
| `BOOKNO` | VARCHAR(30) UNIQUE | Business number, e.g. `'PB-BF001'` — use this in UI |
| `BOOKTYPEID` | INT FK | |
| `CUSTOMERID` | INT FK | |
| `SERVICEID` | INT FK | |
| `SERVICEDATE` | DATE | |
| `STATUS` | VARCHAR(10) | See booking status codes below |
| `BOOKSEQNO` | BIGINT | Sequence within booktype+service |
| `TOTALITEMS` | INT | Count of distinct items |
| `TOTALQTY` | INT | Sum of quantities |
| `TOTALAMOUNT` | DECIMAL(12,2) | Total booking value |
| `BOOKEDBY` | INT FK→USER | Who placed the booking |
| `BOOKEDON` | DATETIME | |
| `CANCELLEDBY` | INT FK→USER NULL | |
| `CANCELLEDON` | DATETIME NULL | |
| `SERVEDBY` | INT FK→USER NULL | |
| `SERVEDON` | DATETIME NULL | |
| `NOSHOWON` | DATETIME NULL | |

**Booking Status Codes:**
| Code | Meaning | Terminal? |
|---|---|---|
| `CR` | Created / Active | No |
| `SRV` | Served | ✅ Yes |
| `CAN` | Cancelled | ✅ Yes |
| `NOS` | No-Show | ✅ Yes |
| `PRT` | Partial (reserved for future) | — |

#### `CMS_BOOKITEM` — Booking line items
| Column | Type | Notes |
|---|---|---|
| `BOOKITEMID` | INT PK | |
| `BOOKID` | INT FK→BOOKING | |
| `DAYMENUID` | INT FK→DAYMENU | |
| `MENUITEMID` | INT FK→MENUITEM | |
| `QTY` | INT | |
| `RATE` | DECIMAL(10,2) | Price **at time of serving** (for wallet customers), price at booking time displayed |
| `AMOUNT` | DECIMAL(12,2) | `QTY × RATE` |
| `STATUS` | VARCHAR(10) | Mirrors booking status |
| Unique | | `(BOOKID, DAYMENUID)` — one item per booking |

> **Design note:** `RATE` is calculated at serving time for wallet customers. At booking time the current price is displayed to the user but only finalized at serve.

#### `CMS_PBACTIVE` — Pre-booking uniqueness guard
Primary key `(CUSTOMERID, SERVICEID, SERVICEDATE)`. Prevents a customer from having more than one active PB for the same service+date. Inserted by `CMSADDBOOK`/`CMSBULKBOOK`, deleted on cancel.

#### `CMS_BOOKHIST` / `CMS_BOOKITMHS` — Terminal event history
Full snapshots written at `SRV`, `CAN`, `NOS` transitions. Immutable.

---

### 3.7 Wallet

#### `CMS_WALLET`
| Column | Type | Notes |
|---|---|---|
| `WALLETID` | INT PK | |
| `CUSTOMERID` | INT UNIQUE FK | One wallet per customer |
| `BALANCE` | DECIMAL(12,2) | Actual balance (≥ 0) |
| `RESERVEDAMT` | DECIMAL(12,2) | Reserved by pending withdrawals (≤ BALANCE) |
| `STATUS` | VARCHAR(20) | `'A'` / `'D'` |

> **Available balance formula:** `BALANCE - RESERVEDAMT`  
> Wallet is for **CONT** and **VIS** customers only. **PERM** and **OCE** pay nothing / pay separately.

#### `CMS_WALLETTRAN` — Immutable ledger
| `TRANSTYPE` | `SOURCECODE` | Trigger |
|---|---|---|
| `CREDIT` | `OPENING` | Wallet created |
| `CREDIT` | `TOPUP` | Manager top-up |
| `DEBIT` | `BOOKING` | Booking served |
| `CREDIT` | `BOOKINGREFUND` | Booking cancelled |
| `DEBIT` | `WITHDRAWAL` | Withdrawal approved |

#### `CMS_WALLETWD` — Withdrawal request
| `STATUS` | Meaning |
|---|---|
| `REQ` | Pending / requested |
| `COMPLETED` | Paid out — ledger entry created |
| `REJECTED` | Rejected — reservation released |
| `CANCELLED` | Cancelled by requester |

---

## 4. Stored Procedure Reference

All procedures use the `CMS` prefix. Every procedure that modifies data uses `START TRANSACTION` / `COMMIT` + `ROLLBACK` on `SQLEXCEPTION`. Parameters prefixed with `P` are inputs.

### 4.1 System / Common

| Procedure | Signature (key params) | Returns |
|---|---|---|
| `CMSGENAUTO` | `(PTBLNAME, PDATAITEM, PUSEDBY)` | `OUTPARAM PGENNO VARCHAR` — formatted auto-number |
| `CMSADDSTATUS` / `CMSUPDSTATUS` | status CRUD | — |
| `CMSGETSTATUS` / `CMSLISTSTATUS` | — | Result set |
| `CMSADDCUSTTYPE` / `CMSUPDCUSTTYPE` | cust-type CRUD | — |
| `CMSGETCUSTTYPE` / `CMSLISTCUSTTYPE` | — | Result set |
| `CMSADDSCREEN` / `CMSUPDSCREEN` | screen CRUD | — |
| `CMSSETROLESCN` | `(PROLEID, PSCREENID, PSETBY)` | Assign screen to role |
| `CMSGETROLESCN` | `(PROLEID, PSCREENID)` | Single permission row |
| `CMSLISTROLESCN` | `(PROLEID)` | All screens for role |
| `CMSREMOVEROLESCN` | `(PROLEID, PSCREENID)` | Remove permission |
| `CMSADDAUTONO` / `CMSUPDAUTONO` / `CMSLISTAUTONO` | auto-number config CRUD | — |

---

### 4.2 Organisation

| Procedure | Notes |
|---|---|
| `CMSADDCENTER` / `CMSUPDCENTER` | Create/update center |
| `CMSACTCENTER` / `CMSDEACTCENTER` | Toggle STATUS `A`/`D` |
| `CMSGETCENTER` / `CMSLISTCENTER` / `CMSSEARCHCENTER` | Reads |
| `CMSADDCANTEEN` / `CMSUPDCANTEEN` | Create/update canteen |
| `CMSACTCANTEEN` / `CMSDEACTCANTEEN` | Toggle |
| `CMSGETCANTEEN` / `CMSLISTCANTEEN(PCENTERID)` / `CMSSEARCHCANTEEN` | Reads |

---

### 4.3 Identity & Access

| Procedure | Key Params | Notes |
|---|---|---|
| `CMSADDUSER` | `(PLOGINID, PPASSHASH, …)` | Create login account |
| `CMSUPDUSER` | `(PUSERID, …)` | |
| `CMSACTUSER` / `CMSDEACTUSER` | `(PUSERID)` | |
| `CMSGETUSER` | `(PUSERID)` | Single user |
| `CMSLISTUSER` | `(PCANTEENID, PPAGE, PPAGESIZE)` | Paginated |
| `CMSSEARCHUSER` | `(PKEYWORD)` | |
| `CMSCHANGEPWD` | `(PUSERID, POLDPWD, PNEWPWD)` | Validates old pwd before change |
| `CMSLOGININFO` | `(PLOGINID)` | Returns user + roles + accessible screens — **primary login call** |
| `CMSADDROLE` / `CMSUPDROL` | — | Role CRUD |
| `CMSACTROL` / `CMSDEACTROL` | `(PROLEID)` | |
| `CMSGETROL` / `CMSLISTROL` | — | |
| `CMSASSIGNCONSROL` | `(PCUSTOMERID, PROLEID, PASSIGNEDBY)` | Grant consumer role |
| `CMSREMOVECONSROL` | `(PCUSTOMERID, PROLEID)` | |
| `CMSLISTCONSROL` | `(PUSERID)` | All consumer roles for a user |
| `CMSASSIGNCANROL` | `(PUSERID, PROLEID, PCANTEENID, PASSIGNEDBY)` | Grant staff role at canteen |
| `CMSREMOVECANROL` | `(PUSERID, PROLEID, PCANTEENID)` | |
| `CMSLISTCANROL` | `(PUSERID)` | Staff roles for a user |
| `CMSLISTCANROLSTAFF` | `(PCANTEENID)` | All staff at a canteen |
| `CMSADDCUST` / `CMSUPDCUST` | — | Customer CRUD |
| `CMSGETCUST` | `(PCUSTOMERID)` | |
| `CMSLISTCUST` | `(PPAGE, PPAGESIZE)` | |
| `CMSSEARCHCUST` | `(PKEYWORD)` | |
| `CMSGETCUSTBYUSER` | `(PUSERID)` | Returns customer record for a logged-in user |
| `CMSREGPERM` | `(PUSERID_or_NEW, PEMPCODE, PDEPT, PDESIG, …)` | Atomic: USER + CUSTOMER + PERMEMP |
| `CMSREGCONT` | `(…PCONTCODE, PVENDORNAME, …)` | Atomic: USER + CUSTOMER + CONTEMP |
| `CMSREGOCE` | `(…PEMPCODE, PCENTERNAME, …)` | Atomic: USER + CUSTOMER + OCEEMP |
| `CMSREGVIS` | `(…PVISNAME, PVISDATE, …)` | Atomic: USER + CUSTOMER + VISITOR |
| `CMSADDACCKEY` / `CMSUPDACCKEY` | `(PCUSTOMERID, PKEYCODE, PKEYTYPE, …)` | Badge/card CRUD |
| `CMSACTACCKEY` / `CMSDEACTACCKEY` | `(PACCKEYID)` | |
| `CMSLISTACCKEY` | `(PCUSTOMERID)` | All keys for a customer |
| `CMSVALIDATEACCKEY` | `(PKEYCODE, PKEYTYPE)` | Returns customer record if key is valid + active — used for kiosk/badge login |

---

### 4.4 Service & Menu

| Procedure | Key Params | Notes |
|---|---|---|
| `CMSADDSERV` | `(PSERVCODE, PSERVNAME, PDEFSTART, PDEFEND, PCREATEDBY)` | No CANTEENID — global |
| `CMSUPDSERV` | `(PSERVICEID, …)` | |
| `CMSACTSERV` / `CMSDEACTSERV` | `(PSERVICEID, PCHANGEDBY, PCHGREASON)` | Writes to SERVHIST |
| `CMSGETSERV` | `(PSERVICEID)` | |
| `CMSLISTSERV` | `()` | All global services |
| `CMSSEARCHSERV` | `(PKEYWORD)` | |
| `CMSADDMENUITEM` | `(PMENUCODE, PSHORTNAME, PITEMNAME, …)` | |
| `CMSUPDMENUITEM` | `(PMENUITEMID, …)` | |
| `CMSACTMENUITEM` / `CMSDEACTMENUITEM` | `(PMENUITEMID, PCHANGEDBY, PCHGREASON)` | Writes to MENUHIST |
| `CMSGETMENUITEM` | `(PMENUITEMID)` | |
| `CMSLISTMENUITEM` | `(PCANTEENID, PSERVICEID)` | Filter by service |
| `CMSSEARCHMENUITEM` | `(PKEYWORD)` | |
| `CMSADDITEMPRICE` | `(PMENUITEMID, PEFFFROM, PPRICESJSON, PCREATEDBY)` | `PPRICESJSON`: `[{"CTYPECODE":"PERM","PRICE":30}, …]` |
| `CMSGETITEMPRICE` | `(PMENUITEMID, PCTYPECODE, PSERVICEDATE)` | Returns single effective price |
| `CMSGETITEMPRICEDT` | `(PMENUITEMID, PSERVICEDATE)` | Returns all type-prices for an item on a date |
| `CMSLISTITEMPRICE` | `(PMENUITEMID)` | Full price band history for an item |
| `CMSDEACTITEMPRICE` | `(PITEMPRICEID)` | Withdraw a future price band |
| `CMSADDMENUTPL` / `CMSUPDMENUTPL` | template CRUD | |
| `CMSGETMENUTPL` / `CMSLISTMENUTPL(PCANTEENID, PSERVICEID)` | reads | |
| `CMSDEACTMENUTPL` | `(PMENUTPLID)` | |
| `CMSADDMENUTPLDT` | `(PMENUTPLID, PMENUITEMID)` | Add item to template |
| `CMSREMOVEMENUTPLDT` | `(PMENUTPLDTID)` | |
| `CMSLISTMENUTPLDT` | `(PMENUTPLID)` | Items in a template |
| `CMSAPPLYMENUTPL` | `(PMENUTPLID, PDAYSLOTID, PAPPLIEDBY)` | Bulk-insert DAYMENU rows from template |

---

### 4.5 Day Slot & Day Menu

| Procedure | Key Params | Notes |
|---|---|---|
| `CMSADDSLOT` | `(PSERVICEID, PCANTEENID, PSERVDATE, PSTARTTIME, PENDTIME, PCREATEDBY)` | Creates dated slot |
| `CMSUPDSLOT` | `(PDAYSLOTID, …)` | Writes to SLOTHIST |
| `CMSACTSLOT` / `CMSDEACTSLOT` | `(PDAYSLOTID, PCHANGEDBY, PCHGREASON)` | |
| `CMSGETSLOT` | `(PDAYSLOTID)` | |
| `CMSLISTSLOT` | `(PCANTEENID, PSERVICEID, PFROMDATE, PTODATE)` | Filtered list |
| `CMSADDDMENU` | `(PDAYSLOTID, PMENUITEMID, PBOOKUNTIL, PCANCELUNTIL, PAVAILQTY, PMAXQTY, PISPREBOOK, PISKIOSK, PCREATEDBY)` | Add item to day menu |
| `CMSUPDDDMENU` | `(PDAYMENUID, …)` | Editing an APP row resets to PEN via trigger |
| `CMSGETDMENU` | `(PDAYMENUID)` | |
| `CMSLISTDMENU` | `(PDAYSLOTID, PAPPRSTATUS)` | Items for a slot — filter by approval status |
| `CMSAPPDMENU` | `(PDAYMENUID, PAPPROVEDBY)` | Sets `APPRSTATUS = 'APP'` |
| `CMSREJDMENU` | `(PDAYMENUID, PREJECTEDBY, PREMARKS)` | Sets `APPRSTATUS = 'REJ'` |
| `CMSACTDMENU` / `CMSDEACTDMENU` | `(PDAYMENUID)` | Toggle operational status |
| `CMSVIEWMENU` | `(PCANTEENID, PSERVICEID, PSERVDATE, PCTYPECODE)` | **Employee-facing published menu.** Returns only `APP` + active items with the correct price for `PCTYPECODE`, `BOOKUNTIL`, remaining qty |
| `CMSLISTKITCHENPREP` | `(PDAYSLOTID)` | **Kitchen view.** Per-item counts: PLANNED / BOOKED / SERVED / REMAINING |

---

### 4.6 Booking

| Procedure | Key Params | Notes |
|---|---|---|
| `CMSADDBOOK` | `(PCUSTOMERID, PSERVICEID, PSERVICEDATE, PBOOKTYPECODE, PITEMSJSON, PBOOKEDBY)` | `PITEMSJSON`: `[{"DAYMENUID":5,"QTY":1}, …]`. Enforces BOOKUNTIL, duplicate guard via PBACTIVE, wallet reservation for CONT/VIS |
| `CMSUPDBOOKITEM` | `(PBOOKID, PITEMSJSON, PUPDATEDBY)` | Replace all items. Enforces CANCELUNTIL cutoff |
| `CMSCANCELBOOK` | `(PBOOKID, PCANCELLEDBY, PCHGREASON, PISSTAFFOVERRIDE)` | `PISSTAFFOVERRIDE=1` bypasses CANCELUNTIL. Refunds wallet. Writes to BOOKHIST. Releases PBACTIVE |
| `CMSSERVEBOOK` | `(PBOOKID, PSERVEDBY)` | Marks `SRV`. Debits wallet (CONT/VIS). Writes history snapshot |
| `CMSNOSHOWBOOK` | `(PBOOKID, PMARKEDBY)` | Marks `NOS`. Debits wallet (CONT/VIS). Writes history snapshot |
| `CMSTOGGLEKIOSK` | `(PBOOKID, PTOGGLEDBY)` | Switches booking channel flag |
| `CMSGETBOOK` | `(PBOOKID)` | **RS-1:** header. **RS-2:** items (uses `ITEMNAME` not `MENUNAME`) |
| `CMSLISTBOOK` | `(PCANTEENID, PSERVICEID, PSERVDATE, PSTATUS)` | Management-facing unfiltered list (no pagination — use with date filter) |
| `CMSLISTKITCHENPREP` | `(PDAYSLOTID)` | (See Day Menu above) |

---

### 4.7 Reporting & Serving *(new file)*

| Procedure | Key Params | Returns |
|---|---|---|
| `CMSGETBOOKFORSERVING` | `(PLOGINID, PBOOKNO)` | **RS-1:** booking header. **RS-2:** items. Lookup by BOOKNO (priority) or LOGINID (today's active PB) |
| `CMSGETMONTHLYEXP` | `(PCUSTOMERID, PYEAR, PMONTH)` | Single row: `AMOUNTSPENT`, `AMOUNTPENDING`, `TOTALCOMMITTED`, `TOTALBOOKINGS` |
| `CMSLISTBOOKHISTORY` | `(PCUSTOMERID, PSTARTDATE, PENDDATE, PSTATUS, PPAGE, PPAGESIZE)` | Paginated rows. Each row carries `TOTALROWS`, `TOTALPAGES`, `CURRENTPAGE`, `PAGESIZE` |
| `CMSBULKBOOK` | `(PCUSTOMERID, PSERVICEID, PSTARTDATE, PDAYCOUNT, PITEMSJSON, PBOOKEDBY)` | **RS-1:** summary (`TOTALATTEMPTED`/`TOTALBOOKED`/`TOTALSKIPPED`). **RS-2:** per-date detail (`SERVICEDATE`, `RESULT`, `BOOKID`, `BOOKNO`, `SKIPREASON`). `PDAYCOUNT` must be `7` or `30`. `PITEMSJSON`: `[{"MENUITEMID":5,"QTY":1}, …]` |

---

### 4.8 Wallet

| Procedure | Key Params | Notes |
|---|---|---|
| `CMSADDWALLET` | `(PCUSTOMERID, POPENINGAMT, PPAYMENTMETHOD, PCREATEDBY)` | Opens wallet. Minimum opening Rs. 100. Creates initial CREDIT ledger entry |
| `CMSADDWALLETAMT` | `(PCUSTOMERID, PAMT, PPAYMENTMETHOD, PREFNO, PADDEDBY)` | Top-up. Creates CREDIT ledger entry |
| `CMSGETWALLET` | `(PCUSTOMERID)` | Wallet summary: `BALANCE`, `RESERVEDAMT`, computed `AVAILABLEBAL` |
| `CMSLISTWALLETTRAN` | `(PCUSTOMERID, PFROMDATE, PTODATE, PPAGE, PPAGESIZE)` | Paginated ledger statement |
| `CMSREQWALLETWD` | `(PCUSTOMERID, PAMT, PREQUESTEDBY)` | Raises withdrawal request. Reserves `PAMT` immediately |
| `CMSAPPWALLETWD` | `(PWALLETWDID, PPROCESSEDBY, PPAYMENTMETHOD, PREFNO)` | Approves withdrawal. Debits BALANCE. Releases reservation. Creates DEBIT ledger entry |
| `CMSREJWALLETWD` | `(PWALLETWDID, PPROCESSEDBY, PREMARKS)` | Rejects. Releases reservation only. No ledger entry |
| `CMSLISTWALLETWD` | `(PCUSTOMERID, PSTATUS)` | Withdrawal request list — `PSTATUS` optional filter |

---

## 5. Key Business Rules (DB-Enforced)

| Rule | Enforcement Point |
|---|---|
| One pre-booking per customer per service per date | `CMS_PBACTIVE` PK constraint + `CMSADDBOOK` |
| Booking window must be open | `CMSADDBOOK`: `CURRENT_TIMESTAMP <= DM.BOOKUNTIL` |
| Edit/cancel window must be open | `CMSUPDBOOKITEM` / `CMSCANCELBOOK`: `CURRENT_TIMESTAMP <= DM.CANCELUNTIL` |
| Staff can override cancel cutoff | `CMSCANCELBOOK(PISSTAFFOVERRIDE=1)` |
| Only `APP` items can be booked | `CMSADDBOOK` validates `DM.APPRSTATUS = 'APP'` |
| Editing an approved daymenu resets it to pending | `TRG_DAYMENU_APPR_RESET` trigger on `CMS_DAYMENU` |
| Wallet never goes negative | `CMS_WALLET.CK_WAL_BALANCE CHECK(BALANCE >= 0)` |
| Wallet reservation ≤ balance | `CMS_WALLET.CK_WAL_RES_BAL CHECK(RESERVEDAMT <= BALANCE)` |
| Wallet transactions are immutable | No UPDATE/DELETE procedures exist for `CMS_WALLETTRAN` |
| Unique booking sequence numbers | `CMS_BOOKCTR` locked with `FOR UPDATE` |
| Service is global (no canteen scope) | `CMS_SERVICE` has no `CANTEENID` — scope is at `CMS_DAYSLOT` |
| Price by customer type | `CMS_ITEMPRICEDT.CTYPECODE` — always resolve via `CMSGETITEMPRICE` |

---

## 6. Status Code Quick Reference

| Table | Column | Codes |
|---|---|---|
| Most tables | `STATUS` | `'A'` = Active, `'D'` = Disabled |
| `CMS_DAYMENU` | `APPRSTATUS` | `'PEN'` / `'APP'` / `'REJ'` |
| `CMS_BOOKING`, `CMS_BOOKITEM` | `STATUS` | `'CR'` / `'SRV'` / `'CAN'` / `'NOS'` / `'PRT'` |
| `CMS_WALLETTRAN` | `TRANSTYPE` | `'CREDIT'` / `'DEBIT'` |
| `CMS_WALLETTRAN` | `SOURCECODE` | `'OPENING'` / `'TOPUP'` / `'BOOKING'` / `'BOOKINGREFUND'` / `'WITHDRAWAL'` |
| `CMS_WALLETWD` | `STATUS` | `'REQ'` / `'COMPLETED'` / `'REJECTED'` / `'CANCELLED'` |
| `CMS_BOOKTYPE` | `BOOKTYPECODE` | `'PB'` / `'KS'` |
| `CMS_CUSTTYPE` | `CTYPECODE` | `'PERM'` / `'CONT'` / `'OCE'` / `'VIS'` |

---

## 7. Wallet Eligibility by Customer Type

| CTYPECODE | Wallet Required | Booking Payment |
|---|---|---|
| `PERM` | ❌ No wallet | Pay by policy (billed centrally) |
| `OCE` | ❌ No wallet | Pay by policy |
| `CONT` | ✅ Wallet | Deducted from wallet at serving |
| `VIS` | ✅ Wallet | Deducted from wallet at serving |

> Backend must check `CTYPECODE` from `CMS_CUSTOMER` before any booking or wallet operation.

---

## 8. Backend Integration Notes

1. **Login flow:** Call `CMSLOGININFO(PLOGINID)` — returns user, all roles, and all accessible screens in one call. Use screen list to build frontend route guards.

2. **Serving counter flow:**  
   Step 1: `CMSGETBOOKFORSERVING(PLOGINID or PBOOKNO)` — get booking  
   Step 2: `CMSSERVEBOOK(PBOOKID, PSERVEDBY)` — mark served

3. **Employee portal menu flow:**  
   `CMSVIEWMENU(PCANTEENID, PSERVICEID, PSERVDATE, PCTYPECODE)` — returns only bookable items with the correct price for that customer type.

4. **Pricing:** Never hard-code prices. Always resolve via `CMSGETITEMPRICE` or `CMSGETITEMPRICEDT` using `CTYPECODE` + `SERVICEDATE`.

5. **Multi-result-set procedures:** `CMSGETBOOK`, `CMSGETBOOKFORSERVING`, `CMSBULKBOOK` return 2 result sets each. Backend driver must call `nextResultSet()` to retrieve both.

6. **Bulk booking JSON shape:** `CMSBULKBOOK` takes `MENUITEMID` (not `DAYMENUID`) because the same menu items must map to different `DAYMENUID`s on each date.

7. **Single-day booking JSON shape:** `CMSADDBOOK` and `CMSUPDBOOKITEM` take `DAYMENUID` (not `MENUITEMID`), because the frontend selects from a specific day's menu.

8. **Pagination:** `CMSLISTBOOKHISTORY` and `CMSLISTWALLETTRAN` are the only paginated history procedures. `CMSLISTBOOK` is unpaginated — always supply a date filter.
