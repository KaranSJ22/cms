import { useState, useCallback, useEffect } from 'react';

export function useIdentity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeRequest = useCallback(async (requestFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestFn(...args);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'An error occurred';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, []);

  return { loading, error, setError, executeRequest };
}

export function useFetchData(fetchFn) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data || result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const result = await fetchFn();
        if (!ignore) setData(result.data || result);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || 'Error fetching data');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => { ignore = true; };
  }, [fetchFn]);

  return { data, loading, error, refetch: fetchData };
}
