import { useState, useCallback, useEffect } from "react";
import * as servicesApi from "../api/servicesApi";

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicesApi.getServices();
      setServices(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }, []);

  const addService = async (serviceData) => {
    try {
      await servicesApi.createService(serviceData);
      await fetchServices();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add service");
      return false;
    }
  };

  const editService = async (id, serviceData) => {
    try {
      await servicesApi.updateService(id, serviceData);
      await fetchServices();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update service");
      return false;
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await servicesApi.getServices();
        if (!ignore) setServices(data || []);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || "Failed to fetch services");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  return {
    services,
    loading,
    error,
    addService,
    editService,
    refresh: fetchServices,
  };
}
