import { useState, useCallback, useEffect } from 'react';
import * as menuApi from '../api/menuApi';

export function useMenu() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenus = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await menuApi.getMenuItems(params);
      setMenus(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMenu = async (menuData) => {
    try {
      const result = await menuApi.createMenuItem(menuData);
      await fetchMenus(); // refresh list
      return { success: true, data: result };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Failed to create menu item.' 
      };
    }
  };

  const editMenu = async (id, menuData) => {
    try {
      const result = await menuApi.updateMenuItem(id, menuData);
      await fetchMenus(); // refresh list
      return { success: true, data: result };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Failed to update menu item.' 
      };
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  return {
    menus,
    loading,
    error,
    refetch: fetchMenus,
    addMenu,
    editMenu
  };
}
