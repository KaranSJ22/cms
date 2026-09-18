import api from "../../../config/axios";

// ============================================================
// Services & Combos
// ============================================================

export async function getOfficialServices(canteenId, statusId = null) {
  const params = { canteenId };
  if (statusId) params.statusId = statusId;
  const res = await api.get("/official-requests/services", { params });
  return res.data.DATA;
}

export async function getOfficialServiceDetails(serviceId) {
  const res = await api.get(`/official-requests/services/${serviceId}`);
  return res.data.DATA;
}

export async function createOfficialService(data) {
  const res = await api.post("/official-requests/services", data);
  return res.data.DATA;
}

export async function updateOfficialService(serviceId, data) {
  const res = await api.put(`/official-requests/services/${serviceId}`, data);
  return res.data.DATA;
}

export async function createOfficialCombo(data) {
  const res = await api.post("/official-requests/combos", data);
  return res.data.DATA;
}

export async function updateOfficialCombo(comboId, data) {
  const res = await api.put(`/official-requests/combos/${comboId}`, data);
  return res.data.DATA;
}

export async function getOfficialMenuItems(canteenId = null) {
  const params = canteenId ? { canteenId } : {};
  const res = await api.get("/official-requests/services/menu-items", { params });
  return res.data.DATA;
}

// ============================================================
// Level Mappings & Approvers
// ============================================================

export async function getLevelMappings() {
  const res = await api.get("/official-requests/level-mappings");
  return res.data.DATA;
}

export async function saveLevelMapping(data) {
  const res = await api.post("/official-requests/level-mappings", data);
  return res.data.DATA;
}

export async function getEligibleApprovers(level) {
  const res = await api.get("/official-requests/approvers", { params: { level } });
  return res.data.DATA;
}

// ============================================================
// Bookings
// ============================================================

export async function submitOfficialBooking(data) {
  const res = await api.post("/official-requests/bookings", data);
  return res.data.DATA;
}

export async function getMyOfficialBookings() {
  const res = await api.get("/official-requests/bookings/my");
  return res.data.DATA;
}

export async function getOfficialBookingDetails(bookingId) {
  const res = await api.get(`/official-requests/bookings/${bookingId}`);
  return res.data.DATA;
}

export async function resubmitOfficialBooking(bookingId, data) {
  const res = await api.put(`/official-requests/bookings/${bookingId}/resubmit`, data);
  return res.data.DATA;
}

// ============================================================
// Approver Workflow
// ============================================================

export async function getAssignedApprovals() {
  const res = await api.get("/official-requests/approvals/assigned");
  return res.data.DATA;
}

export async function processApproverAction(bookingId, action, rejReason = null) {
  const res = await api.post(`/official-requests/approvals/${bookingId}/action`, {
    ACTION: action,
    REJREASON: rejReason,
  });
  return res.data.DATA;
}

// ============================================================
// Canteen Manager Workflow
// ============================================================

export async function getManagerPendingBookings(canteenId) {
  const res = await api.get("/official-requests/manager/pending", {
    params: { canteenId },
  });
  return res.data.DATA;
}

export async function processManagerAction(bookingId, action, rejReason = null) {
  const res = await api.post(`/official-requests/manager/${bookingId}/action`, {
    ACTION: action,
    REJREASON: rejReason,
  });
  return res.data.DATA;
}

// ============================================================
// Kitchen Preparation & Fulfillment Workflow
// ============================================================

export async function getConfirmedOfficialBookings(canteenId, { date, fromDate, toDate } = {}) {
  const params = { canteenId };
  if (date) params.date = date;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  const res = await api.get("/official-requests/kitchen-prep/confirmed", { params });
  return res.data.DATA;
}

export async function getOfficialKitchenPrepSummary(canteenId, date) {
  const res = await api.get("/official-requests/kitchen-prep/summary", {
    params: { canteenId, date },
  });
  return res.data.DATA;
}
