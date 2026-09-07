import { useState, useCallback } from 'react'

/**
 * Generic hook for API calls with loading/error/data state.
 * Usage:
 *   const { data, loading, error, execute } = useApi(myApiFn)
 *   await execute(arg1, arg2)
 */
export function useApi(apiFn) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || 'Something went wrong'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { data, loading, error, execute, setData }
}
