import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Tag from './Tag'
import Button from "./Button.jsx";

export default function PersonCard({ person, onRequestSent }) {
  const [sent, setSent] = useState(person.friends)
  const navigate = useNavigate()

  function handleRequest(e) {
    e.stopPropagation()
    setSent(true)
    if (onRequestSent) onRequestSent(person.id)
  }

  return (
    <div
      onClick={() => navigate('/profile')}
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 20px',
        borderRadius: 16,
        marginBottom: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: person.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {person.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{person.name}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {person.tags.map(t => (
            <Tag key={t} label={t} variant={getTagColor(t)} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.bio}
        </div>
      </div>

      {/* Action */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {sent ? (
              <Button variant={'green'} onClick={(e) => {e.stopPropagation(); navigate('/requests')}} style={{ padding: '9px 18px', fontSize: 13 }}>
                  Запрос отправлен!
              </Button>
        ) : (
            <Button onClick={handleRequest} style={{ padding: '9px 18px', fontSize: 13 }}>
                Отправить запрос
            </Button>
        )}
      </div>
    </div>
  )
}
