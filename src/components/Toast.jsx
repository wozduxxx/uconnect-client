import { useEffect, useState } from 'react'

let _setMsg = null

export function toast(msg) {
  if (_setMsg) _setMsg(msg)
}

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _setMsg = (m) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
        background: 'rgba(139,92,246,0.14)',
        border: '1px solid rgba(139,92,246,0.3)',
        color: '#8B5CF6',
        padding: '12px 28px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 9999,
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        whiteSpace: 'nowrap',
      }}
    >
      {msg}
    </div>
  )
}
