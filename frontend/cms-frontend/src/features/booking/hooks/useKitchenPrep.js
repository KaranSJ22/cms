import { useState, useCallback } from "react";
import { getKitchenPrep } from "../api/bookingApi";

export function useKitchenPrep() {
  const [prepData, setPrepData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrepData = useCallback(async (daySlotId) => {
    if (!daySlotId) {
      setPrepData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await getKitchenPrep(daySlotId);
      setPrepData(data || []);
    } catch (err) {
      console.error("Failed to fetch kitchen prep data", err);
      setError(err?.response?.data?.MESSAGE || "Failed to load preparation data");
      setPrepData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prepData,
    loading,
    error,
    fetchPrepData,
  };
}
