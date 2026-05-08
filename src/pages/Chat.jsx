import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, X, MessageCircle, Search,
  Image, ChevronLeft, Check, CheckCheck, Trash2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Toast, { toast } from '../components/Toast'
import { getMyChats, getChatHistory, sendMessage, enrichChatsWithUserInfo } from '../api/messages'
import { resolveAvatarUrl, validateImageFile } from '../utils/fileUtils'
import { useNavigate } from 'react-router-dom'
import { getMyFriends } from '../api/friends'



// Рендерит текст с активными ссылками и переносами строк
function renderTextWithLinks(text) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0
      return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
             style={{ color: '#60A5FA', textDecoration: 'underline', wordBreak: 'break-all' }}
             onClick={e => e.stopPropagation()}
          >{part}</a>
      )
    }
    urlRegex.lastIndex = 0
    return part.split('\n').map((line, j, arr) => (
        <span key={`${i}-${j}`}>{line}{j < arr.length - 1 ? <br /> : null}</span>
    ))
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const safeDateStr = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
  const d = new Date(safeDateStr)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getResponsiveScale(imgElement) {
  const imgWidth = imgElement.naturalWidth || imgElement.width
  const screenWidth = window.innerWidth
  const occupancy = imgWidth / screenWidth

  if (occupancy <= 0.3) return 1.15
  if (occupancy >= 1.0) return 0.98
  const t = (occupancy - 0.3) / (1.0 - 0.3)
  return 1.15 - t * (1.15 - 0.98)
}

function formatChatDate(dateStr) {
  if (!dateStr) return ''
  const safeDateStr = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
  const d = new Date(safeDateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return formatTime(safeDateStr)
  if (isYesterday) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  const safeDateStr = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
  const d = new Date(safeDateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return 'Сегодня'
  if (isYesterday) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getInitials(userName, userSurname) {
  return [userName?.[0], userSurname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
}

// ── Аватар пользователя ───────────────────────────────────────────────────
function Avatar({ user, size = 44, onClick }) {
  const url = resolveAvatarUrl(user?.avatarUrl)
  const initials = getInitials(user?.userName, user?.userSurname)
  return (
      <div
          onClick={onClick}
          style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.3, fontWeight: 700, color: '#fff', overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default',
          }}
      >
        {url
            ? <img src={url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
        }
      </div>
  )
}


function MessageBubble({ msg, onImageClick }) {
  const isMine = msg.isMine
  const apiBase = (import.meta.env.VITE_API_URL || 'http://api.уконнект.рф/api').replace(/\/api$/, '')

  return (
      <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="message-bubble"
          data-mine={isMine}
          style={{
            display: 'flex',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            marginBottom: 4,
            paddingInline: 16,
          }}
      >
        <div style={{ maxWidth: '85%', width: 'fit-content' }}>
          {msg.messageText && (
              <div style={{
                padding: '10px 14px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine
                    ? 'linear-gradient(135deg,#3B82F6,#6366F1)'
                    : 'rgba(255,255,255,0.67)',
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: isMine ? '#fff' : 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.55,
                wordBreak: 'break-word',
                backdropFilter: isMine ? 'none' : 'blur(10px)',
              }}>
                {renderTextWithLinks(msg.messageText)}
              </div>
          )}

          {msg.attachments?.map((att, i) => (
              <div key={i} style={{ marginTop: 4 }}>
                <img
                    src={`${apiBase}${att.fileUrl}`}
                    alt="attachment"
                    onClick={() => onImageClick?.(`${apiBase}${att.fileUrl}`)}
                    style={{
                      maxWidth: '100%', maxHeight: 240, borderRadius: 12,
                      objectFit: 'cover', display: 'block',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      const scale = getResponsiveScale(e.currentTarget)
                      e.currentTarget.style.transform = `scale(${scale.toFixed(3)})`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                />
              </div>
          ))}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            marginTop: 3, paddingInline: 2,
          }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatTime(msg.createAt)}
          </span>
            {isMine && (
                <span style={{ color: msg.isRead ? '#60A5FA' : 'var(--text-muted)' }}>
              {msg.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
            </span>
            )}
          </div>
        </div>
      </motion.div>
  )
}


function DateDivider({ label }) {
  return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', margin: '4px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.04)',
          padding: '3px 10px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.06)',
          whiteSpace: 'nowrap',
        }}>
        {label}
      </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
  )
}


function FilePreview({ files, onRemove }) {
  if (!files.length) return null
  return (
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '8px 16px 0',
      }}>
        {files.map((f, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  style={{
                    width: 64, height: 64, objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
              />
              <button
                  onClick={() => onRemove(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#EF4444', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
              >
                <X size={11} />
              </button>
            </div>
        ))}
      </div>
  )
}


export default function Chat() {
  const navigate = useNavigate()

  // Стейты для модального просмотра изображений
  const [selectedImage, setSelectedImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const [showSearch, setShowSearch] = useState(false)

  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [pollingOffset, setPollingOffset] = useState(0)
  const isInitialLoadRef = useRef(false)

  const isManualUpdateRef = useRef(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const pollingRef = useRef(null)
  const textareaRef = useRef(null)
  const imgRef = useRef(null)
  const touchStateRef = useRef({ lastDist: 0, lastScale: 1, lastPos: { x: 0, y: 0 }, touches: [] })
  const navbarRef = useRef(null)

  // Закрытие модалки по Escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [selectedImage])


  useEffect(() => {
    document.body.classList.add('chat-page-active')
    return () => document.body.classList.remove('chat-page-active')
  }, [])


  // Нужно для мобильных панелей с position:fixed — они используют top: var(--chat-navbar-h)
  useEffect(() => {
    if (!navbarRef.current) return
    const el = navbarRef.current
    const update = () => {
      const h = el.offsetHeight
      document.documentElement.style.setProperty('--chat-navbar-h', h + 'px')
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])


  useEffect(() => {
    if (!selectedImage) return

    // Блокируем нативный pinch-zoom браузера пока открыта модалка
    const preventPageZoom = (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.addEventListener('touchmove', preventPageZoom, { passive: false })

    const el = imgRef.current
    if (!el) {
      return () => document.removeEventListener('touchmove', preventPageZoom)
    }

    function getDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function onTouchStart(e) {
      e.stopPropagation()
      const ts = touchStateRef.current
      if (e.touches.length === 2) {
        ts.lastDist = getDistance(e.touches)
        ts.lastScaleOnStart = ts.currentScale ?? 1
        ts.lastPosOnStart = ts.currentPos ? { ...ts.currentPos } : { x: 0, y: 0 }
      } else if (e.touches.length === 1) {
        ts.dragStart = {
          x: e.touches[0].clientX - (ts.currentPos?.x ?? 0),
          y: e.touches[0].clientY - (ts.currentPos?.y ?? 0),
        }
      }
    }

    function onTouchMove(e) {
      e.preventDefault()
      e.stopPropagation()
      const ts = touchStateRef.current

      if (e.touches.length === 2) {
        const dist = getDistance(e.touches)
        const ratio = dist / (ts.lastDist || dist)
        const newScale = Math.max(0.5, Math.min(5, (ts.lastScaleOnStart ?? 1) * ratio))
        ts.currentScale = newScale
        setScale(newScale)
      } else if (e.touches.length === 1) {
        const curScale = ts.currentScale ?? 1
        if (curScale <= 1) return
        const newPos = {
          x: e.touches[0].clientX - (ts.dragStart?.x ?? 0),
          y: e.touches[0].clientY - (ts.dragStart?.y ?? 0),
        }
        ts.currentPos = newPos
        setPosition(newPos)
      }
    }

    function onTouchEnd(e) {
      const ts = touchStateRef.current
      const now = Date.now()
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        if (ts.lastTap && now - ts.lastTap < 300) {
          const nextScale = (ts.currentScale ?? 1) > 1 ? 1 : 2.5
          ts.currentScale = nextScale
          ts.currentPos = { x: 0, y: 0 }
          setScale(nextScale)
          setPosition({ x: 0, y: 0 })
          ts.lastTap = 0
        } else {
          ts.lastTap = now
        }
      }
      // Синхронизируем lastScaleOnStart после отпускания
      if (e.touches.length === 0) {
        ts.lastScaleOnStart = ts.currentScale ?? 1
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchmove', preventPageZoom)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [selectedImage])

  // Синхронизируем touchStateRef с актуальным scale/position
  useEffect(() => {
    touchStateRef.current.currentScale = scale
    touchStateRef.current.currentPos = position
  }, [scale, position])


  const loadChats = useCallback(async (silent = false) => {
    if (!silent) setChatsLoading(true)
    try {
      const [rawChats, allFriends] = await Promise.all([
        getMyChats(),
        getMyFriends()
      ])
      const enrichedChats = await enrichChatsWithUserInfo(rawChats)
      const chatMap = new Map(enrichedChats.map(c => [c.interlocutorId, c]))
      const friendsWithoutChats = allFriends
          .map(f => f.friendInfo)
          .filter(Boolean)
          .filter(friend => !chatMap.has(friend.userId))
          .map(friend => ({
            interlocutorId: friend.userId,
            lastMessage: '',
            lastMessageTime: null,
            unreadCount: 0,
            user: {
              userId: friend.userId,
              userName: friend.userName,
              userSurname: friend.userSurname,
              avatarUrl: friend.avatarUrl,
            }
          }))
      const allChats = [...enrichedChats, ...friendsWithoutChats]
      allChats.sort((a, b) => {
        if (a.unreadCount && !b.unreadCount) return -1
        if (!a.unreadCount && b.unreadCount) return 1
        if (!a.lastMessageTime && !b.lastMessageTime) return 0
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      })
      setChats(allChats)
    } catch (err) {
      if (!silent) {
        const msg = err.response?.data || 'Ошибка загрузки чатов'
        toast(typeof msg === 'string' ? msg : 'Ошибка загрузки чатов')
      }
    } finally {
      if (!silent) setChatsLoading(false)
    }
  }, [])

  useEffect(() => { loadChats() }, [loadChats])


  const loadMessages = useCallback(async (receiverId, { offset = 0, accumulate = true, silent = false } = {}) => {
    if (!silent) setMessagesLoading(true)

    try {
      const data = await getChatHistory(receiverId, { offset, limit: 50 })
      const list = Array.isArray(data) ? data : []

      if (accumulate) {
        setMessages(prev => offset === 0 ? list : [...prev, ...list])
      } else {
        setMessages(list)
      }

      if (list.length > 0) {
        return loadMessages(receiverId, {
          offset: offset + list.length,
          accumulate: true,
          silent: true
        })
      }

      else {
        setPollingOffset(offset)
        setInitialLoadDone(true)
        return list
      }

    } catch (err) {
      if (!silent) {
        const msg = err.response?.data || 'Ошибка загрузки сообщений'
        toast(typeof msg === 'string' ? msg : 'Ошибка загрузки сообщений')
      }
      throw err
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }, [])

  function handleSelectChat(chat) {
    setSelectedChat(chat)
    setMessages([])
    setFiles([])
    setText('')
    setMobileShowChat(true)

    setInitialLoadDone(false)
    setPollingOffset(0)
    isInitialLoadRef.current = false
    isManualUpdateRef.current = true
    loadMessages(chat.interlocutorId, { offset: 0, accumulate: false, silent: false })
  }

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    if (selectedChat && initialLoadDone) {
      pollingRef.current = setInterval(async () => {
        try {
          const data = await getChatHistory(selectedChat.interlocutorId, {
            offset: pollingOffset,
            limit: 50
          })
          const list = Array.isArray(data) ? data : []

          if (list.length > 0) {
            setMessages(prev => [...prev, ...list])
            setPollingOffset(prev => prev + list.length)

            setChats(prev => prev.map(c =>
                c.interlocutorId === selectedChat.interlocutorId
                    ? { ...c, unreadCount: 0 }
                    : c
            ))
          }
        } catch (err) {
        }
      }, 10000)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedChat, initialLoadDone, pollingOffset])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed && !files.length) return
    if (!selectedChat) return

    setSending(true)

    isManualUpdateRef.current = true

    const optimisticMsg = {
      messageId: Date.now(),
      senderId: -1,
      messageText: trimmed,
      createAt: new Date().toISOString(),
      isRead: false,
      isMine: true,
      _optimistic: true,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setText('')
    setFiles([])

    try {
      await sendMessage({
        receiverId: selectedChat.interlocutorId,
        message: trimmed,
        files,
      })

      setPollingOffset(prev => prev + 1)

      await loadChats(true)
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._optimistic))
      const msg = err.response?.data || 'Ошибка отправки'
      toast(typeof msg === 'string' ? msg : 'Ошибка отправки')
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleSend()
        return
      }

      if (isMobile || e.shiftKey) {
        e.preventDefault()
        const start = e.target.selectionStart
        const end = e.target.selectionEnd
        const newVal = text.slice(0, start) + '\n' + text.slice(end)
        setText(newVal)

        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = start + 1
          e.target.style.height = 'auto'
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
        }, 0)
      }
    }
  }

  function handleFileChange(e) {
    const newFiles = Array.from(e.target.files)
    const valid = []
    for (const f of newFiles) {
      const { valid: ok, error } = validateImageFile(f, 10)
      if (!ok) { toast(error); continue }
      valid.push(f)
    }
    if (files.length + valid.length > 5) {
      toast('Максимум 5 файлов')
      return
    }
    setFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function groupMessagesByDate(msgs) {
    const groups = []
    let lastDate = null
    for (const msg of msgs) {
      const dateStr = msg.createAt ? new Date(msg.createAt).toDateString() : null
      if (dateStr && dateStr !== lastDate) {
        groups.push({ type: 'divider', label: formatDayLabel(msg.createAt), key: `d-${msg.createAt}` })
        lastDate = dateStr
      }
      groups.push({ type: 'msg', msg, key: msg.messageId })
    }
    return groups
  }

  const filteredChats = chatSearch.trim()
      ? chats.filter(c => {
        const name = `${c.user?.userName || ''} ${c.user?.userSurname || ''}`.toLowerCase()
        const lastMsg = (c.lastMessage || '').toLowerCase()
        const query = chatSearch.toLowerCase()
        return name.includes(query) || lastMsg.includes(query)
      })
      : chats
  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('unread-sync', { detail: totalUnread }));
  }, [totalUnread]);

  const messagesContainerRef = useRef(null)
  useEffect(() => {
    if (!messagesContainerRef.current || messagesLoading) return;

    const container = messagesContainerRef.current;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    if (selectedChat && messages.length > 0 && !initialLoadDone) {
      setTimeout(scrollToBottom, 50);
      return;
    }

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedChat, messagesLoading, initialLoadDone]);

  return (
      <>
        <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        :root {
          --chat-sidebar-width: 320px;
          --chat-padding: 16px;
          --chat-gap: 12px;
          --avatar-size: 44px;
          --header-padding: 14px 20px;
          --input-padding: 12px 16px;
          --font-size-base: 14px;
          --touch-target: 44px;
          /* --navbar-height берётся из index.css: 64px desktop / 48px mobile */
        }
        /* Класс вешается на body только пока открыт Chat */
        body.chat-page-active { overflow: hidden !important; touch-action: none !important; overscroll-behavior: none !important; }
        .chat-list-panel { touch-action: pan-y; }
        .chat-list-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
        @media (max-width: 1024px) {
          :root {
            --chat-sidebar-width: 280px;
            --chat-padding: 12px;
            --avatar-size: 40px;
          }
        }
        @media (max-width: 767px) {
          :root {
            --chat-sidebar-width: 100%;
            --chat-padding: 8px;
            --chat-gap: 8px;
            --avatar-size: 36px;
            --header-padding: 12px 16px;
            --input-padding: 10px 12px;
            --font-size-base: 13px;
            --touch-target: 48px;
          }
          .chat-window-panel:not(.active) { display: none !important; }
          .chat-list-panel {
            z-index: 100 !important;
            position: fixed !important;
            top: var(--chat-navbar-h, var(--navbar-height)) !important;
            left: 0 !important; right: 0 !important; bottom: 0 !important;
            height: auto !important; /* сбрасываем инлайн height:100% — размер берётся из top+bottom */
            border-radius: 0 !important;
            transform: translateX(0) !important;
            overscroll-behavior: contain !important;
          }
          .chat-window-panel {
            z-index: 99 !important;
            position: fixed !important;
            top: var(--chat-navbar-h, var(--navbar-height)) !important;
            left: 0 !important; right: 0 !important; bottom: 0 !important;
            height: auto !important; /* то же самое */
            border-radius: 0 !important;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            contain: layout style paint;
          }
          .chat-window-panel.active {
            z-index: 101 !important;
            transform: translateX(0) !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .chat-window-panel.active > div:nth-child(2) {
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .chat-window-panel.active > div:last-child {
            flex-shrink: 0 !important;
            background: rgba(255,255,255,0.02) !important;
            padding-bottom: calc(var(--input-padding) + env(safe-area-inset-bottom)) !important;
            position: relative !important;
            z-index: 10 !important;
            bottom: auto !important;
          }
          .chat-grid { grid-template-columns: 1fr !important; }
          .chat-window-panel.active ~ .chat-list-panel { display: none !important; }
          .mobile-back-btn { display: flex !important; }
          .message-bubble { padding-inline: 12px !important; }
          .message-bubble[data-mine="true"] > div { max-width: 90% !important; }
          .chat-search-input { font-size: 14px !important; padding: 10px 12px 10px 36px !important; }
          .chat-window-panel textarea:focus { font-size: 16px !important; }
        }
        @media (max-width: 360px) {
          :root { --font-size-base: 12px; --touch-target: 44px; }
          .chat-header-title { font-size: 14px !important; }
          .chat-item-name { font-size: 13px !important; }
          .chat-item-preview { font-size: 11px !important; }
        }
        @media (hover: none) and (pointer: coarse) {
          .chat-item, .send-btn, .attach-btn, .mobile-back-btn {
            min-height: var(--touch-target); min-width: var(--touch-target);
          }
          textarea { font-size: 16px !important; }
        }
        .chat-empty-state { display: none; }
        @media (min-width: 768px) { .chat-empty-state { display: flex; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* ref для замера реальной высоты — используется в CSS var --chat-navbar-h */}
          <div ref={navbarRef} style={{ flexShrink: 0 }}>
            <Navbar unreadMessages={totalUnread} spacer={false} isInChat />
          </div>
          <Toast />

          <div className="chat-grid" style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `var(--chat-sidebar-width) 1fr`,
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
            padding: 'var(--chat-padding)',
            gap: 'var(--chat-gap)',
            transition: 'grid-template-columns 0.3s ease',
            minHeight: 0,
            overflow: 'hidden',
          }}>
            <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass chat-list-panel"
                style={{
                  height: '100%', borderRadius: 20, display: 'flex',
                  flexDirection: 'column', overflow: 'hidden', minWidth: 0,
                }}
            >
              <div style={{ padding: 'var(--header-padding)', borderBottom: '1px solid rgba(90, 120, 255,0.1)' }}>
                {/* Заголовок с кнопкой поиска */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: showSearch ? 10 : 0,
                }}>
                  <div style={{
                    fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }} className="chat-header-title">
                    <MessageCircle size={19} style={{ color: '#60A5FA' }} />
                    Чаты
                    {totalUnread > 0 && (
                        <span style={{
                          background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          borderRadius: 999, padding: '2px 7px', marginLeft: 2,
                        }}>
        {totalUnread}
      </span>
                    )}
                  </div>

                  {/* Кнопка поиска */}
                  <button
                      onClick={() => {
                        setShowSearch(!showSearch)
                        if (showSearch) setChatSearch('')
                      }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: showSearch ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: showSearch ? '#60A5FA' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (!showSearch) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      }}
                      onMouseLeave={e => {
                        if (!showSearch) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      }}
                  >
                    {showSearch ? <X size={18} /> : <Search size={18} />}
                  </button>
                </div>

                {/* Поле поиска (показывается/скрывается) */}
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{
                          position: 'absolute', left: 12, top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)',
                          pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            placeholder="Поиск по чатам..."
                            value={chatSearch}
                            onChange={e => setChatSearch(e.target.value)}
                            autoFocus
                            className="chat-search-input"
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 38px',
                              borderRadius: 12,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'var(--text-primary)',
                              fontSize: 14,
                              fontFamily: 'Manrope, sans-serif',
                              outline: 'none',
                              transition: 'all 0.2s',
                            }}
                            onFocus={e => {
                              e.target.style.background = 'rgba(59,130,246,0.08)'
                              e.target.style.borderColor = 'rgba(96,165,250,0.4)'
                            }}
                            onBlur={e => {
                              e.target.style.background = 'rgba(255,255,255,0.05)'
                              e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                            }}
                        />
                      </div>
                    </motion.div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }} className="no-scrollbar chat-list-scroll">
                {chatsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                      <div style={{
                        width: 28, height: 28, border: '2px solid rgba(59,130,246,0.2)',
                        borderTopColor: '#3B82F6', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {chatSearch ? 'Ничего не найдено' : 'Нет чатов'}
                      </div>
                      {!chatSearch && (
                          <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>
                            Добавьте друзей, чтобы начать общение
                          </div>
                      )}
                    </div>
                ) : (
                    filteredChats.map(chat => {
                      const isActive = selectedChat?.interlocutorId === chat.interlocutorId
                      const name = [chat.user?.userName, chat.user?.userSurname].filter(Boolean).join(' ') || 'Пользователь'
                      return (
                          <div
                              key={chat.interlocutorId}
                              onClick={() => handleSelectChat(chat)}
                              className="chat-item"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', cursor: 'pointer',
                                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                          >
                            <Avatar user={chat.user} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                          <span className="chat-item-name" style={{
                            fontSize: 14, fontWeight: 700,
                            color: isActive ? '#60A5FA' : 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {name}
                          </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                            {formatChatDate(chat.lastMessageTime)}
                          </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="chat-item-preview" style={{
                            fontSize: 12, color: 'var(--text-secondary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                          }}>
                            {chat.lastMessage?.trim()
                                ? (chat.lastMessage.length > 38 ? chat.lastMessage.slice(0, 38) + '...' : chat.lastMessage)
                                : chat.lastMessageTime
                                    ? <span style={{ opacity: 0.5 }}>🖼️ Фото</span>
                                    : <span style={{ opacity: 0.5 }}>Сообщений не было</span>
                            }
                          </span>
                                {chat.unreadCount > 0 && (
                                    <span style={{
                                      background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                                      color: '#fff', fontSize: 11, fontWeight: 700,
                                      borderRadius: 999, padding: '2px 6px', minWidth: 20, textAlign: 'center', marginLeft: 6, flexShrink: 0,
                                    }}>
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </span>
                                )}
                              </div>
                            </div>
                          </div>
                      )
                    })
                )}
              </div>
            </motion.div>


            <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass chat-window-panel ${mobileShowChat ? 'active' : ''}`}
                style={{
                  height: '100%', borderRadius: 20, display: 'flex',
                  flexDirection: 'column', overflow: 'hidden', minHeight: 0,
                }}
            >
              {selectedChat ? (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 'var(--header-padding)',
                      borderBottom: '1px solid rgba(90, 120, 255,0.1)',
                      background: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      height: 65
                    }}>
                      <button
                          onClick={() => { setMobileShowChat(false); setSelectedChat(null) }}
                          className="mobile-back-btn"
                          style={{
                            display: 'none', width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)', border: 'none',
                            alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', marginRight: 4,
                          }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <Avatar user={selectedChat.user} size={40} onClick={() => navigate(`/profile?id=${selectedChat.user?.userId}`)} />
                      <div>
                        <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              paddingBottom: 0,
                              display: 'inline-block'
                            }}
                            className="chat-header-title"
                            onClick={() => navigate(`/profile?id=${selectedChat.user?.userId}`)}
                        >
                          {[selectedChat.user?.userName, selectedChat.user?.userSurname]
                              .filter(Boolean).join(' ') || 'Пользователь'}
                        </div>
                      </div>
                    </div>

                    <div ref={messagesContainerRef} style={{
                      flex: 1, overflowY: 'auto', padding: '8px 0',
                      display: 'flex', flexDirection: 'column', minHeight: 0,
                    }} className="no-scrollbar">
                      {messagesLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div style={{
                              width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)',
                              borderTopColor: '#3B82F6', borderRadius: '50%',
                              animation: 'spin 0.7s linear infinite',
                            }} />
                          </div>
                      ) : messages.length === 0 ? (
                          <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', padding: 40,
                          }}>
                            <div style={{
                              width: 64, height: 64, borderRadius: '50%',
                              background: 'rgba(59,130,246,0.08)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                            }}>
                              <MessageCircle size={28} style={{ color: '#60A5FA', opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Начните общение</div>
                            <div style={{ fontSize: 13, opacity: 0.7 }}>Напишите первое сообщение</div>
                          </div>
                      ) : (
                          <>
                            {groupMessagesByDate(messages).map(item =>
                                item.type === 'divider'
                                    ? <DateDivider key={item.key} label={item.label} />
                                    : <MessageBubble
                                        key={item.key}
                                        msg={item.msg}
                                        onImageClick={setSelectedImage}
                                    />
                            )}
                            <div ref={messagesEndRef} />
                          </>
                      )}
                    </div>

                    {files.length > 0 && (
                        <div style={{
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                        }}>
                          <FilePreview files={files} onRemove={removeFile} />
                        </div>
                    )}


                    <div style={{
                      padding: 'var(--input-padding)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'flex-end', gap: 10,
                      flexShrink: 0,
                      position: 'sticky',
                      bottom: 0,
                      zIndex: 10,
                      paddingBottom: 'calc(var(--input-padding) + env(safe-area-inset-bottom))',
                    }}>
                      <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={files.length >= 5}
                          title="Прикрепить фото (макс. 5)"
                          className="attach-btn"
                          style={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: files.length >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)',
                            cursor: files.length >= 5 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', opacity: files.length >= 5 ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (files.length < 5) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                      >
                        <Image size={18} />
                      </button>
                      {/* Кнопка переноса строки — только на мобильных (touch-устройства) */}
                      <button
                          className="mobile-newline-btn"
                          title="Новая строка"
                          onClick={() => {
                            const ta = textareaRef.current
                            if (!ta) return
                            const start = ta.selectionStart
                            const end = ta.selectionEnd
                            const newVal = text.slice(0, start) + '\n' + text.slice(end)
                            setText(newVal)
                            setTimeout(() => {
                              ta.selectionStart = ta.selectionEnd = start + 1
                              ta.style.height = 'auto'
                              ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
                            }, 0)
                          }}
                          style={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            display: 'none', // скрыто по умолчанию, показывается через CSS ниже
                            fontSize: 16, fontWeight: 700,
                          }}
                      >
                        ↵
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple style={{ display: 'none' }} onChange={handleFileChange} />

                      <textarea
                          ref={textareaRef}
                          value={text}
                          onChange={e => setText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Написать..."
                          rows={1}
                          onPaste={e => {
                            const items = e.clipboardData?.items
                            if (!items) return
                            for (const item of items) {
                              if (item.type.startsWith('image/')) {
                                e.preventDefault()
                                const file = item.getAsFile()
                                if (!file) return
                                const { valid, error } = validateImageFile(file, 10)
                                if (!valid) { toast(error); return }
                                if (files.length >= 5) { toast('Максимум 5 файлов'); return }
                                setFiles(prev => [...prev, file])
                              }
                            }
                          }}
                          style={{
                            flex: 1, padding: '10px 14px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Manrope, sans-serif',
                            outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120,
                            overflowY: 'auto', scrollbarWidth: 'none', transition: 'background 0.2s', borderColor: 'rgba(96,165,250,0.5)'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'rgba(59,130,246,0.06)'
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'end' })
                            }, 300)
                          }}
                          onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.05)' }}
                          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                      />

                      <button
                          onClick={handleSend}
                          disabled={sending || (!text.trim() && !files.length)}
                          className="send-btn"
                          style={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            background: (text.trim() || files.length) && !sending
                                ? 'linear-gradient(135deg,#3B82F6,#6366F1)'
                                : 'rgba(255,255,255,0.06)',
                            border: 'none',
                            color: (text.trim() || files.length) && !sending ? '#fff' : 'var(--text-muted)',
                            cursor: (text.trim() || files.length) && !sending ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', transform: 'scale(1)',
                            boxShadow: (text.trim() || files.length) && !sending ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
                          }}
                          onMouseEnter={e => { if ((text.trim() || files.length) && !sending) e.currentTarget.style.transform = 'scale(1.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        {sending
                            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            : <Send size={16} style={{ marginLeft: 2 }} />
                        }
                      </button>
                    </div>
                  </>
              ) : (
                  <div className="chat-empty-state" style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', padding: 40, textAlign: 'center',
                  }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                          width: 88, height: 88, borderRadius: '50%',
                          background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(99,102,241,0.12))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                          border: '1px solid rgba(59,130,246,0.15)',
                        }}
                    >
                      <MessageCircle size={36} style={{ color: '#60A5FA', opacity: 0.7 }} />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
                        Выберите чат
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, maxWidth: 280 }}>
                        Нажмите на любой чат слева, чтобы начать общение
                      </div>
                    </motion.div>
                  </div>
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {selectedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setSelectedImage(null); setScale(1); setPosition({ x: 0, y: 0 })
                      touchStateRef.current = { lastDist: 0, lastScaleOnStart: 1, currentScale: 1, currentPos: { x: 0, y: 0 } }
                    }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.77)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 20,
                      cursor: scale > 1 ? 'grab' : 'zoom-out',
                      overflow: 'hidden',
                    }}
                >
                  {/* Кнопка закрытия ✨ добавлен drop-shadow для иконки */}
                  <button
                      onClick={(e) => {
                        e.stopPropagation(); setSelectedImage(null); setScale(1); setPosition({ x: 0, y: 0 })
                        touchStateRef.current = { lastDist: 0, lastScaleOnStart: 1, currentScale: 1, currentPos: { x: 0, y: 0 } }
                      }}
                      style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(0,0,0,0.2)', /* ✨ лёгкая рамка для структуры */
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(10px)',
                        filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))', /* ✨ чёрная обводка */
                      }}
                  >
                    <X size={24} />
                  </button>

                  {/* Кнопки управления zoom ✨ добавлены тени и рамка */}
                  <div style={{
                    position: 'absolute',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 10,
                    zIndex: 10000,
                    background: 'rgba(255,255,255,0.1)',
                    padding: '8px 12px',
                    borderRadius: 999,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.2)', /* ✨ рамка панели */
                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))', /* ✨ обводка всей панели */
                  }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.25)) }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 700,
                          textShadow: '0 0 4px rgba(0,0,0,0.9)', /* ✨ обводка текста */
                        }}
                    >
                      −
                    </button>
                    <span style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 50,
                      justifyContent: 'center',
                      textShadow: '0 0 4px rgba(0,0,0,0.9)', /* ✨ обводка процентов */
                    }}>
                {Math.round(scale * 100)}%
            </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(5, s + 0.25)) }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 700,
                          textShadow: '0 0 4px rgba(0,0,0,0.9)', /* ✨ обводка текста */
                        }}
                    >
                      +
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({ x: 0, y: 0 }) }}
                        style={{
                          padding: '0 12px',
                          height: 36,
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          textShadow: '0 0 4px rgba(0,0,0,0.9)', /* ✨ обводка текста */
                        }}
                    >
                      Сброс
                    </button>
                  </div>

                  {/* Изображение с zoom и drag */}
                  <motion.img
                      ref={imgRef}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={selectedImage}
                      alt="Full size"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (scale <= 1) {
                          setSelectedImage(null)
                          setScale(1)
                          setPosition({ x: 0, y: 0 })
                          touchStateRef.current = { lastDist: 0, lastScale: 1, lastPos: { x: 0, y: 0 }, touches: [] }
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setScale(s => s > 1 ? 1 : 2.5)
                        setPosition({ x: 0, y: 0 })
                      }}
                      onWheel={(e) => {
                        e.stopPropagation()
                        const delta = e.deltaY > 0 ? -0.15 : 0.15
                        setScale(s => Math.max(0.5, Math.min(5, s + delta)))
                      }}
                      style={{
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        borderRadius: 12,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        cursor: scale > 1 ? 'grab' : 'zoom-out',
                        transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                        transition: isDragging ? 'none' : scale === 1 ? 'transform 0.3s ease' : 'none',
                        userSelect: 'none',
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                      }}
                      onMouseDown={(e) => {
                        if (scale <= 1) return
                        setIsDragging(true)
                        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
                        e.currentTarget.style.cursor = 'grabbing'
                      }}
                      onMouseMove={(e) => {
                        if (!isDragging || scale <= 1) return
                        e.preventDefault()
                        setPosition({
                          x: (e.clientX - dragStart.x),
                          y: (e.clientY - dragStart.y),
                        })
                      }}
                      onMouseUp={(e) => {
                        setIsDragging(false)
                        e.currentTarget.style.cursor = scale > 1 ? 'grab' : 'zoom-out'
                      }}
                      onMouseLeave={() => setIsDragging(false)}
                  />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
  )
}