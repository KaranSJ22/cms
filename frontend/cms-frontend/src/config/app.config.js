const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const config = {
  API_BASE_URL,
  APP_NAME: 'Canteen Mitra',
  APP_SUBTITLE: 'Canteen Mitra',
  TOKEN_KEY: 'cms_token',
  USER_KEY: 'cms_user',
}
