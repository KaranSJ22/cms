import api from '../../config/axios'

/** POST /api/auth/login */
export async function loginApi(loginId, password) {
  const res = await api.post('/auth/login', { LOGINID: loginId, PASSWORD: password })
  return res.data.DATA
}

/** POST /api/auth/sso */
export async function ssoLoginApi(ssoToken) {
  const res = await api.post('/auth/sso', { token: ssoToken })
  return res.data.DATA
}
