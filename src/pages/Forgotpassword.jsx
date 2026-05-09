import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import Toast, { toast } from '../components/Toast'
import { recoverPassword, resetPassword } from '../api/users'

export default function ForgotPassword() {
    const navigate = useNavigate()

    const [step, setStep] = useState(1)
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleRecover() {
        if (!email.trim()) {
            toast('Введите email')
            return
        }
        setLoading(true)
        try {
            await recoverPassword({ UserEmail: email.trim() })
            toast(`Код отправлен на ${email}`)
            setStep(2)
        } catch (err) {
            const msg = err.response?.data || 'Ошибка отправки кода'
            toast(typeof msg === 'string' ? msg : 'Ошибка отправки кода')
        } finally {
            setLoading(false)
        }
    }

    async function handleReset() {
        if (!code.trim()) {
            toast('Введите код подтверждения')
            return
        }
        if (!newPassword || newPassword.length < 6) {
            toast('Пароль должен быть больше 6 символов')
            return
        }
        if (newPassword !== confirmPassword) {
            toast('Пароли не совпадают')
            return
        }
        setLoading(true)
        try {
            await resetPassword({ UserEmail: email.trim(), Code: code.trim(), NewPassword: newPassword })
            toast('Пароль успешно изменён!')
            navigate('/login', { replace: true })
        } catch (err) {
            const msg = err.response?.data || 'Ошибка сброса пароля'
            toast(typeof msg === 'string' ? msg : 'Ошибка сброса пароля')
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
                                Восстановление пароля
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                                Введите почту и мы отправим код для сброса пароля
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleRecover() }}>
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleRecover()}
                                />

                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                                <Button
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
                                    style={{ marginTop: 8, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    {loading && <span style={spinnerStyle} />}
                                    {loading ? 'Отправка...' : 'Отправить код'}
                                </Button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: 14 }}>
                <span onClick={() => navigate('/login')} style={{ color: '#60A5FA', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Вернуться ко входу
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
                            style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 24 }}
                        >
                            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', textAlign: 'center' }}>
                                Новый пароль
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
                                Код отправлен на{' '}
                                <span style={{ color: '#60A5FA', fontWeight: 600 }}>{email}</span>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                                    Код подтверждения
                                </div>
                                <input
                                    className="field"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="_ _ _ _"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 8, width: '100%' }}
                                />
                            </div>

                            <Input
                                label="Новый пароль"
                                type="password"
                                placeholder="Минимум 6 символов"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <Input
                                label="Повторите пароль"
                                type="password"
                                placeholder="Повторите новый пароль"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleReset()}
                                autoComplete="new-password"
                            />

                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                            <Button
                                fullWidth
                                onClick={handleReset}
                                disabled={loading}
                                style={{ marginTop: 8, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                {loading && <span style={spinnerStyle} />}
                                {loading ? 'Сохранение...' : 'Сохранить пароль'}
                            </Button>

                            <div style={{ marginTop: 14, textAlign: 'center' }}>
                <span
                    onClick={() => { setStep(1); setCode('') }}
                    style={{ color: '#60A5FA', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Вернуться назад
                </span>
                            </div>

                            <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                                Не получили код?{' '}
                                <span
                                    onClick={async () => {
                                        try {
                                            await recoverPassword({ UserEmail: email })
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