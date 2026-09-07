import { useState, useCallback } from "react";
import { getPublishedMenus } from "../../daymenu/api/daymenuApi";

export function usePublishedMenu() {
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPublishedMenus = useCallback(async (canteenId, serviceDate) => {
    if (!canteenId || !serviceDate) {
      setMenuItems({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPublishedMenus({ canteenId, serviceDate });
      
      // Group by SERVICEID & SERVNAME
      const grouped = (data || []).reduce((acc, item) => {
        const key = `${item.SERVICEID}_${item.SERVNAME}`;
        if (!acc[key]) {
          acc[key] = {
            SERVICEID: item.SERVICEID,
            SERVNAME: item.SERVNAME,
            items: []
          };
        }
        acc[key].items.push(item);
        return acc;
      }, {});

      setMenuItems(grouped);
    } catch (err) {
      console.error("Failed to fetch published menus", err);
      setError(err?.response?.data?.MESSAGE || "Failed to load menus");
      setMenuItems({});
    } finally {
      setLoading(false);
    }
  }, []);

  return { menuItems, loading, error, fetchPublishedMenus };
}
