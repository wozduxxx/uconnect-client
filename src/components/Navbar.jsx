import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyChats } from '../api/messages'
import { getMyRequests } from '../api/friends'

export default function Navbar({ unreadMessages = 0, spacer = true, isInChat = false }) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { user, logout } = useAuth()

    const [menuOpen, setMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const [displayUnread, setDisplayUnread] = useState(() => {
        const saved = localStorage.getItem('unreadCount')
        return saved ? Number(saved) : unreadMessages
    })
    const lastUnreadRef = useRef(displayUnread)

    const [friendRequestsCount, setFriendRequestsCount] = useState(() => {
        const saved = localStorage.getItem('friendRequestsCount')
        return saved ? Number(saved) : 0
    })
    const lastRequestsRef = useRef(friendRequestsCount)

    useEffect(() => {
        if (unreadMessages !== lastUnreadRef.current) {
            lastUnreadRef.current = unreadMessages
            setDisplayUnread(unreadMessages)
            localStorage.setItem('unreadCount', unreadMessages.toString())
        }
    }, [unreadMessages])

    useEffect(() => {
        const handler = (e) => {
            const total = e.detail
            if (total !== lastUnreadRef.current) {
                lastUnreadRef.current = total
                setDisplayUnread(total)
                localStorage.setItem('unreadCount', total.toString())
            }
        }
        window.addEventListener('unread-sync', handler)
        return () => window.removeEventListener('unread-sync', handler)
    }, [])

    useEffect(() => {
        if (isInChat || !user) return

        let mounted = true
        const poll = async () => {
            try {
                const chats = await getMyChats()
                const total = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
                if (mounted && total !== lastUnreadRef.current) {
                    lastUnreadRef.current = total
                    setDisplayUnread(total)
                    localStorage.setItem('unreadCount', total.toString())
                    window.dispatchEvent(new CustomEvent('unread-sync', { detail: total }))
                }
            } catch {
            }
        }

        poll()

        const interval = setInterval(poll, 20000)
        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [isInChat, user])

    useEffect(() => {
        if (friendRequestsCount !== lastRequestsRef.current) {
            lastRequestsRef.current = friendRequestsCount
            setFriendRequestsCount(friendRequestsCount)
            localStorage.setItem('friendRequestsCount', friendRequestsCount.toString())
        }
    }, [friendRequestsCount])

    useEffect(() => {
        const handler = (e) => {
            const count = e.detail
            if (count !== lastRequestsRef.current) {
                lastRequestsRef.current = count
                setFriendRequestsCount(count)
                localStorage.setItem('friendRequestsCount', count.toString())
            }
        }
        window.addEventListener('friend-requests-sync', handler)
        return () => window.removeEventListener('friend-requests-sync', handler)
    }, [])

    useEffect(() => {
        if (!user || pathname === '/requests') return

        let mounted = true
        const poll = async () => {
            try {
                const requests = await getMyRequests()
                const count = requests.length
                if (mounted && count !== lastRequestsRef.current) {
                    lastRequestsRef.current = count
                    setFriendRequestsCount(count)
                    localStorage.setItem('friendRequestsCount', count.toString())
                    window.dispatchEvent(new CustomEvent('friend-requests-sync', { detail: count }))
                }
            } catch {
            }
        }

        poll()

        const interval = setInterval(poll, 20000)
        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [user, pathname])

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

    const authNavItems = [
        { label: 'Поиск', path: '/search' },
        { label: 'Стенка', path: '/wall' },
        { label: 'Коннекты', path: '/requests', hasBadge: friendRequestsCount > 0 },
        { label: 'Чаты', path: '/chat', hasBadge: displayUnread > 0 },
        { label: 'Профиль', path: '/profile' },
    ]

    const guestNavItems = [
        { label: 'Стенка', path: '/wall' },

    ]

    const navItems = user ? authNavItems : guestNavItems

    const getLinkStyle = (isActive) => ({
        color: isActive ? '#4199ff' : 'var(--text-secondary)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'Manrope, sans-serif',
        padding: '8px 12px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
    })

    const renderLinks = (mobile = false) => (
        <div style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 6 : 2,
            alignItems: mobile ? 'stretch' : 'center',
            width: '100%',
        }}>
            {navItems.map(item => {
                const isActive = pathname === item.path
                return (
                    <button
                        key={item.path}
                        onClick={() => { navigate(item.path); mobile && closeMenu() }}
                        className="transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                            ...getLinkStyle(isActive),
                            ...(mobile && {
                                padding: '14px 16px',
                                width: '100%',
                                justifyContent: 'space-between',
                                borderRadius: '12px',
                            }),
                        }}
                    >
                        <span>{item.label}</span>
                        {item.hasBadge && (
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#3B82F6',
                                ...(mobile ? {} : { position: 'absolute', top: 2, right: 2, border: '2px solid var(--bg-mid)' }),
                            }} />
                        )}
                    </button>
                )
            })}

            {user && (
                <button
                    onClick={() => { handleLogout(); mobile && closeMenu() }}
                    style={{
                        ...getLinkStyle(false),
                        color: '#ff6363',
                        ...(mobile && {
                            marginTop: 12,
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            paddingTop: 14,
                            borderRadius: '12px',
                        }),
                    }}
                >
                    Выход
                </button>
            )}

            {!user && (
                <>
                    <button
                        onClick={() => { navigate('/login'); mobile && closeMenu() }}
                        style={{
                            ...getLinkStyle(pathname === '/login'), // ✅ Как обычные ссылки
                            ...(mobile && {
                                marginTop: 12,
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                paddingTop: 14,
                                borderRadius: '12px',
                            }),
                        }}
                    >
                        Вход
                    </button>
                    <button
                        onClick={() => { navigate('/register'); mobile && closeMenu() }}
                        style={{
                            ...getLinkStyle(pathname === '/register'), // ✅ Как обычные ссылки
                            ...(mobile && {
                                marginTop: 8,
                                borderRadius: '12px',
                            }),
                        }}
                    >
                        Регистрация
                    </button>
                </>
            )}
        </div>
    )

    return (
        <>
            <nav
                className={`${isInChat ? 'sticky' : 'fixed'} top-0 z-50 flex items-center justify-between`}
                style={{
                    background: 'linear-gradient(135deg,rgba(110,110,255,0.05),rgba(167,139,250,0.1))',
                    backdropFilter: 'blur(50px)',
                    WebkitBackdropFilter: 'blur(50px)',
                    borderBottom: '1px solid rgba(90,120,255,0.1)',
                    paddingLeft: isMobile ? '1.25rem' : '2.5rem',
                    paddingRight: isMobile ? '1.25rem' : '2.5rem',
                    paddingTop: isMobile ? '0.25rem' : '0.75rem',
                    paddingBottom: isMobile ? '0.25rem' : '0.75rem',
                    width: '100%',
                    // Sticky: участвует в flex-потоке → Chat знает реальную высоту
                    // Fixed: плавает над контентом → остальные страницы используют spacer
                    flexShrink: 0,
                }}
            >
                <span
                    className="text-xl font-black cursor-pointer tracking-tight select-none"
                    style={{
                        background: 'linear-gradient(135deg,#60A5FA,#A78BFA)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}
                    onClick={() => navigate('/')}
                >
                    УКоннект
                </span>

                {!isMobile && (
                    <div className="flex items-center gap-2">
                        {renderLinks(false)}
                    </div>
                )}

                {isMobile && (
                    <button
                        onClick={openMenu}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
                    >
                        <Menu size={24} />
                    </button>
                )}
            </nav>

            {spacer && !isInChat && (
                <div style={{ height: 'var(--navbar-height)' }} aria-hidden="true" />
            )}

            {/* Мобильное меню */}
            {isMobile && (
                <>
                    <div
                        onClick={closeMenu}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            zIndex: 199, opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none',
                            transition: 'opacity 0.3s ease',
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed', top: 0, right: 0,
                            width: 'min(85vw, 320px)', height: '100vh', zIndex: 200,
                            padding: '28px 24px', overflowY: 'auto',
                            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                            background: '#F0F4FF',
                            backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)',
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