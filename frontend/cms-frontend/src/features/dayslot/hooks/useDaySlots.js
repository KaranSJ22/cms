import { useState, useCallback, useEffect } from "react";
import * as daySlotsApi from "../api/daySlotsApi";

export function useDaySlots() {
  const [daySlots, setDaySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDaySlots = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await daySlotsApi.getDaySlots(params);
      setDaySlots(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch day slots");
    } finally {
      setLoading(false);
    }
  }, []);

  const addDaySlot = async (slotData) => {
    try {
      await daySlotsApi.createDaySlot(slotData);
      await fetchDaySlots();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add day slot");
      return false;
    }
  };

  const editDaySlot = async (id, slotData) => {
    try {
      await daySlotsApi.updateDaySlot(id, slotData);
      await fetchDaySlots();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update day slot");
      return false;
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await daySlotsApi.getDaySlots({});
        if (!ignore) setDaySlots(data || []);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || "Failed to fetch day slots");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  return {
    daySlots,
    loading,
    error,
    addDaySlot,
    editDaySlot,
    refresh: fetchDaySlots,
  };
}
