import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Tag from '../components/Tag'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

const floaters = [
    { bg: '#1E3A8A', top: '10%', right: '10%', delay: 2, size: 54 },
    { bg: '#6D28D9', bottom: '20%', right: '2%', delay: 0.6, size: 46 },
    { bg: '#10B981', bottom: '10%', left: '6%', delay: 0, size: 50 },
    { bg: '#F59E0B', top: '28%', left: '2%', delay: 1.2, size: 42 },
]

export default function Landing() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

            {/* Navbar скрываем на мобиле */}
            <Navbar showLinks={isAuthenticated} />

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '24px 16px 60px' : '20px 24px 100px',
                    gap: isMobile ? 32 : 64,
                    flexDirection: isMobile ? 'column' : 'row',
                }}
            >
                {/* Left */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ maxWidth: 520, textAlign: isMobile ? 'center' : 'left' }}
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            fontSize: 'clamp(39px,6vw,68px)',
                            fontWeight: 900,
                            lineHeight: 1.05,
                            marginBottom: 20,
                            paddingTop: 30,
                        }}
                    >
                        Коннект{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg,#60A5FA 0%,#A78BFA 50%,#F472B6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
              в одно
            </span>
                        <br />касание
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            fontSize: 'clamp(14px,2vw,16px)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            marginBottom: 28,
                        }}
                    >
                        Найди людей с похожими интересами, навыками и целями.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        style={{
                            display: 'flex',
                            gap: 12,
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            flexWrap: 'wrap',
                            size: 'clamp(34px,6vw,68px)',
                        }}
                    >
                        <Button variant="green" onClick={() => navigate('/register')}
                                style={{ padding: '14px 28px', flex: 4, minWidth: 213, maxWidth: 230}}>
                            Зарегистрироваться
                        </Button>
                        <Button onClick={() => navigate('/login')}
                                style={{ padding: '14px 24px', flex: 4, minWidth: 93, maxWidth: 100}}>
                            Войти
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Right */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        position: 'relative',
                        minHeight: 380,
                        width: isMobile ? '100%' : 280,
                        maxWidth: 320,
                    }}
                >
                    {/* Карточка */}
                    <motion.div
                        onClick={() => navigate('/register')}
                        whileHover={{ scale: 1.03 }}
                        className="glass"
                        style={{ padding: 26, borderRadius: 24, textAlign: 'center', position: 'relative', zIndex: 2, marginTop: 25, cursor: 'pointer' }}
                    >
                        {/* бейдж */}
                        <div
                            style={{
                                position: 'absolute',
                                top: -12,
                                right: -12,
                                fontSize: 11,
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: '#A78BFA',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            Пример
                        </div>

                        <div
                            style={{
                                width: 88,
                                height: 88,
                                borderRadius: '50%',
                                background: '#e5f1ff',
                                margin: '0 auto 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 34,
                            }}
                        >
                            ^-^
                        </div>

                        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
                            Алиса Ветрова
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                            Ищу тех, кто на одной волне. Пиши, если любишь обсуждать кино...
                        </div>

                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Tag label="Дизайн" variant="tag-purple" />
                            <Tag label="Кинофильмы" variant="tag-pink" />
                            <Tag label="Спорт" variant="tag-teal" />
                        </div>

                        {/* подпись-фишка */}
                        <div style={{ fontSize: 11, marginTop: 17, opacity: 0.6 }}>
                            Тут ещё много интересных личностей ✨
                        </div>
                    </motion.div>

                    {/* Фоновые элементы */}
                    {floaters.map((f, i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 3, delay: f.delay, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                width: f.size,
                                height: f.size,
                                borderRadius: '50%',
                                background: f.bg,
                                opacity: 0.9,
                                top: f.top,
                                bottom: f.bottom,
                                left: f.left,
                                right: f.right,
                                zIndex: 1,
                                filter: 'blur(2px)'
                            }}
                        />
                    ))}
                </motion.div>
            </div>

        </div>
    )
}
