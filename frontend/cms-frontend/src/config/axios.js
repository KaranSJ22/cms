import axios from 'axios'
import { config } from './app.config'

const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem(config.TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// On 401 — clear token and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(config.TOKEN_KEY)
      localStorage.removeItem(config.USER_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
