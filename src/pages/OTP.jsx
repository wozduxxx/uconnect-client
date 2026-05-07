import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function OTP() {
  const navigate = useNavigate()
  const inputs = useRef([])

  function handleInput(e, idx) {
    if (e.target.value && idx < 3) {
      inputs.current[idx + 1]?.focus()
    }
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace' && !e.target.value && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 60%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass"
          style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 24, textAlign: 'center' }}
        >
          <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
            Введите код подтверждения
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
            Мы отправили 4-значный код на ваш номер
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
            {[0, 1, 2, 3].map(i => (
              <input
                key={i}
                ref={el => (inputs.current[i] = el)}
                className="otp-input"
                maxLength={1}
                inputMode="numeric"
                onInput={e => handleInput(e, i)}
                onKeyDown={e => handleKeyDown(e, i)}
              />
            ))}
          </div>

          <Button fullWidth onClick={() => navigate('/interests')} style={{ padding: 14 }}>
            Продолжить
          </Button>

          <div style={{ marginTop: 14 }}>
            <span
              onClick={() => navigate('/register')}
              style={{ color: '#60A5FA', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Вернуться назад
            </span>
          </div>

          <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
            Не получили код?{' '}
            <span style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}>Отправить повторно</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
