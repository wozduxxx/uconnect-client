export default function Button({ children, variant = 'primary', onClick, fullWidth = false, style = {}, disabled = false }) {
  const base = {
    padding: '12px 24px',
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    fontFamily: 'Manrope, sans-serif',
    transition: 'all 0.2s',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
    },
    orange: {
      background: 'linear-gradient(135deg,#F59E0B,#D68E15)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
    },
    purple: {
      background: 'linear-gradient(135deg,#8B5CF6,#6F42D6)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
    },
    green: {
      background: 'linear-gradient(135deg,#10B981,#0B8C68)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      color: '#F87171',
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,0.45)'
        }
        if (variant === 'orange') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.45)'
        }
        if (variant === 'green') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.45)'
        }
        if (variant === 'purple') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(139,92,246,0.45)'
        }
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = variant === 'primary' ? '0 4px 20px rgba(59,130,246,0.3)' : variant === 'orange' ? '0 4px 20px rgba(245,158,11,0.3)' : variant === 'green' ? '0 4px 20px rgba(16,185,129,0.3)' : variant === 'purple' ? '0 4px 20px rgba(139,92,246,0.3)' : ''
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = '' }}
    >
      {children}
    </button>
  )
}
