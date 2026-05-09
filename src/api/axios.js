import axios from 'axios'

// Базовый URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://api.уконнект.рф/api')

// токен
let _token = localStorage.getItem('token') || null

export function setAuthToken(token) {
    _token = token
    if (token) {
        localStorage.setItem('token', token)
    } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
}

export function getAuthToken() {
    return _token
}

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
})


api.interceptors.request.use(
    config => {
        if (_token) {
            config.headers['Authorization'] = `Bearer ${_token}`
        }
        return config
    },
    error => Promise.reject(error)
)


api.interceptors.response.use(
    response => response,
    error => {
        const is401 = error.response?.status === 401
        const isPublicRequest = error.config?._isPublicRequest === true
        const isAuthRequest =
            error.config?._isAuthRequest === true ||
            error.config?.url?.includes('loginUser') ||
            error.config?.url?.includes('IdentityVerification') ||
            error.config?.url?.includes('registerUser') ||
            error.config?.url?.includes('getWallPosts')

        if (is401 && !isAuthRequest && !isPublicRequest) {
            setAuthToken(null)
            window.dispatchEvent(new CustomEvent('auth:expired'))
        }

        return Promise.reject(error)
    }
)

export default api