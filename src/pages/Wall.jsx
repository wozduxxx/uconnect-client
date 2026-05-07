import { useState, useEffect, useCallback, useRef, lazy, Suspense, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Image, X, Globe, Loader2, Trash2, RefreshCw,
  Heart, MessageCircle, ChevronDown, ChevronUp, Edit
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Toast, { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import {
  getWallPosts, createWallPost, deleteWallPost,
  toggleLike, getComments, addComment, deleteComment
} from '../api/wall'
import { resolveAvatarUrl, validateImageFile } from '../utils/fileUtils'
import { useNavigate } from 'react-router-dom'

// ── Утилиты ───────────────────────────────────────────────────────────────
function formatRelativeTime(dateStr) {
  if (!dateStr) return ''

  // 🔥 ВАЖНОЕ ИСПРАВЛЕНИЕ:
  // Сервер отдает дату без 'Z' (например "2026-05-07T08:08:26").
  // JS считает это вашим локальным временем. Мы добавляем 'Z', чтобы JS понял, что это UTC.
  const safeDateStr = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';

  const d = new Date(safeDateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)

  // Компенсация рассинхрона часов (если diff чуть меньше 0)
  if (diff < 0 || diff < 10) return 'только что'
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function getInitials(u, s) {
  return [u?.[0], s?.[0]].filter(Boolean).join('').toUpperCase() || '?'
}

// ── Аватар ────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40, onClick }) {
  const url = resolveAvatarUrl(user?.avatarUrl)
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInitials(user?.userName, user?.userSurname)
      }
    </div>
  )
}

// ── Секция комментариев (lazy-loaded по клику) ────────────────────────────
function CommentsSection({ postId, currentUser, initialCount, onCountChange }) {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 10

  async function load(reset = false) {
    setLoading(true)
    try {
      const offset = reset ? 0 : comments.length
      const data = await getComments(postId, { offset, limit: LIMIT })
      const list = Array.isArray(data) ? data : []
      setComments(prev => reset ? list : [...prev, ...list])
      setHasMore(list.length === LIMIT)
    } catch {
      toast('Ошибка загрузки комментариев')
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  useEffect(() => { load(true) }, [postId])

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      const c = await addComment(postId, text.trim())
      const enriched = { ...c, user: { userId: currentUser.userId, userName: currentUser.userName, userSurname: currentUser.userSurname, avatarUrl: currentUser.avatarUrl } }
      setComments(prev => [...prev, enriched])
      onCountChange(1)
      setText('')
    } catch (err) {
      const msg = err.response?.data || 'Ошибка отправки'
      toast(typeof msg === 'string' ? msg : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId) {
    setComments(prev => prev.filter(c => c.commentId !== commentId))
    onCountChange(-1)
    try {
      await deleteComment(commentId)
    } catch {
      load(true)
    }
  }

  if (!loaded && loading) {
    return (
      <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 2 }}>
      {/* Список */}
      <AnimatePresence initial={false}>
        {comments.map(c => (
            <motion.div
                key={c.commentId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 18px',
                  alignItems: 'flex-start',  // ← Изменили с 'center' на 'flex-start'
                  marginBottom: 5,
                  borderBottom: '1px solid rgba(0,0,0,0.1)',  // ← Добавили разделитель
                }}
            >
              <Avatar
                  user={c.user}
                  size={32}
                  onClick={() => navigate(`/profile?id=${c.user?.userId}`)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Имя пользователя */}
                <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                    onClick={() => navigate(`/profile?id=${c.user?.userId}`)}
                >
                  {[c.user?.userName, c.user?.userSurname].filter(Boolean).join(' ') || 'Пользователь'}
                </div>

                {/* Текст комментария */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px 14px 14px 14px',
                  padding: '8px 0',
                  border: '1px solid rgba(255,255,255,0.07)',
                  marginBottom: 6,
                }}>
                  <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {c.text}
                  </div>
                </div>

                {/* Время */}
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}>
                  {formatRelativeTime(c.createdAt)}
                </div>
              </div>

            {c.userId === currentUser?.userId && (
              <button onClick={() => handleDelete(c.commentId)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 4, marginTop: 8, flexShrink: 0,
                borderRadius: 6, transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={13} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Загрузить ещё */}
      {hasMore && (
        <button onClick={() => load(false)} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 5, margin: '4px 18px 8px',
          background: 'none', border: 'none', color: '#60A5FA', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope,sans-serif',
          padding: 0,
        }}>
          {loading ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <ChevronDown size={13} />}
          Загрузить ещё
        </button>
      )}

      {/* Ввод */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 18px 14px', alignItems: 'center' }}>
        <Avatar user={currentUser} size={32} />
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '6px 8px 6px 14px',
          transition: 'all 0.2s',
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Написать комментарий..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 13,
              fontFamily: 'Manrope,sans-serif',
            }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: text.trim() && !sending ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : 'rgba(255,255,255,0.06)',
            color: text.trim() && !sending ? '#fff' : 'var(--text-muted)',
            cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}>
            {sending
              ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
              : <Send size={13} style={{ marginLeft: 1 }} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Карточка поста ────────────────────────────────────────────────────────
export const WallPost = forwardRef(function WallPost({ post: initialPost, currentUserId, currentUser, onDelete, onImageClick  }, ref) {
  const navigate = useNavigate()
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)
  const [liking, setLiking] = useState(false)
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

  const imageUrl = post.imageUrl
      ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${apiBase}${post.imageUrl}`)
      : null

  const name = [post.user?.userName, post.user?.userSurname].filter(Boolean).join(' ') || 'Пользователь'
  const isOwn = (post.userId ?? post.user?.userId) === currentUserId

  async function handleLike() {
    if (liking) return
    setLiking(true)
    // Оптимистичное обновление
    setPost(p => ({
      ...p,
      isLiked: !p.isLiked,
      likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
    }))
    try {
      const result = await toggleLike(post.postId)
      setPost(p => ({ ...p, isLiked: result.isLiked, likesCount: result.likesCount }))
    } catch {
      // Откат при ошибке
      setPost(p => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
      }))
      toast('Ошибка')
    } finally {
      setLiking(false)
    }
  }

  return (
      <motion.div
          ref={ref} // 👈 Сюда передаётся ref от AnimatePresence
          layout
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
          transition={{ duration: 0.22 }}
          className="glass"
          style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}
      >
        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 12px' }}>
          <Avatar user={post.user} size={42} onClick={() => navigate(`/profile?id=${post.user?.userId}`)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
                onClick={() => navigate(`/profile?id=${post.user?.userId}`)}
                style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'color 0.15s', display: 'inline-block' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = ''}
            >
              {name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {formatRelativeTime(post.createdAt || post.createAt)}
            </div>
          </div>
          {isOwn && (
              <button onClick={() => onDelete(post.postId)} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(239,68,68,0.08)', color: '#F87171',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      title="Удалить пост"
              >
                <Trash2 size={14} />
              </button>
          )}
        </div>

        {/* Текст */}
        {post.text && (
            <div style={{ padding: '0 18px 14px', fontSize: 15, lineHeight: 1.65, wordBreak: 'break-word' }}>
              {post.text}
            </div>
        )}

        {/* Изображение */}
        {imageUrl && (
            <div style={{ padding: '0 18px 14px' }}>
              <img
                  src={imageUrl}
                  alt="post"
                  loading="lazy"
                  onClick={() => onImageClick?.(imageUrl)}  // ← Добавьте это
                  style={{
                    width: '100%', maxHeight: 440, objectFit: 'cover',
                    borderRadius: 14, display: 'block',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',  // ← Добавьте это
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
              />
            </div>
        )}
        {/* Действия: лайк + комментарии */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 14px 12px',
          borderTop: (post.text || imageUrl) ? '1px solid rgba(255,255,255,0.05)' : 'none',
          marginTop: (post.text || imageUrl) ? 0 : -8,
        }}>
          {/* Лайк */}
          <button onClick={handleLike} disabled={liking} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 999, border: 'none',
            background: post.isLiked ? 'rgba(236,72,153,0.12)' : 'transparent',
            color: post.isLiked ? '#F472B6' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'Manrope,sans-serif',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}
                  onMouseEnter={e => { if (!post.isLiked) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!post.isLiked) e.currentTarget.style.background = 'transparent' }}
          >
            <Heart size={16} fill={post.isLiked ? '#F472B6' : 'none'} style={{ transition: 'transform 0.15s', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
            <span>{post.likesCount > 0 ? post.likesCount : ''}</span>
          </button>

          {/* Комментарии */}
          <button onClick={() => setShowComments(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 999, border: 'none',
            background: showComments ? 'rgba(59,130,246,0.1)' : 'transparent',
            color: showComments ? '#60A5FA' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'Manrope,sans-serif',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}
                  onMouseEnter={e => { if (!showComments) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!showComments) e.currentTarget.style.background = showComments ? 'rgba(59,130,246,0.1)' : 'transparent' }}
          >
            <MessageCircle size={16} />
            <span>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
            {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Комментарии — рендерятся только при открытии */}
        <AnimatePresence>
          {showComments && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
              >
                <CommentsSection
                    postId={post.postId}
                    currentUser={currentUser}
                    initialCount={post.commentsCount}
                    onCountChange={delta => setPost(p => ({ ...p, commentsCount: p.commentsCount + delta }))}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  )
})

// ── ComposeBox ────────────────────────────────────────────────────────────
export function ComposeBox({ currentUser, onPost }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    const { valid, error } = validateImageFile(f, 10)
    if (!valid) { toast(error); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  async function handleSend() {
    if (!text.trim() && !file) return
    setSending(true)
    try {
      await onPost({ text, file })
      setText('')
      setFile(null)
      setPreview(null)
    } finally {
      setSending(false)
    }
  }

  const canSend = (text.trim() || file) && !sending

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ borderRadius: 20, padding: 18, marginBottom: 20, minWidth: 303 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar user={currentUser} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && handleSend()}
            placeholder="Что у вас нового?..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'Manrope,sans-serif', outline: 'none',
              resize: 'none', lineHeight: 1.6, maxHeight: 200,
              overflowY: 'auto', scrollbarWidth: 'none',
              transition: 'all 0.2s', boxSizing: 'border-box',
              borderColor: 'rgba(96,165,250,0.3)'
            }}
            onFocus={e => {
              e.target.style.background = 'rgba(59,130,246,0.06)'
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
            }}
            onBlur={e => {
              e.target.style.background = 'rgba(255,255,255,0.05)'
              e.target.style.boxShadow = 'none'
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
          />

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}
              >
                <img src={preview} alt="preview" style={{
                  maxWidth: '100%', maxHeight: 180, borderRadius: 12,
                  objectFit: 'cover', display: 'block',
                  border: '1px solid rgba(255,255,255,0.12)',
                }} />
                <button onClick={() => { setFile(null); setPreview(null) }} style={{
                  position: 'absolute', top: -8, right: -8,
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#EF4444', border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}>
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => fileRef.current?.click()} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 999, border: 'none',
              background: file ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              color: file ? '#60A5FA' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Manrope,sans-serif', transition: 'all 0.2s',
            }}>
              <Image size={15} />
              <span className="wall-btn-label">Фото</span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleSend} disabled={!canSend} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 999, border: 'none',
                background: canSend ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : 'rgba(255,255,255,0.06)',
                color: canSend ? '#fff' : 'var(--text-muted)',
                fontSize: 14, fontWeight: 700,
                cursor: canSend ? 'pointer' : 'not-allowed',
                fontFamily: 'Manrope,sans-serif', transition: 'all 0.2s',
                boxShadow: canSend ? '0 4px 16px rgba(59,130,246,0.35)' : 'none'
              }}
                onMouseEnter={e => { if (canSend) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                {sending ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Edit size={15} />}
                <span>{sending ? 'Публикуем...' : 'Опубликовать'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton (пока грузятся посты) ────────────────────────────────────────
export function PostSkeleton() {
  return (
    <div className="glass" style={{ borderRadius: 20, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 11, width: '25%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ height: 14, width: '90%', borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: 14, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
    </div>
  )
}

// ── Главная страница Wall ─────────────────────────────────────────────────
const LIMIT = 20

export default function Wall() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const offsetRef = useRef(0)
  const loaderRef = useRef(null)
  const navigate = useNavigate()

  // Первоначальная загрузка
  useEffect(() => {
    fetchPosts(true)
  }, [])

  async function fetchPosts(reset = false) {
    if (reset) {
      setLoading(true)
      offsetRef.current = 0
    } else {
      setLoadingMore(true)
    }
    try {
      const data = await getWallPosts({ offset: offsetRef.current, limit: LIMIT })
      const list = Array.isArray(data) ? data : []
      if (reset) {
        setPosts(list)
      } else {
        setPosts(prev => [...prev, ...list])
      }
      offsetRef.current += list.length
      setHasMore(list.length === LIMIT)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      const msg = err.response?.data || 'Ошибка загрузки ленты'
      toast(typeof msg === 'string' ? msg : 'Ошибка загрузки ленты')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchPosts(true)
  }

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        fetchPosts(false)
      }
    }, { threshold: 0.1 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading])

  async function handlePost({ text, file }) {
    try {
      const newPost = await createWallPost({ text, file })
      const enriched = {
        ...newPost,
        user: { userId: user.userId, userName: user.userName, userSurname: user.userSurname, avatarUrl: user.avatarUrl },
        createdAt: newPost.createdAt || new Date().toISOString(),
        likesCount: 0, isLiked: false, commentsCount: 0,
      }
      setPosts(prev => [enriched, ...prev])
      offsetRef.current += 1
      toast('Опубликовано!')
      return newPost
    } catch (err) {
      const msg = err.response?.data || 'Ошибка публикации'
      toast(typeof msg === 'string' ? msg : 'Ошибка публикации')
      throw err
    }
  }

  async function handleDelete(postId) {
    setPosts(prev => prev.filter(p => p.postId !== postId))
    offsetRef.current -= 1
    try {
      await deleteWallPost(postId)
      toast('Пост удалён')
    } catch (err) {
      fetchPosts(true)
      const msg = err.response?.data || 'Ошибка удаления'
      toast(typeof msg === 'string' ? msg : 'Ошибка удаления')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar showLinks />
      <Toast />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 12,
                  background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Globe size={16} style={{ color: '#fff' }} />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Стенка</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginLeft: 2, marginTop: 3 }}>
                Делитесь мыслями со всеми
              </p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              title="Обновить ленту"
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            </button>
          </motion.div>

          {/* Compose */}
          {user && <ComposeBox currentUser={user} onPost={handlePost} />}

          {/* Скелетоны */}
          {loading && [1, 2, 3].map(i => <PostSkeleton key={i} />)}

          {/* Пусто */}
          {!loading && posts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🌐</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Стенка пуста</div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Будьте первым — напишите что-нибудь!</div>
            </motion.div>
          )}

          {/* Лента */}
          {!loading && (
            <AnimatePresence mode="popLayout">
              {posts.map(post => (
                <WallPost
                  key={post.postId}
                  post={post}
                  currentUserId={user?.userId}
                  currentUser={user}
                  onDelete={handleDelete}
                  onImageClick={setSelectedImage}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Infinite scroll anchor */}
          {hasMore && !loading && (
            <div ref={loaderRef} style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', minHeight: 40 }}>
              {loadingMore && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Загрузка...
                </motion.div>
              )}
            </div>
          )}
        </div>
        {/* Модальное окно для просмотра изображений */}
        {selectedImage && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setSelectedImage(null); setScale(1); setPosition({ x: 0, y: 0 }) }}
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
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setScale(1); setPosition({ x: 0, y: 0 }) }}
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
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setScale(s => s < 1 ? 1 : s + 0.5)
                  }}
                  onWheel={(e) => {
                    e.stopPropagation()
                    const delta = e.deltaY > 0 ? -0.1 : 0.1
                    setScale(s => {
                      const newScale = Math.max(0.5, Math.min(5, s + delta))
                      return newScale
                    })
                  }}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    cursor: scale > 1 ? 'grab' : 'zoom-out',
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transition: scale === 1 ? 'transform 0.3s ease' : 'none',
                    userSelect: 'none',
                    touchAction: 'pan-x pan-y',
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
                      x: (e.clientX - dragStart.x) / scale,
                      y: (e.clientY - dragStart.y) / scale,
                    })
                  }}
                  onMouseUp={(e) => {
                    setIsDragging(false)
                    e.currentTarget.style.cursor = 'grab'
                  }}
                  onMouseLeave={() => setIsDragging(false)}
              />
            </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @media (max-width: 480px) {
          .wall-hint { display: none !important; }
          .wall-btn-label { display: none; }
        }
      `}</style>
    </div>
  )
}