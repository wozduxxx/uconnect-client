import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import Button from './Button'

/**
 * FilterPanel теперь принимает реальные теги с бэкенда через props.allTags
 * API INTEGRATION: вместо mockData используем { tagId, tagName } из /api/interests/GetTags
 *
 * @param {{ open: boolean, onClose: () => void, onApply: (checked: Record<number, boolean>) => void, allTags: Array<{tagId: number, tagName: string}> }} props
 */
export default function FilterPanel({ open, onClose, onApply, allTags = [] }) {
  const [checked, setChecked] = useState({})
  const [query, setQuery] = useState('')

  function toggle(tagId) {
    setChecked(prev => ({ ...prev, [tagId]: !prev[tagId] }))
  }

  const filtered = query
    ? allTags.filter(t => (t.tagName || t.TagName || '').toLowerCase().includes(query.toLowerCase()))
    : allTags

  function reset() {
    setChecked({})
    setQuery('')
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 199,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 340, height: '100vh', zIndex: 200,
          padding: '28px 24px', overflowY: 'auto',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          background: '#F0F4FF',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Фильтр</h2>
          <button
            onClick={onClose}
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

        {/* Поиск по тегам */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="field"
            style={{ paddingLeft: 40 }}
            placeholder="Поиск тегов..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
          Теги {allTags.length > 0 && `(${allTags.length})`}
        </p>

        {filtered.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>
            {allTags.length === 0 ? 'Загрузка тегов...' : 'Ничего не найдено'}
          </div>
        )}

        {filtered.map(tag => {
          const id = tag.tagId ?? tag.TagId
          const name = tag.tagName ?? tag.TagName

          return (
            <div
              key={id}
              onClick={() => toggle(id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: checked[id] ? 'none' : '2px solid rgba(0,0,0,0.15)',
                  background: checked[id] ? '#3B82F6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#fff', transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {checked[id] ? '✓' : ''}
              </div>
            </div>
          )
        })}

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            fullWidth
            onClick={() => {
              onApply && onApply(checked)
              onClose()
            }}
          >
            Применить фильтры
          </Button>
          <Button fullWidth variant="ghost" onClick={reset}>
            Сбросить
          </Button>
        </div>
      </div>
    </>
  )
}
