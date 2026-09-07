import { useState, useCallback } from "react";
import * as dayMenuApi from "../api/daymenuApi";

export function useDayMenu() {
  const [dayMenus, setDayMenus] = useState([]);
  const [pendingMenus, setPendingMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDayMenuWorkspace = useCallback(async (daySlotId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dayMenuApi.getDayMenuWorkspace(daySlotId);
      setDayMenus(data || []);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch day menu workspace");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceMenuItems = async (daySlotId, itemsJson) => {
    try {
      await dayMenuApi.replaceDayMenuItems(daySlotId, itemsJson);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save draft");
      return false;
    }
  };

  const submitMenu = async (daySlotId) => {
    try {
      await dayMenuApi.submitDayMenu(daySlotId);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit menu");
      return false;
    }
  };

  const approveMenu = async (daySlotId, remarks = "") => {
    try {
      await dayMenuApi.approveDayMenu(daySlotId, remarks);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to approve menu");
      return false;
    }
  };

  const rejectMenu = async (daySlotId, remarks = "") => {
    try {
      await dayMenuApi.rejectDayMenu(daySlotId, remarks);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reject menu");
      return false;
    }
  };

  const fetchPendingDayMenus = useCallback(async (canteenId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dayMenuApi.getPendingDayMenus(canteenId);
      setPendingMenus(data || []);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch pending menus");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dayMenus,
    pendingMenus,
    loading,
    error,
    setError,
    fetchDayMenuWorkspace,
    replaceMenuItems,
    submitMenu,
    approveMenu,
    rejectMenu,
    fetchPendingDayMenus,
  };
}
