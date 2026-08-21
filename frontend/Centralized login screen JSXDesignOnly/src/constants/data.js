import { T } from "./tokens.js"

export const CUSTOMER_TYPES = [
  { code: "PERMANENT",   label: "Permanent",    desc: "Regular staff members",        color: "#60a5fa" },
  { code: "CONTRACT",    label: "Contract",     desc: "Contract / temporary staff",   color: "#a78bfa" },
  { code: "VISITOR",     label: "Visitor",      desc: "Guest & external visitors",    color: "#34d399" },
  { code: "OTHERCENTRE", label: "Other Centre", desc: "Inter-centre transfers",       color: "#fb923c" },
]

export const SEED_DATA = [
  { id: 1,  menuCode: "MNU001", shortName: "VEG-THALI",  itemName: "Vegetarian Thali (Full)",    status: "A" },
  { id: 2,  menuCode: "MNU002", shortName: "EGG-CURRY",  itemName: "Egg Curry with Rice",        status: "A" },
  { id: 3,  menuCode: "MNU003", shortName: "CHKN-BIRL",  itemName: "Chicken Biryani",            status: "A" },
  { id: 4,  menuCode: "MNU004", shortName: "SAMBAR-RCE", itemName: "Sambar Rice",                status: "P" },
  { id: 5,  menuCode: "MNU005", shortName: "MASALA-DOS", itemName: "Masala Dosa",                status: "A" },
  { id: 6,  menuCode: "MNU006", shortName: "FISH-FRY",   itemName: "Fish Fry Plate",             status: "D" },
  { id: 7,  menuCode: "MNU007", shortName: "CURD-RICE",  itemName: "Curd Rice with Pickle",      status: "EXP" },
  { id: 8,  menuCode: "MNU008", shortName: "PANEER-BTR", itemName: "Paneer Butter Masala",       status: "A" },
  { id: 9,  menuCode: "MNU009", shortName: "SOUP-VEG",   itemName: "Mixed Vegetable Soup",       status: "BLK" },
  { id: 10, menuCode: "MNU010", shortName: "UPMA-BFAST", itemName: "Upma Breakfast Combo",       status: "A" },
  { id: 11, menuCode: "MNU011", shortName: "POHA-BFAST", itemName: "Poha with Chutney",          status: "P" },
  { id: 12, menuCode: "MNU012", shortName: "CHKN-CURRY", itemName: "Chicken Curry with Roti",    status: "D" },
]

export const STATUS_META = {
  A:   { label: "Active",      colors: T.active },
  D:   { label: "Deactivated", colors: T.deactivated },
  P:   { label: "Pending",     colors: T.pending },
  EXP: { label: "Expired",     colors: T.expired },
  BLK: { label: "Blocked",     colors: T.blocked },
}

export const blankPrices = () =>
  CUSTOMER_TYPES.map(ct => ({ custType: ct.code, price: "" }))

export const DAY_SLOTS = [
  { code: "BREAKFAST", label: "Breakfast", time: "07:00 – 09:30", color: "#fb923c", icon: "🌅" },
  { code: "LUNCH",     label: "Lunch",     time: "12:00 – 14:30", color: "#60a5fa", icon: "☀️" },
  { code: "SNACKS",    label: "Snacks",    time: "16:00 – 17:30", color: "#a78bfa", icon: "🫖" },
  { code: "DINNER",    label: "Dinner",    time: "19:00 – 21:00", color: "#34d399", icon: "🌙" },
]

export const SEED_DAY_MENUS = [
  { id: 1, daySlot: "BREAKFAST", menuCode: "MNU010", itemName: "Upma Breakfast Combo",
    availQty: "80", maxQty: "100", bookUntilDate: "2026-08-11", bookUntilTime: "06:30",
    cancelUntilDate: "2026-08-11", cancelUntilTime: "06:00",
    isPrebook: true, isKiosk: false, status: "PENDING", remarks: "", createdAt: "10 Aug 2026, 08:14" },
  { id: 2, daySlot: "LUNCH", menuCode: "MNU001", itemName: "Vegetarian Thali (Full)",
    availQty: "120", maxQty: "150", bookUntilDate: "2026-08-11", bookUntilTime: "11:30",
    cancelUntilDate: "2026-08-11", cancelUntilTime: "11:00",
    isPrebook: true, isKiosk: true, status: "PENDING", remarks: "", createdAt: "10 Aug 2026, 09:02" },
  { id: 3, daySlot: "LUNCH", menuCode: "MNU003", itemName: "Chicken Biryani",
    availQty: "60", maxQty: "80", bookUntilDate: "2026-08-11", bookUntilTime: "11:30",
    cancelUntilDate: "2026-08-11", cancelUntilTime: "11:00",
    isPrebook: false, isKiosk: true, status: "PENDING", remarks: "", createdAt: "10 Aug 2026, 09:15" },
  { id: 4, daySlot: "SNACKS", menuCode: "MNU005", itemName: "Masala Dosa",
    availQty: "50", maxQty: "70", bookUntilDate: "2026-08-11", bookUntilTime: "15:30",
    cancelUntilDate: "2026-08-11", cancelUntilTime: "15:00",
    isPrebook: true, isKiosk: true, status: "PENDING", remarks: "", createdAt: "10 Aug 2026, 10:45" },
]

export const DEMO_USERS = [
  { loginId: "manager",   password: "manager123",   name: "K. Ramachandran",  employeeId: "MGR-001",  role: "canteen_manager",    dept: "Canteen Department" },
  { loginId: "assistant", password: "assistant123", name: "S. Venkataraman",  employeeId: "AST-001",  role: "canteen_assistant",  dept: "Canteen Department" },
  { loginId: "employee",  password: "employee123",  name: "Rajesh Kumar",     employeeId: "EMP-1042", role: "employee_permanent", dept: "Mission Operations" },
  { loginId: "contract",  password: "contract123",  name: "Suresh Babu",      employeeId: "CON-2203", role: "employee_contract",  dept: "External Services"  },
]

export const CONTRACT_WALLET_BALANCE = 870.00
export const CONTRACT_WALLET_TRANSACTIONS = [
  { id: 1,  date: "2026-08-10", type: "CREDIT", amount: 500,  balance: 870,   reference: "TXN-2026-0810-A01", description: "Wallet top-up by Canteen Manager" },
  { id: 2,  date: "2026-08-10", type: "DEBIT",  amount: 55,   balance: 370,   reference: "TXN-2026-0810-B02", description: "Lunch booking", bookingNo: "BKG-20260810-001" },
  { id: 3,  date: "2026-08-09", type: "DEBIT",  amount: 35,   balance: 425,   reference: "TXN-2026-0809-B01", description: "Breakfast booking", bookingNo: "BKG-20260809-003" },
  { id: 4,  date: "2026-08-08", type: "CREDIT", amount: 1000, balance: 460,   reference: "TXN-2026-0808-A01", description: "Wallet top-up by Canteen Manager" },
  { id: 5,  date: "2026-08-07", type: "DEBIT",  amount: 55,   balance: -540,  reference: "TXN-2026-0807-B03", description: "Lunch booking", bookingNo: "BKG-20260807-005" },
  { id: 6,  date: "2026-08-06", type: "DEBIT",  amount: 50,   balance: -485,  reference: "TXN-2026-0806-B01", description: "Dinner booking", bookingNo: "BKG-20260806-002" },
  { id: 7,  date: "2026-08-05", type: "DEBIT",  amount: 55,   balance: -435,  reference: "TXN-2026-0805-B02", description: "Lunch booking", bookingNo: "BKG-20260805-004" },
  { id: 8,  date: "2026-08-04", type: "CREDIT", amount: 500,  balance: -380,  reference: "TXN-2026-0804-A01", description: "Wallet top-up by Canteen Manager" },
]

export const BOOKING_STATUS_META = {
  CR:  { label: "Created",          bg: "rgba(59,130,246,0.10)",  text: "#3b82f6", border: "rgba(59,130,246,0.25)",  dot: "#3b82f6" },
  SRV: { label: "Served",           bg: "rgba(22,163,74,0.10)",   text: "#16a34a", border: "rgba(22,163,74,0.25)",   dot: "#16a34a" },
  CAN: { label: "Cancelled",        bg: "rgba(220,38,38,0.09)",   text: "#dc2626", border: "rgba(220,38,38,0.2)",    dot: "#dc2626" },
  NOS: { label: "No-Show",          bg: "rgba(100,116,139,0.10)", text: "#64748b", border: "rgba(100,116,139,0.22)", dot: "#94a3b8" },
  PRT: { label: "Partially Served", bg: "rgba(234,179,8,0.10)",   text: "#ca8a04", border: "rgba(234,179,8,0.22)",   dot: "#eab308" },
}

export const SEED_BOOKINGS = [
  { id: 1,  bookingNo: "BKG-20260811-001", customerId: "EMP-1042", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11" },
  { id: 2,  bookingNo: "BKG-20260811-002", customerId: "EMP-0871", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11" },
  { id: 3,  bookingNo: "BKG-20260811-003", customerId: "CON-2203", service: "BREAKFAST", status: "NOS", bookedAt: "2026-08-11" },
  { id: 4,  bookingNo: "BKG-20260811-004", customerId: "EMP-0334", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11" },
  { id: 5,  bookingNo: "BKG-20260811-005", customerId: "VIS-0018", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11" },
  { id: 6,  bookingNo: "BKG-20260811-006", customerId: "EMP-1109", service: "LUNCH",     status: "CAN", bookedAt: "2026-08-11" },
  { id: 7,  bookingNo: "BKG-20260811-007", customerId: "CON-1887", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11" },
  { id: 8,  bookingNo: "BKG-20260811-008", customerId: "EMP-0553", service: "LUNCH",     status: "PRT", bookedAt: "2026-08-11" },
  { id: 9,  bookingNo: "BKG-20260811-009", customerId: "EMP-2214", service: "LUNCH",     status: "SRV", bookedAt: "2026-08-11" },
  { id: 10, bookingNo: "BKG-20260811-010", customerId: "EMP-0771", service: "SNACKS",    status: "CR",  bookedAt: "2026-08-11" },
  { id: 11, bookingNo: "BKG-20260811-011", customerId: "CON-0490", service: "SNACKS",    status: "CR",  bookedAt: "2026-08-11" },
  { id: 12, bookingNo: "BKG-20260811-012", customerId: "VIS-0031", service: "SNACKS",    status: "CAN", bookedAt: "2026-08-11" },
  { id: 13, bookingNo: "BKG-20260811-013", customerId: "EMP-1302", service: "DINNER",    status: "CR",  bookedAt: "2026-08-11" },
  { id: 14, bookingNo: "BKG-20260811-014", customerId: "EMP-0882", service: "DINNER",    status: "CR",  bookedAt: "2026-08-11" },
  { id: 15, bookingNo: "BKG-20260811-015", customerId: "CON-3311", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11" },
  { id: 16, bookingNo: "BKG-20260810-001", customerId: "EMP-1042", service: "LUNCH",     status: "SRV", bookedAt: "2026-08-10" },
  { id: 17, bookingNo: "BKG-20260810-002", customerId: "EMP-0871", service: "LUNCH",     status: "CAN", bookedAt: "2026-08-10" },
  { id: 18, bookingNo: "BKG-20260810-003", customerId: "EMP-0334", service: "DINNER",    status: "NOS", bookedAt: "2026-08-10" },
]

export const WITHDRAWAL_STATUS = {
  REQ: { label: "Requested", bg: "rgba(202,138,4,0.10)",   text: "#b45309", border: "rgba(202,138,4,0.22)" },
  COM: { label: "Completed", bg: "rgba(22,163,74,0.10)",   text: "#16a34a", border: "rgba(22,163,74,0.25)" },
  REJ: { label: "Rejected",  bg: "rgba(220,38,38,0.09)",   text: "#dc2626", border: "rgba(220,38,38,0.2)"  },
  CAN: { label: "Cancelled", bg: "rgba(100,116,139,0.10)", text: "#64748b", border: "rgba(100,116,139,0.22)" },
}

export const PAYMENT_METHODS = [
  { code: "CASH", label: "Cash" },
  { code: "UPI",  label: "UPI" },
  { code: "NEFT", label: "NEFT / RTGS" },
  { code: "DD",   label: "Demand Draft" },
  { code: "CARD", label: "Debit / Credit Card" },
]

export const SEED_WITHDRAWALS = [
  { id: 1, customerId: "EMP-1042", customerName: "Rajesh Kumar",     amount: "500.00",  status: "REQ", requestedAt: "10 Aug 2026, 09:14", remarks: "" },
  { id: 2, customerId: "EMP-0871", customerName: "Priya Nair",       amount: "1200.00", status: "REQ", requestedAt: "10 Aug 2026, 09:47", remarks: "" },
  { id: 3, customerId: "CON-2203", customerName: "Suresh Babu",      amount: "300.00",  status: "COM", requestedAt: "09 Aug 2026, 14:22", remarks: "Processed at counter" },
  { id: 4, customerId: "EMP-0334", customerName: "Meena Krishnan",   amount: "750.00",  status: "REQ", requestedAt: "10 Aug 2026, 10:05", remarks: "" },
  { id: 5, customerId: "VIS-0018", customerName: "Anand Sharma",     amount: "200.00",  status: "REJ", requestedAt: "08 Aug 2026, 11:30", remarks: "Insufficient balance" },
  { id: 6, customerId: "EMP-1109", customerName: "Lakshmi Devi",     amount: "1000.00", status: "CAN", requestedAt: "07 Aug 2026, 16:55", remarks: "Cancelled by customer" },
  { id: 7, customerId: "CON-1887", customerName: "Venkatesh Reddy",  amount: "450.00",  status: "REQ", requestedAt: "10 Aug 2026, 10:38", remarks: "" },
]

export const ROLE_META = {
  canteen_manager:    { label: "Canteen Manager",    abbr: "MGR" },
  canteen_assistant:  { label: "Canteen Assistant",  abbr: "AST" },
  employee_permanent: { label: "Permanent Employee", abbr: "EMP" },
  employee_contract:  { label: "Contract Employee",  abbr: "CON" },
}

export const PREBOOK_MENUS = [
  { slot: "BREAKFAST", price: 35, items: [
    { code: "MNU010", name: "Upma Breakfast Combo" },
    { code: "MNU011", name: "Poha with Chutney" },
    { code: "MNU005", name: "Masala Dosa" },
  ]},
  { slot: "LUNCH", price: 55, items: [
    { code: "MNU001", name: "Vegetarian Thali (Full)" },
    { code: "MNU003", name: "Chicken Biryani" },
    { code: "MNU008", name: "Paneer Butter Masala" },
    { code: "MNU004", name: "Sambar Rice" },
    { code: "MNU002", name: "Egg Curry with Rice" },
  ]},
  { slot: "SNACKS", price: 25, items: [
    { code: "MNU005", name: "Masala Dosa" },
    { code: "MNU011", name: "Poha with Chutney" },
    { code: "MNU010", name: "Upma Breakfast Combo" },
  ]},
  { slot: "DINNER", price: 50, items: [
    { code: "MNU008", name: "Paneer Butter Masala" },
    { code: "MNU001", name: "Vegetarian Thali (Full)" },
    { code: "MNU002", name: "Egg Curry with Rice" },
    { code: "MNU004", name: "Sambar Rice" },
  ]},
]

export const ACTIVE_SLOTS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]

export const KITCHEN_PROD = {
  "2026-08-11_BREAKFAST": [
    { menuCode: "MNU010", itemName: "Upma Breakfast Combo",  service: "BREAKFAST", toPrepare: 48, served: 38, partial: 2, noShow: 3 },
    { menuCode: "MNU011", itemName: "Poha with Chutney",     service: "BREAKFAST", toPrepare: 32, served: 26, partial: 1, noShow: 2 },
  ],
  "2026-08-11_LUNCH": [
    { menuCode: "MNU001", itemName: "Vegetarian Thali (Full)", service: "LUNCH", toPrepare: 45, served: 10, partial: 3, noShow: 1 },
    { menuCode: "MNU003", itemName: "Chicken Biryani",         service: "LUNCH", toPrepare: 28, served: 8,  partial: 1, noShow: 0 },
    { menuCode: "MNU008", itemName: "Paneer Butter Masala",    service: "LUNCH", toPrepare: 19, served: 5,  partial: 0, noShow: 1 },
  ],
  "2026-08-11_SNACKS": [
    { menuCode: "MNU005", itemName: "Masala Dosa",   service: "SNACKS", toPrepare: 35, served: 0, partial: 0, noShow: 0 },
    { menuCode: "MNU004", itemName: "Sambar Rice",   service: "SNACKS", toPrepare: 22, served: 0, partial: 0, noShow: 0 },
  ],
  "2026-08-11_DINNER": [
    { menuCode: "MNU008", itemName: "Paneer Butter Masala",  service: "DINNER", toPrepare: 24, served: 0, partial: 0, noShow: 0 },
    { menuCode: "MNU002", itemName: "Egg Curry with Rice",   service: "DINNER", toPrepare: 18, served: 0, partial: 0, noShow: 0 },
  ],
}

export const AUDIT_BOOKINGS = [
  { id: 1,  bookingNo: "BKG-20260811-001", customerId: "EMP-1042", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11", itemName: "Upma Breakfast Combo",    menuCode: "MNU010" },
  { id: 2,  bookingNo: "BKG-20260811-002", customerId: "EMP-0871", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11", itemName: "Poha with Chutney",        menuCode: "MNU011" },
  { id: 3,  bookingNo: "BKG-20260811-003", customerId: "CON-2203", service: "BREAKFAST", status: "NOS", bookedAt: "2026-08-11", itemName: "Upma Breakfast Combo",    menuCode: "MNU010" },
  { id: 4,  bookingNo: "BKG-20260811-004", customerId: "EMP-0334", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11", itemName: "Vegetarian Thali (Full)", menuCode: "MNU001" },
  { id: 5,  bookingNo: "BKG-20260811-005", customerId: "VIS-0018", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11", itemName: "Chicken Biryani",         menuCode: "MNU003" },
  { id: 6,  bookingNo: "BKG-20260811-006", customerId: "EMP-1109", service: "LUNCH",     status: "CAN", bookedAt: "2026-08-11", itemName: "Vegetarian Thali (Full)", menuCode: "MNU001" },
  { id: 7,  bookingNo: "BKG-20260811-007", customerId: "CON-1887", service: "LUNCH",     status: "CR",  bookedAt: "2026-08-11", itemName: "Paneer Butter Masala",    menuCode: "MNU008" },
  { id: 8,  bookingNo: "BKG-20260811-008", customerId: "EMP-0553", service: "LUNCH",     status: "PRT", bookedAt: "2026-08-11", itemName: "Chicken Biryani",         menuCode: "MNU003" },
  { id: 9,  bookingNo: "BKG-20260811-009", customerId: "EMP-2214", service: "LUNCH",     status: "SRV", bookedAt: "2026-08-11", itemName: "Vegetarian Thali (Full)", menuCode: "MNU001" },
  { id: 10, bookingNo: "BKG-20260811-010", customerId: "EMP-0771", service: "SNACKS",    status: "CR",  bookedAt: "2026-08-11", itemName: "Masala Dosa",             menuCode: "MNU005" },
  { id: 11, bookingNo: "BKG-20260811-011", customerId: "CON-0490", service: "SNACKS",    status: "CR",  bookedAt: "2026-08-11", itemName: "Sambar Rice",             menuCode: "MNU004" },
  { id: 12, bookingNo: "BKG-20260811-012", customerId: "VIS-0031", service: "SNACKS",    status: "CAN", bookedAt: "2026-08-11", itemName: "Masala Dosa",             menuCode: "MNU005" },
  { id: 13, bookingNo: "BKG-20260811-013", customerId: "EMP-1302", service: "DINNER",    status: "CR",  bookedAt: "2026-08-11", itemName: "Paneer Butter Masala",    menuCode: "MNU008" },
  { id: 14, bookingNo: "BKG-20260811-014", customerId: "EMP-0882", service: "DINNER",    status: "CR",  bookedAt: "2026-08-11", itemName: "Egg Curry with Rice",     menuCode: "MNU002" },
  { id: 15, bookingNo: "BKG-20260811-015", customerId: "CON-3311", service: "BREAKFAST", status: "SRV", bookedAt: "2026-08-11", itemName: "Poha with Chutney",       menuCode: "MNU011" },
  { id: 16, bookingNo: "BKG-20260810-001", customerId: "EMP-1042", service: "LUNCH",     status: "SRV", bookedAt: "2026-08-10", itemName: "Vegetarian Thali (Full)", menuCode: "MNU001" },
  { id: 17, bookingNo: "BKG-20260810-002", customerId: "EMP-0871", service: "LUNCH",     status: "CAN", bookedAt: "2026-08-10", itemName: "Chicken Biryani",         menuCode: "MNU003" },
  { id: 18, bookingNo: "BKG-20260810-003", customerId: "EMP-0334", service: "DINNER",    status: "NOS", bookedAt: "2026-08-10", itemName: "Paneer Butter Masala",    menuCode: "MNU008" },
]
