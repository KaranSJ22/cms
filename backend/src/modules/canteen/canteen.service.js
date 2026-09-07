import { getCanteens as getCanteensRepository } from "./canteen.repository.js";

export const getCanteens = async (filters = {}) => {
  return await getCanteensRepository(filters);
};
