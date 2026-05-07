import axios from 'axios'

// Базовый URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// токен
let _token = localStorage.getItem('token') || null

/**
 * Устанавливает токен сразу в память И в localStorage.
 * Вызывать ДО любого последующего API-запроса.
 * @param {string|null} token
 */
export function setAuthToken(token) {
    _token = token
    if (token) {
        localStorage.setItem('token', token)
    } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
}

/**
 * Возвращает текущий in-memory токен.
 * @returns {string|null}
 */
export function getAuthToken() {
    return _token
}

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
})

// ── Interceptor запросов: добавляем JWT-токен из памяти ───────────────────
api.interceptors.request.use(
    config => {
        if (_token) {
            config.headers['Authorization'] = `Bearer ${_token}`
        }
        return config
    },
    error => Promise.reject(error)
)

// ── Interceptor ответов: перехват 401 ─────────────────────────────────────
api.interceptors.response.use(
    response => response,
    error => {
        const is401 = error.response?.status === 401
        const isAuthRequest =
            error.config?._isAuthRequest === true ||
            error.config?.url?.includes('loginUser') ||
            error.config?.url?.includes('IdentityVerification') ||
            error.config?.url?.includes('registerUser')

        if (is401 && !isAuthRequest) {
            // Настоящая протухшая сессия — чистим и редиректим
            setAuthToken(null)
            import('../components/Toast').then(({ toast }) => {
                toast('Сессия истекла. Пожалуйста, войдите снова.')
            })
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export default api