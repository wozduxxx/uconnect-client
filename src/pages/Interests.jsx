import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, RotateCcw } from 'lucide-react'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Toast, { toast } from '../components/Toast'
import { getTags, addTags, getUserTags } from '../api/interests'
import { useAuth } from '../context/AuthContext'

const TAG_COLORS = ['tag-blue', 'tag-purple', 'tag-green', 'tag-pink', 'tag-yellow', 'tag-teal']
function getTagColor(name = '') {
    const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
    return TAG_COLORS[sum % TAG_COLORS.length]
}

export default function Interests() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [categories, setCategories] = useState([])
    const [allTags, setAllTags] = useState([])
    const [selected, setSelected] = useState([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // 🔹 1. Загрузка всех категорий и тегов
    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const categoriesData = await getTags()
                setCategories(categoriesData)

                const flat = categoriesData.flatMap(cat =>
                    (cat.tags || cat.Tags || []).map(tag => ({
                        tagId: tag.tagId || tag.TagId,
                        tagName: tag.tagName || tag.TagName,
                        categoryId: cat.categoryId || cat.CategoryId,
                        categoryName: cat.categoryName || cat.CategoryName
                    }))
                )
                setAllTags(flat)
            } catch (err) {
                const msg = err.response?.data || 'Ошибка загрузки тегов'
                toast(typeof msg === 'string' ? msg : 'Ошибка загрузки тегов')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // 🔹 2. Загрузка уже выбранных интересов пользователя
    useEffect(() => {
        if (!user?.userId || allTags.length === 0) return

        async function loadUserTags() {
            try {
                const userTags = await getUserTags(user.userId)
                // Извлекаем только ID тегов и устанавливаем их как выбранные
                const tagIds = (userTags || []).map(t => t.tagId ?? t.TagId).filter(Boolean)
                setSelected(tagIds)
            } catch (err) {
                console.warn('Не удалось загрузить сохранённые интересы:', err)
            }
        }
        loadUserTags()
    }, [user?.userId, allTags])

    function toggle(tagId) {
        setSelected(prev =>
            prev.includes(tagId) ? prev.filter(i => i !== tagId) : [...prev, tagId]
        )
    }

    // 🔹 3. Сброс выбора
    function handleReset() {
        setSelected([])
        toast('Выбор сброшен')
    }

    const filteredCategories = query.trim()
        ? [{
            categoryId: 0,
            categoryName: 'Результаты поиска',
            tags: allTags.filter(t =>
                (t.tagName || '').toLowerCase().includes(query.toLowerCase())
            )
        }]
        : categories

    async function handleContinue() {
        if (selected.length < 3) {
            toast('Выберите хотя бы 3 интереса')
            return
        }
        setSaving(true)
        try {
            const tags = selected.map(tagId => ({ tagId, level: 'beginner' }))
            await addTags(tags)
            toast('Интересы сохранены!')
            navigate('/search')
        } catch (err) {
            const msg = err.response?.data || 'Ошибка сохранения'
            toast(typeof msg === 'string' ? msg : 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar showLinks />
            <Toast />

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
                            Выберите ваши интересы
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
                            Это поможет найти людей на одной волне с вами.
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {' '}Выбрано: {selected.length}
                            </span>
                        </p>

                        {/* Поиск */}
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{
                                position: 'absolute', left: 14, top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-muted)'
                            }} />
                            <input
                                className="field"
                                style={{ paddingLeft: 42 }}
                                placeholder="Поиск интересов..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleReset}
                            style={{
                                padding: '18px 0px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.2s', marginBottom: 6
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                            <RotateCcw size={20} /> Сбросить выбор
                        </button>

                        {/* Спиннер загрузки */}
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                <div style={{
                                    width: 36, height: 36, border: '3px solid rgba(59,130,246,0.2)',
                                    borderTopColor: '#3B82F6', borderRadius: '50%',
                                    animation: 'spin 0.7s linear infinite'
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {filteredCategories.map(category => {
                                    const categoryTags = category.tags || []
                                    if (categoryTags.length === 0) return null

                                    return (
                                        <motion.div
                                            key={category.categoryId}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <h3 style={{
                                                fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
                                                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12,
                                            }}>
                                                {category.categoryName}
                                            </h3>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {categoryTags.map(tag => {
                                                    const tagId = tag.tagId || tag.TagId
                                                    const tagName = tag.tagName || tag.TagName
                                                    const isSelected = selected.includes(tagId)

                                                    return (
                                                        <Tag
                                                            key={tagId}
                                                            label={tagName}
                                                            variant={getTagColor(tagName)}
                                                            selected={isSelected}
                                                            onClick={() => toggle(tagId)}
                                                            style={{
                                                                cursor: 'pointer', transition: 'all 0.2s',
                                                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                            }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )
                                })}

                                {filteredCategories.every(c => !(c.tags || []).length) && (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                                        Ничего не найдено
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Кнопки действий */}
                        <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center' }}>

                            <Button
                                fullWidth
                                onClick={handleContinue}
                                disabled={selected.length < 3 || saving}
                                style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                variant="purple"
                            >
                                {saving && (
                                    <span style={{
                                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                                        borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite'
                                    }} />
                                )}
                                {saving
                                    ? 'Сохранение...'
                                    : selected.length > 2
                                        ? `Продолжить (выбрано: ${selected.length})`
                                        : 'Выберите хотя бы три интереса'
                                }
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}