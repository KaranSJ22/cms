import axios from "../../../config/axios";

const BASE_PATH = "/reports";

export const reportApi = {
  getKitchenSummary: (daySlotId) => axios.get(`${BASE_PATH}/kitchen-summary`, { params: { daySlotId } }),
};
