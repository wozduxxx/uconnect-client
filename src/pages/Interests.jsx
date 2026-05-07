import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Toast, { toast } from '../components/Toast'
import { getTags, addTags } from '../api/interests'

const TAG_COLORS = ['tag-blue', 'tag-purple', 'tag-green', 'tag-pink', 'tag-yellow', 'tag-teal']
function getTagColor(name = '') {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return TAG_COLORS[sum % TAG_COLORS.length]
}

export default function Interests() {
  const navigate = useNavigate()

  const [allItems, setAllItems] = useState([]) // [{ tagId, tagName }]
  const [selected, setSelected] = useState([]) // [tagId]
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const categories = await getTags()
        // Сглаживаем в плоский список
        const flat = categories.flatMap(cat => cat.tags || cat.Tags || [])
        setAllItems(flat)
      } catch (err) {
        const msg = err.response?.data || 'Ошибка загрузки тегов'
        toast(typeof msg === 'string' ? msg : 'Ошибка загрузки тегов')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggle(tagId) {
    setSelected(prev =>
      prev.includes(tagId) ? prev.filter(i => i !== tagId) : [...prev, tagId]
    )
  }

  const filtered = query
    ? allItems.filter(t => (t.tagName || t.TagName || '').toLowerCase().includes(query.toLowerCase()))
    : allItems

  async function handleContinue() {
    if (selected.length < 3) return
    setSaving(true)
    try {
      // Отправляем выбранные tagId с уровнем beginner по умолчанию
      const tags = selected.map(tagId => ({ tagId, level: 'beginner' }))
      await addTags(tags)
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
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
              Выберите ваши интересы
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              Это поможет найти людей на одной волне с вами. Выбрано: {selected.length}
            </p>

            <div style={{ position: 'relative', marginBottom: 24 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="field"
                style={{ paddingLeft: 42 }}
                placeholder="Поиск интересов..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {/* Спиннер загрузки тегов */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <motion.div
                style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {filtered.map(tag => {
                  const id = tag.tagId ?? tag.TagId
                  const name = tag.tagName ?? tag.TagName
                  return (
                    <motion.span
                      key={id}
                      variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                    >
                      <Tag
                        label={name}
                        variant={getTagColor(name)}
                        selected={selected.includes(id)}
                        onClick={() => toggle(id)}
                      />
                    </motion.span>
                  )
                })}
                {filtered.length === 0 && !loading && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Ничего не найдено</div>
                )}
              </motion.div>
            )}

            <Button
              fullWidth
              onClick={handleContinue}
              disabled={selected.length < 3 || saving}
              style={{ marginTop: 32, padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              variant="purple"
            >
              {saving && (
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              )}
              {saving
                ? 'Сохранение...'
                : selected.length > 2
                  ? `Продолжить (выбрано: ${selected.length})`
                  : 'Выберите хотя бы три интереса'
              }
            </Button>
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
