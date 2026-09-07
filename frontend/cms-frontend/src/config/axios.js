import axios from 'axios'
import { config } from './app.config'

const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT and unique Correlation ID on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem(config.TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`

  // Ensure unique Correlation ID on outgoing request for distributed tracing
  if (!cfg.headers['X-Correlation-ID']) {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    cfg.headers['X-Correlation-ID'] = `req-${timestamp}-${random}`
  }

  return cfg
})

// Response handler: capture Correlation ID and handle 401s
api.interceptors.response.use(
  res => res,
  err => {
    // Extract correlation ID from error response for operator reference
    const correlationId =
      err.response?.data?.CORRELATION_ID ||
      err.response?.headers?.['x-correlation-id'] ||
      err.config?.headers?.['X-Correlation-ID'] ||
      null

    if (correlationId) {
      err.correlationId = correlationId
    }

    if (err.response?.status === 401) {
      localStorage.removeItem(config.TOKEN_KEY)
      localStorage.removeItem(config.USER_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
