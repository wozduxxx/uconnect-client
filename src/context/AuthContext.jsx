import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, verifyCode as apiVerifyCode, getMyProfile, registerUser as apiRegisterUser } from '../api/users'
import { setAuthToken, getAuthToken } from '../api/axios'
import { toast } from '../components/Toast'

/** @type {React.Context<AuthContextValue>} */
const AuthContext = createContext(undefined)

/**
 * @typedef {Object} AuthUser
 * @property {number} userId
 * @property {string} userName
 * @property {string} userSurname
 * @property {string} userEmail
 * @property {string} userNumberPhone
 * @property {string} avatarUrl
 * @property {string} userDescription
 * @property {string} userBirthday
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user
 * @property {string|null} token
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {function} login
 * @property {function} verifyCode
 * @property {function} register
 * @property {function} logout
 * @property {function} refreshProfile
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => getAuthToken())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const savedToken = getAuthToken()
      if (!savedToken) {
        setIsLoading(false)
        return
      }
      try {
        const profile = await getMyProfile()
        setUser(profile)
      } catch {
        setAuthToken(null)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  async function login(email, password) {
    await loginUser({ UserEmail: email, UserPassword: password })
  }


  async function verifyCode(email, code) {
    const data = await apiVerifyCode({ Email: email, Code: code })

    setAuthToken(data.token)
    setToken(data.token)

    const profile = await getMyProfile()
    setUser(profile)
    localStorage.setItem('user', JSON.stringify(profile))
  }

  async function register(formData) {
    const result = await apiRegisterUser(formData)
    const tokenValue = result?.token || result?.Token

    if (tokenValue) {
      setAuthToken(tokenValue)
      setToken(tokenValue)

      try {
        const profile = await getMyProfile()
        setUser(profile)
        localStorage.setItem('user', JSON.stringify(profile))
      } catch (err) {
      }
    }
    return result
  }

  function logout() {
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  const refreshProfile = useCallback(async () => {
    const profile = await getMyProfile()
    setUser(profile)
    localStorage.setItem('user', JSON.stringify(profile))
    return profile
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    verifyCode,
    register,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Хук для использования AuthContext
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}