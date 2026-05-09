import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import Toast, { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, verifyCode } = useAuth()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      toast('Заполните все поля!')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast(`Код отправлен на ${email}`)
      setStep(2)
    } catch (err) {
      const msg = err.response?.data || 'Ошибка входа'
      toast(typeof msg === 'string' ? msg : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      toast('Введите код подтверждения')
      return
    }
    setLoading(true)
    try {
      await verifyCode(email.trim(), code.trim())
      toast('Добро пожаловать!')
      navigate('/search', { replace: true })
    } catch (err) {
      const msg = err.response?.data || 'Неверный код'
      toast(typeof msg === 'string' ? msg : 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const spinnerStyle = {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  }

  return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Toast />
        <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background: 'radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.07) 0%, transparent 60%)',
            }}
        >
          <AnimatePresence mode="wait">
            {step === 1 ? (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4 }}
                    className="glass"
                    style={{ width: '100%', maxWidth: 400, padding: 36, borderRadius: 24 }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
                    С возвращением!
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                    Войдите в свой аккаунт
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <Input
                        label="Пароль"
                        type="password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        autoComplete="current-password"
                    />

                    <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 16 }}>
                  <span
                      onClick={() => navigate('/forgot-password')}
                      style={{ color: '#60A5FA', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    Забыли пароль?
                  </span>
                    </div>

                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                    <Button
                        type="submit"
                        fullWidth
                        disabled={loading}
                        style={{ marginTop: 8, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {loading && <span style={spinnerStyle} />}
                      {loading ? 'Проверка...' : 'Войти'}
                    </Button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Нет аккаунта?{' '}
                    <span onClick={() => navigate('/register')} style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 700 }}>
                  Зарегистрироваться
                </span>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span onClick={() => navigate('/')} style={{ color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  На главную страницу
                </span>
                  </div>
                </motion.div>
            ) : (
                <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4 }}
                    className="glass"
                    style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 24, textAlign: 'center' }}
                >
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
                    Введите код подтверждения
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                    Мы отправили код на{' '}
                    <span style={{ color: '#60A5FA', fontWeight: 600 }}>{email}</span>
                  </div>

                  <input
                      className="field"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="_ _ _ _"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 8, marginBottom: 24 }}
                      onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  />

                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                  <Button
                      fullWidth
                      onClick={handleVerify}
                      disabled={loading}
                      style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {loading && <span style={spinnerStyle} />}
                    {loading ? 'Проверка...' : 'Продолжить'}
                  </Button>

                  <div style={{ marginTop: 14 }}>
                <span
                    onClick={() => { setStep(1); setCode('') }}
                    style={{ color: '#60A5FA', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  ← Вернуться назад
                </span>
                  </div>

                  <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                    Не получили код?{' '}
                    <span
                        onClick={async () => {
                          try {
                            await login(email, password)
                            toast('Код отправлен повторно')
                          } catch {
                            toast('Не удалось отправить код')
                          }
                        }}
                        style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                    >
                  Отправить повторно
                </span>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
  )
}