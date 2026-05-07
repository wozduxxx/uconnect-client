import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {Search as SearchIcon, SlidersHorizontal, UserCheck, UserPlus, Loader2, Edit3} from 'lucide-react'
import Navbar from '../components/Navbar'
import FilterPanel from '../components/FilterPanel'
import Toast, { toast } from '../components/Toast'
import Tag from '../components/Tag'
import Button from '../components/Button'
import { searchByUserTags, getTags, getUserTags } from '../api/interests'
import { bidFriend, getMyFriends, getPendingRequestIds } from '../api/friends'
import { resolveAvatarUrl } from '../utils/fileUtils'
import { useNavigate } from 'react-router-dom'

const TAG_COLORS = ['tag-blue', 'tag-purple', 'tag-green', 'tag-pink', 'tag-yellow', 'tag-teal']
function getTagColor(name) {
    if (!name) return 'tag-blue'
    const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
    return TAG_COLORS[sum % TAG_COLORS.length]
}

const PAGE_SIZE = 10

export default function Search() {
    const navigate = useNavigate()

    const [people, setPeople] = useState([])
    const [friendIds, setFriendIds] = useState(new Set())
    const [pendingIds, setPendingIds] = useState(new Set())
    const [allTags, setAllTags] = useState([])
    const [filterOpen, setFilterOpen] = useState(false)
    const [activeFilters, setActiveFilters] = useState({})
    const [searchLoading, setSearchLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [loadingMore, setLoadingMore] = useState(false)
    const loaderRef = useRef(null)
    const [incomingPendingIds, setIncomingPendingIds] = useState(new Set())

    useEffect(() => {
        async function init() {
            setSearchLoading(true)
            try {
                const [results, friends, tags] = await Promise.all([
                    searchByUserTags([]),
                    getMyFriends(),
                    getTags(),
                ])
                setPeople(results)
                const ids = new Set(friends.map(f => f.friendInfo?.userId).filter(Boolean))
                setFriendIds(ids)
                const flat = tags.flatMap(cat => cat.tags || cat.Tags || [])
                setAllTags(flat)
                // Загружаем pending из localStorage и синхронизируем с сервером
                const pending = await getPendingRequestIds()
                setPendingIds(pending)
            } catch (err) {
                const msg = err.response?.data || 'Ошибка загрузки'
                toast(typeof msg === 'string' ? msg : 'Ошибка загрузки')
            } finally {
                setSearchLoading(false)
            }
        }
        init()
    }, [])

    // Infinite scroll через IntersectionObserver
    useEffect(() => {
        if (!loaderRef.current) return
        const obs = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loadingMore) {
                    setLoadingMore(true)
                    setTimeout(() => {
                        setVisibleCount(prev => prev + PAGE_SIZE)
                        setLoadingMore(false)
                    }, 300)
                }
            },
            { threshold: 0.1 }
        )
        obs.observe(loaderRef.current)
        return () => obs.disconnect()
    }, [loadingMore, people.length])

    const handleApply = useCallback(async (checkedTagIds) => {
        setActiveFilters(checkedTagIds)
        setSearchLoading(true)
        setVisibleCount(PAGE_SIZE)
        try {
            const ids = Object.keys(checkedTagIds).filter(k => checkedTagIds[k]).map(Number)
            const results = await searchByUserTags(ids)
            setPeople(results)
            toast('Фильтры применены')
        } catch (err) {
            const msg = err.response?.data || 'Ошибка фильтрации'
            toast(typeof msg === 'string' ? msg : 'Ошибка фильтрации')
        } finally {
            setSearchLoading(false)
        }
    }, [])

    function removeFilter(tagId) {
        const updated = { ...activeFilters, [tagId]: false }
        setActiveFilters(updated)
        handleApply(updated)
    }

    async function handleBidFriend(userId, userName) {
        setPendingIds(prev => new Set([...prev, userId]))
        try {
            const msg = await bidFriend(userId)
            toast(msg || `Запрос отправлен ${userName}`)
            if (msg?.includes('друзья')) {
                setFriendIds(prev => new Set([...prev, userId]))
                setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
            }
        } catch (err) {
            setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
            const msg = err.response?.data || 'Ошибка отправки запроса'
            toast(typeof msg === 'string' ? msg : 'Ошибка отправки запроса')
        }
    }

    const filtered = query.trim()
        ? people.filter(p => {
            const fullName = `${p.userName} ${p.userSurname}`.toLowerCase()
            return fullName.includes(query.toLowerCase())
        })
        : people

    const visible = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length
    const appliedTagIds = Object.keys(activeFilters).filter(k => activeFilters[k])

    function getTagName(tagId) {
        const tag = allTags.find(t => String(t.tagId) === String(tagId))
        return tag?.tagName ?? tagId
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar showLinks />
            <Toast />

            <FilterPanel
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                onApply={handleApply}
                allTags={allTags}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 60px' }}>

                    {/* Поиск */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ position: 'relative', marginBottom: 14 }}
                    >
                        <SearchIcon size={18} style={{
                            position: 'absolute', left: 16, top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted)',
                        }} />
                        <input
                            className="field"
                            style={{ paddingLeft: 46, fontSize: 15 }}
                            placeholder="Поиск по имени..."
                            value={query}
                            onChange={e => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
                        />
                    </motion.div>

                    {/* Фильтры */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}
                    >
                        {appliedTagIds.length > 0 ? (
                            appliedTagIds.map(tagId => {
                                const label = getTagName(tagId)
                                return (
                                    <div key={tagId} onClick={() => removeFilter(tagId)} style={{ cursor: 'pointer' }} title="Убрать фильтр">
                                        <Tag label={label} variant={getTagColor(label)} />
                                    </div>
                                )
                            })
                        ) : (
                            <Tag label="Показаны все" variant="tag-blue" />
                        )}

                        <button
                            onClick={() => setFilterOpen(true)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: appliedTagIds.length > 0 ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                                color: appliedTagIds.length > 0 ? '#3B82F6' : 'var(--text-secondary)',
                                transition: 'all 0.2s', marginLeft: 'auto',
                            }}
                        >
                            <SlidersHorizontal size={14} />
                            Фильтр {appliedTagIds.length > 0 && `(${appliedTagIds.length})`}
                        </button>
                    </motion.div>

                    {/* Счётчик */}
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        {searchLoading
                            ? 'Поиск...'
                            : <>Человек найдено: <b>{filtered.length}</b> </>
                        }
                    </div>

                    {/* Спиннер */}
                    {searchLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                            <div style={{
                                width: 36, height: 36,
                                border: '3px solid rgba(59,130,246,0.2)',
                                borderTopColor: '#3B82F6', borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {/* Список */}
                    {!searchLoading && (
                        filtered.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>Никого не найдено</div>
                                <div style={{ fontSize: 13, marginTop: 6 }}>Попробуйте изменить запрос или фильтры. Или добавьте интересы в своём профиле</div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            >
                                {visible.map(person => (
                                    <motion.div
                                        key={person.userId}
                                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                    >
                                        <PersonCard
                                            person={person}
                                            isFriend={friendIds.has(person.userId)}
                                            isPending={pendingIds.has(person.userId)}
                                            onBidFriend={handleBidFriend}
                                        />
                                    </motion.div>
                                ))}

                                {/* Infinite scroll trigger */}
                                {hasMore && (
                                    <div ref={loaderRef} style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                                        {loadingMore && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    color: 'var(--text-secondary)', fontSize: 13,
                                                }}
                                            >
                                                <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                                                Загрузка...
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

function PersonCard({ person, isFriend, isPending, onBidFriend }) {
    const navigate = useNavigate()
    const [tags, setTags] = useState([])
    const [tagsLoaded, setTagsLoaded] = useState(false)
    const avatarUrl = resolveAvatarUrl(person.avatarUrl)
    const fullName = [person.userName, person.userSurname].filter(Boolean).join(' ')
    const initials = [person.userName?.[0], person.userSurname?.[0]].filter(Boolean).join('').toUpperCase()

    useEffect(() => {
        async function loadTags() {
            try {
                const data = await getUserTags(person.userId)
                setTags(data)
            } catch {
                setTags([])
            } finally {
                setTagsLoaded(true)
            }
        }
        loadTags()
    }, [person.userId])

    return (
        <>
            <div
                className="person-card glass"
                onClick={() => navigate(`/profile?id=${person.userId}`)}
                style={{
                    display: 'flex',
                    gap: 16,
                    padding: '18px 20px',
                    borderRadius: 18,
                    marginBottom: 12,
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 36px rgba(59,130,246,0.18)'
                    e.currentTarget.style.borderColor = 'rgba(96,165,250,0.25)'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                }}
            >
                {/* Аватар */}
                <div className="person-avatar" style={{
                    width: 64, height: 64, borderRadius: 18, flexShrink: 0,
                    background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: '#fff', overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                }}>
                    {avatarUrl
                        ? <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials
                    }
                </div>

                {/* Информация: Имя + Теги */}
                <div className="person-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Имя */}
                    <div className="person-name" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                        {fullName}
                    </div>

                    {/* Теги */}
                    <div className="person-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {!tagsLoaded ? (
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{
                                        height: 24, width: 60 + i * 20, borderRadius: 999,
                                        background: 'rgba(255,255,255,0.06)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        animationDelay: `${i * 0.1}s`,
                                    }} />
                                ))}
                            </>
                        ) : tags.length > 0 ? (
                            <>
                                {tags.slice(0, 5).map(tag => {
                                    const name = tag.tagName ?? tag.TagName ?? ''
                                    return (
                                        <Tag key={tag.tagId ?? tag.TagId} label={name} variant={getTagColor(name)} />
                                    )
                                })}
                                {tags.length > 5 && (
                                    <span style={{
                                        fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
                                        alignSelf: 'center',
                                    }}>
                                        +{tags.length - 5}
                                    </span>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Кнопка */}
                <div className="person-action" style={{ flexShrink: 0, alignSelf: 'center' }} onClick={e => e.stopPropagation()}>
                    {isFriend ? (
                        <Button onClick={() => navigate('/chat')} variant="green" style={{ padding: '9px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Edit3 size={13} /> <span>Написать</span>
                        </Button>
                    ) : isPending ? (
                        <Button variant="ghost" disabled style={{ padding: '9px 16px', fontSize: 13 }}>
                            Отправлено
                        </Button>
                    ) : (
                        <Button onClick={() => onBidFriend(person.userId, fullName)} style={{ padding: '9px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <UserPlus size={14} /> <span>Добавить</span>
                        </Button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                
                /* Адаптив для экранов <550px */
                @media (max-width: 550px) {
                    .person-card {
                        flex-wrap: wrap !important;
                        padding: 14px !important;
                        gap: 12px !important;
                        align-items: center !important;
                    }
                    
                    .person-info { display: contents !important; }
                    
                    .person-avatar {
                        width: 48px !important;
                        height: 48px !important;
                        border-radius: 14px !important;
                        font-size: 16px !important;
                        order: 1 !important;
                    }
                    
                    .person-name {
                        order: 2 !important;
                        font-size: 15px !important;
                        margin: 0 !important;
                        flex: 1 !important;
                    }
                    
                    .person-action {
                        order: 4 !important; /* Кнопка теперь последняя (было 3) */
                        width: 100% !important;
                        margin-top: 8px !important;
                    }
                    
                    .person-action button {
                        padding: 8px !important;
                        min-width: auto !important;
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    
                    .person-tags {
                        order: 3 !important; /* Теги теперь перед кнопкой (было 4) */
                        width: 100% !important;
                        margin-top: 8px !important;
                        padding-top: 0 !important;
                        border-top: 1px solid rgba(255,255,255,0.08) !important;
                    }
                    
                    .person-tags .tag {
                        font-size: 11px !important;
                        padding: 4px 10px !important;
                        height: auto !important;
                    }
                }
            `}</style>
        </>
    )
}