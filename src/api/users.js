import api from './axios'

export async function registerUser(formData) {
  const res = await api.post('/users/registerUser', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    _isAuthRequest: true,
  })
  return res.data
}

export async function loginUser(dto) {
  const res = await api.post('/users/loginUser', dto, { _isAuthRequest: true })
  return res.data
}

export async function verifyCode(dto) {
  const res = await api.post('/users/IdentityVerification', dto, { _isAuthRequest: true })
  const data = res.data
  const token = data.token ?? data.Token ?? null
  const message = data.message ?? data.Message ?? ''
  if (!token) {
    console.error('[verifyCode] Токен не найден в ответе. Получено:', JSON.stringify(data))
    throw new Error('Сервер не вернул токен. Проверьте ответ IdentityVerification.')
  }
  return { token, message }
}

export async function getMyProfile() {
  const res = await api.get('/users/GetMyProfile')
  return res.data
}


export async function updateProfile(formData) {
  const res = await api.put('/users/UpdateProfile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}


export async function getUserById(id) {
  const res = await api.get(`/users/GetUser/${id}`)
  return res.data
}


export async function logout() {
  const res = await api.post('/users/logout')
  return res.data
}

export async function recoverPassword(dto) {
  const res = await api.post('/users/RecoverPasswordUser', dto, { _isAuthRequest: true })
  return res.data
}

export async function resetPassword(dto) {
  const res = await api.put('/users/ResetPasswordUser', dto, { _isAuthRequest: true })
  return res.data
}