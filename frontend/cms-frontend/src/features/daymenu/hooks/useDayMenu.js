import { useState, useCallback } from "react";
import * as dayMenuApi from "../api/dayMenuApi";

export function useDayMenu() {
  const [dayMenus, setDayMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDayMenus = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dayMenuApi.getDayMenus(params);
      setDayMenus(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch day menus"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addDayMenu = async (menuData) => {
    try {
      await dayMenuApi.createDayMenu(menuData);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add day menu"
      );
      return false;
    }
  };

  const approveMenu = async (id, reason = "") => {
    try {
      await dayMenuApi.approveDayMenu(id, { CHGREASON: reason });
      await fetchDayMenus();
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to approve menu"
      );
      return false;
    }
  };

  const rejectMenu = async (id, reason = "") => {
    try {
      await dayMenuApi.rejectDayMenu(id, { CHGREASON: reason });
      await fetchDayMenus();
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to reject menu"
      );
      return false;
    }
  };

  return {
    dayMenus,
    loading,
    error,
    fetchDayMenus,
    addDayMenu,
    approveMenu,
    rejectMenu,
  };
}
