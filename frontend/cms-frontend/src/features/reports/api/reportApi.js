import axios from "../../../config/axios";

const BASE_PATH = "/reports";

export const reportApi = {
  getKitchenSummary: (daySlotId) =>
    axios.get(`${BASE_PATH}/kitchen-summary`, { params: { daySlotId } }),
  getMonthlyPayroll: (params) =>
    axios.get(`${BASE_PATH}/monthly-payroll`, { params }),
  getEmployeePayrollBreakdown: (customerId, params) =>
    axios.get(`${BASE_PATH}/monthly-payroll/${customerId}`, { params }),
};
