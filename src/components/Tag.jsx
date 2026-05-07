const STYLES = {
  'tag-green':  { bg: 'rgba(16,185,129)',  color: '#34D399', border: 'rgba(16,185,129,0.22)' },
  'tag-teal':   { bg: 'rgba(20,184,166)',  color: '#5EEAD4', border: 'rgba(20,184,166,0.22)' },
  'tag-purple': { bg: 'rgba(139,92,246)',  color: '#A78BFA', border: 'rgba(139,92,246,0.22)' },
  'tag-pink':   { bg: 'rgba(236,72,153)',  color: '#F472B6', border: 'rgba(236,72,153,0.22)' },
  'tag-yellow': { bg: 'rgba(245,158,11)',  color: '#FCD34D', border: 'rgba(245,158,11,0.22)' },
  'tag-blue':   { bg: 'rgba(59,130,246)',  color: '#93C5FD', border: 'rgba(59,130,246,0.22)' },
}

export default function Tag({ label, variant = 'tag-blue', selected = false, onClick }) {
  const s = STYLES[variant] || STYLES['tag-blue']
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        background: s.bg,
        color: '#F0F4FF',
        outline: selected ? `2px solid ${STYLES[variant].bg}` : 'none',
        outlineOffset: 2,
      }}
    >
      {label}
    </span>
  )
}
