import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import Toast, { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { validateImageFile, readFileAsDataUrl, formatBirthday } from '../utils/fileUtils'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    phone: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirm: '',
    birthday: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const avatarRef = useRef()

  function set(k) {
    return e => setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const { valid, error } = validateImageFile(file, 5)
    if (!valid) {
      toast(error)
      return
    }
    setAvatarFile(file)
    const preview = await readFileAsDataUrl(file)
    setAvatarPreview(preview)
  }

  function validate() {
    if (!form.phone.trim()) { toast('Введите номер телефона'); return false }
    if (!form.email.trim() || !form.email.includes('@')) { toast('Введите корректный email'); return false }
    if (!form.firstName.trim()) { toast('Введите имя'); return false }
    if (!form.birthday) { toast('Укажите дату рождения'); return false }
    if (!form.password) { toast('Введите пароль'); return false }
    if (form.password.length < 6) { toast('Пароль должен быть не менее 6 символов'); return false }
    if (form.password !== form.confirm) { toast('Пароли не совпадают!'); return false }
    return true
  }

  async function handleRegister() {
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('UserEmail', form.email.trim())
      fd.append('UserPassword', form.password)
      fd.append('UserNumberPhone', form.phone.trim())
      fd.append('UserName', form.firstName.trim())
      fd.append('UserSurname', form.lastName.trim())
      fd.append('Birthday', form.birthday)
      if (avatarFile) fd.append('Avatar', avatarFile)

      await register(fd)
      toast('Регистрация прошла успешно!')

      navigate('/interests', { replace: true })
    } catch (err) {
      const msg = err.response?.data || 'Ошибка регистрации'
      toast(typeof msg === 'string' ? msg : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
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
              background: 'radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.08) 0%, transparent 60%)',
            }}
        >
          <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass"
              style={{ width: '100%', maxWidth: 420, padding: 36, borderRadius: 24 }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
              Регистрация
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              Создайте аккаунт, чтобы начать
            </div>

            {/* 🔹 ОБЕРНУЛИ ВСЕ ПОЛЯ В <form> */}
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                  <div
                      onClick={() => avatarRef.current.click()}
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: avatarPreview ? 'transparent' : 'rgba(59,130,246,0.1)',
                        border: '2px dashed rgba(59,130,246,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.7)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'}
                  >
                    {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Camera size={24} style={{ color: '#3B82F6', opacity: 0.7 }} />
                    }
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, marginTop: -14 }}>
                Фото профиля (JPG, PNG — до 5 MB)
              </div>

              <Input label="Номер телефона" type="tel" placeholder="+7 (999) 000-00-00" value={form.phone} onChange={set('phone')} />
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>
                  Дата рождения
                </label>
                <input className="field" type="date" value={form.birthday} onChange={set('birthday')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>
                    Имя
                  </label>
                  <input className="field" type="text" placeholder="Имя" value={form.firstName} onChange={set('firstName')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>
                    Фамилия
                  </label>
                  <input className="field" type="text" placeholder="Фамилия" value={form.lastName} onChange={set('lastName')} />
                </div>
              </div>

              <Input label="Пароль" type="password" placeholder="Придумайте пароль (мин. 6 символов)" value={form.password} onChange={set('password')} autoComplete="new-password" />
              <Input label="Повторите пароль" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />

              <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  style={{ marginTop: 4, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading && (
                    <span style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                )}
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form> {/* 🔹 Закрыли форму */}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
              Уже есть аккаунт?{' '}
              <span onClick={() => navigate('/login')} style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 700 }}>
            Войти
          </span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            На главную страницу
          </span>
            </div>
          </motion.div>
        </div>
      </div>
  )
}
