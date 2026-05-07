import api from './axios'

/**
 * Регистрация пользователя
 * @param {FormData} formData - поля: UserName, UserSurname, UserEmail, UserNumberPhone, UserPassword, Birthday (Date), Avatar (File)
 * @returns {Promise<{ Token: string, Message: string }>}
 */
export async function registerUser(formData) {
  const res = await api.post('/users/registerUser', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    _isAuthRequest: true,
  })
  return res.data
}

/**
 * Шаг 1 логина — отправка email/password, инициирует отправку кода на почту
 * @param {{ UserEmail: string, UserPassword: string }} dto
 * @returns {Promise<string>} Сообщение от сервера
 */
export async function loginUser(dto) {
  const res = await api.post('/users/loginUser', dto, { _isAuthRequest: true })
  return res.data
}

/**
 * Шаг 2 логина — верификация OTP-кода
 * ВАЖНО: ASP.NET Core сериализует в camelCase, но мы нормализуем ответ
 * @param {{ Email: string, Code: string }} dto
 * @returns {Promise<{ token: string, message: string }>}
 */
export async function verifyCode(dto) {
  const res = await api.post('/users/IdentityVerification', dto, { _isAuthRequest: true })
  const data = res.data
  // Нормализация: camelCase (token) или PascalCase (Token)
  const token = data.token ?? data.Token ?? null
  const message = data.message ?? data.Message ?? ''
  if (!token) {
    console.error('[verifyCode] Токен не найден в ответе. Получено:', JSON.stringify(data))
    throw new Error('Сервер не вернул токен. Проверьте ответ IdentityVerification.')
  }
  return { token, message }
}

/**
 * Получение профиля текущего пользователя (требует JWT)
 * @returns {Promise<{ UserId: number, UserName: string, UserSurname: string, UserBirthday: string, AvatarUrl: string|null, UserEmail: string, UserNumberPhone: string, UserDescription: string|null, UserBaner: string|null, FriendsCount: number }>}
 */
export async function getMyProfile() {
  const res = await api.get('/users/GetMyProfile')
  return res.data
}

/**
 * Обновление профиля (требует JWT)
 * @param {FormData} formData - поля: UserName, UserSurname, UserEmail, UserNumberPhone, UserPassword, UserAvatar (File), UserDescription, UserBaner (File)
 * @returns {Promise<string>} Сообщение от сервера
 */
export async function updateProfile(formData) {
  const res = await api.put('/users/UpdateProfile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * Получение публичного профиля по ID
 * @param {number} id
 * @returns {Promise<{ UserId: number, UserName: string, UserSurname: string, UserBirthday: string, AvatarUrl: string|null, UserDescription: string|null, UserBaner: string|null, FriendsCount: number }>}
 */
export async function getUserById(id) {
  const res = await api.get(`/users/GetUser/${id}`)
  return res.data
}

/**
 * Выход из аккаунта (для JWT — просто уведомление сервера)
 * @returns {Promise<string>} Сообщение от сервера
 */
export async function logout() {
  const res = await api.post('/users/logout')
  return res.data
}