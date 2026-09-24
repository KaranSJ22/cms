import { useState, useCallback, useEffect } from "react";
import * as daySlotsApi from "../api/daySlotsApi";

export function useDaySlots(initialParams = { page: 1, pageSize: 20 }) {
  const [daySlots, setDaySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalRows: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
  });
  const [params, setParams] = useState(initialParams);

  const fetchDaySlots = useCallback(async (customParams = null) => {
    setLoading(true);
    setError(null);
    try {
      const activeParams = customParams !== null ? customParams : params;
      const data = await daySlotsApi.getDaySlots(activeParams);
      setDaySlots(data || []);
      if (data?.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({
          totalRows: (data || []).length,
          totalPages: 1,
          currentPage: activeParams.page || 1,
          pageSize: activeParams.pageSize || 20,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch day slots");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDaySlots();
  }, [fetchDaySlots]);

  const setPage = (newPage) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const setPageSize = (newPageSize) => {
    setParams((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const updateFilters = (newFilters) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

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

  return {
    daySlots,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    updateFilters,
    addDaySlot,
    editDaySlot,
    refresh: fetchDaySlots,
  };
}
