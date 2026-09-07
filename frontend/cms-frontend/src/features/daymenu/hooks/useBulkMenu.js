import { useState } from 'react'
import { bulkCreateDayMenus } from '../api/bulkMenuApi'

/**
 * Hook for the 5-day (Monday - Friday) bulk menu creation workflow.
 * Manages loading, error, and result state.
 */
export function useBulkMenu() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const submitBulkMenu = async (payload) => {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const data = await bulkCreateDayMenus(payload)
      setResults(data)
      return data
    } catch (err) {
      const msg =
        err.response?.data?.MESSAGE ||
        err.response?.data?.message ||
        err.message ||
        'Bulk menu creation failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setResults(null)
  }

  return { loading, error, results, submitBulkMenu, reset }
}
