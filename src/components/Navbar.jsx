import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ showLinks = false, unreadMessages = 0 }) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { user, logout } = useAuth()

    const [menuOpen, setMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Отслеживание ширины экрана
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 767)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
        setMenuOpen(false)
    }

    const closeMenu = () => setMenuOpen(false)
    const openMenu = () => setMenuOpen(true)

    const initials = user
        ? [user.userName?.[0], user.userSurname?.[0]].filter(Boolean).join('').toUpperCase()
        : '?'

    const navItems = [
        { label: 'Поиск', path: '/search' },
        { label: 'Мои коннекты', path: '/requests' },
        { label: 'Чаты', path: '/chat', hasBadge: unreadMessages > 0 },
        { label: 'Профиль', path: '/profile'},
    ]

    // Общие стили кнопок навигации
    const getLinkStyle = (isActive) => ({
        color: isActive ? '#4199ff' : 'var(--text-secondary)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
        padding: '8px 12px',
        borderRadius: '9999px', fontSize: '14px', fontWeight: 600,
        transition: 'all 0.2s ease',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        position: 'relative',
    })

    // Рендер списка ссылок (используется и в десктопе, и в мобильном меню)
    const renderLinks = (mobile = false) => (
        <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: mobile ? 6 : 2, alignItems: mobile ? 'stretch' : 'center', width: '100%' }}>
            {navItems.map(item => {
                const isActive = pathname === item.path
                return (
                    <button
                        key={item.path}
                        onClick={() => { navigate(item.path); mobile && closeMenu() }}
                        className="transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                            ...getLinkStyle(isActive, item.isProfile),
                            ...(mobile && { padding: '14px 16px', width: '100%', justifyContent: 'space-between', borderRadius: '12px' })
                        }}
                    >
                        <span>{item.label}</span>
                        {item.hasBadge && (
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#3B82F6',
                                ...(mobile ? {} : { position: 'absolute', top: 2, right: 2, border: '2px solid var(--bg-mid)' })
                            }} />
                        )}
                    </button>
                )
            })}
            <button
                onClick={() => { handleLogout(); mobile && closeMenu() }}
                style={{
                    ...getLinkStyle(false, false),
                    color: '#ff6363',
                    paddingLeft: 16 ,
                    ...(mobile && { marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14, borderRadius: '12px' })
                }}
            >
                Выйти
            </button>
        </div>
    )

    return (
        <>
            <nav
                className="sticky top-0 z-50 flex items-center justify-between py-3"
                style={{
                    background: 'linear-gradient(135deg,rgba(110, 110, 255, 0.05),rgba(167, 139, 250, 0.1))',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(90, 120, 255,0.1)',
                    paddingLeft: isMobile ? '1.25rem' : '2.5rem',
                    paddingRight: isMobile ? '1.25rem' : '2.5rem',
                }}
            >
        <span
            className="text-xl font-black cursor-pointer tracking-tight select-none"
            style={{
                background: 'linear-gradient(135deg,#60A5FA,#A78BFA)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
            onClick={() => navigate(-1)}
        >
          УКоннект
        </span>

                {showLinks && !isMobile && (
                    <div className="flex items-center gap-2">
                        {renderLinks(false)}
                    </div>
                )}

                {showLinks && isMobile && (
                    <button
                        onClick={openMenu}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
                    >
                        <Menu size={24} />
                    </button>
                )}
            </nav>

            {/* Мобильное меню (стиль FilterPanel) */}
            {isMobile && showLinks && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={closeMenu}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            zIndex: 199, opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none',
                            transition: 'opacity 0.3s ease',
                        }}
                    />

                    {/* Slide-in Panel */}
                    <div
                        style={{
                            position: 'fixed', top: 0, right: 0,
                            width: 'min(85vw, 320px)', height: '100vh', zIndex: 200,
                            padding: '28px 24px', overflowY: 'auto',
                            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                            background: '#F0F4FF',
                            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Меню</h2>
                            <button
                                onClick={closeMenu}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {renderLinks(true)}
                    </div>
                </>
            )}
        </>
    )
}