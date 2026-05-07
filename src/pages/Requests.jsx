import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import Toast, { toast } from '../components/Toast'
import Button from '../components/Button'
import { getMyFriends, getMyRequests, acceptFriendRequest, rejectFriendRequest } from '../api/friends'
import { resolveAvatarUrl } from '../utils/fileUtils'
import { sendMessage } from '../api/messages'
import { useNavigate } from 'react-router-dom'

export default function Requests() {
  const navigate = useNavigate()

  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [reqData, friendData] = await Promise.all([
          getMyRequests(),
          getMyFriends(),
        ])
        setRequests(reqData)
        setFriends(friendData.map(f => f.friendInfo).filter(Boolean))
      } catch (err) {
        const msg = err.response?.data || 'Ошибка загрузки'
        toast(typeof msg === 'string' ? msg : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleAccept(req) {
    setActionLoading(prev => ({ ...prev, [req.fromUserId]: 'accept' }))
    try {
      await acceptFriendRequest(req.fromUserId)
      await sendMessage({
        receiverId: req.fromUserId,
        message: "Привет, я принял твою заявку!",
      })
      toast(`Вы теперь друзья!`)
      setRequests(prev => prev.filter(r => r.fromUserId !== req.fromUserId))
      // Добавляем в список друзей
      setFriends(prev => [...prev, { userId: req.fromUserId, ...req.user }])
    } catch (err) {
      const msg = err.response?.data || 'Ошибка'
      toast(typeof msg === 'string' ? msg : 'Ошибка')
    } finally {
      setActionLoading(prev => ({ ...prev, [req.fromUserId]: null }))
    }
  }

  async function handleReject(req) {
    setActionLoading(prev => ({ ...prev, [req.fromUserId]: 'reject' }))
    try {
      await rejectFriendRequest(req.fromUserId)
      toast('Заявка отклонена')
      setRequests(prev => prev.filter(r => r.fromUserId !== req.fromUserId))
    } catch (err) {
      const msg = err.response?.data || 'Ошибка'
      toast(typeof msg === 'string' ? msg : 'Ошибка')
    } finally {
      setActionLoading(prev => ({ ...prev, [req.fromUserId]: null }))
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 12,
    fontSize: 14, fontWeight: 700,
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
    color: active ? '#3B82F6' : 'var(--text-secondary)',
    cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar showLinks />
      <Toast />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 24px 40px' }}>

          {/* Вкладки */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 8, marginBottom: 24 }}
          >
            <button style={tabStyle(tab === 'requests')} onClick={() => setTab('requests')}>
              Входящие запросы {requests.length > 0 && <span style={{
                marginLeft: 6, background: '#3B82F6', color: '#fff',
                borderRadius: 999, padding: '1px 7px', fontSize: 11,
              }}>{requests.length}</span>}
            </button>
            <button style={tabStyle(tab === 'friends')} onClick={() => setTab('friends')}>
              <Users size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Мои друзья ({friends.length})
            </button>
          </motion.div>

          {/* Спиннер загрузки */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Вкладка: Входящие запросы ───────────────────────────────────── */}
          {!loading && tab === 'requests' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Входящих запросов: <strong style={{ color: 'var(--text-primary)' }}>{requests.length}</strong>
              </div>

              {requests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Нет входящих запросов</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Когда кто-то пришлёт заявку — она появится здесь</div>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                >
                  {requests.map(req => {
                    const avatarUrl = resolveAvatarUrl(req.user?.avatarUrl)
                    const name = [req.user?.userName, req.user?.userSurname].filter(Boolean).join(' ') || `Пользователь #${req.fromUserId}`
                    const initials = [req.user?.userName?.[0], req.user?.userSurname?.[0]].filter(Boolean).join('').toUpperCase()
                    const isActing = !!actionLoading[req.fromUserId]

                    return (
                      <motion.div
                        key={req.requestId}
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        className="glass"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '16px 20px', borderRadius: 16, marginBottom: 12,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/profile?id=${req.fromUserId}`)}
                      >
                        {/* Аватар */}
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700, color: '#fff', overflow: 'hidden',
                        }}>
                          {avatarUrl
                            ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials
                          }
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 15,
                            fontWeight: 700,
                            minWidth: 0,
                            overflowWrap: 'break-word'}}>
                            {name}
                          </div>

                          {req.createAt && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                {new Date(req.createAt).toLocaleDateString('ru-RU')}
                              </div>
                          )}
                        </div>

                        {/* Действия */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => handleAccept(req)}
                            disabled={isActing}
                            style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: isActing ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.12)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: '#10B981', cursor: isActing ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s', opacity: isActing ? 0.5 : 1,
                            }}
                            title="Принять"
                          >
                            <Check size={16} />

                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isActing}
                            style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: isActing ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.25)',
                              color: '#F87171', cursor: isActing ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s', opacity: isActing ? 0.5 : 1,
                            }}
                            title="Отклонить"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </>
          )}

          {/* ── Вкладка: Список друзей ──────────────────────────────────────── */}
          {!loading && tab === 'friends' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Друзей: <strong style={{ color: 'var(--text-primary)' }}>{friends.length}</strong>
              </div>

              {friends.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Пока нет друзей</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    <span
                      onClick={() => navigate('/search')}
                      style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Найдите людей
                    </span>{' '}и отправьте им запрос
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                >
                  {/* API INTEGRATION: реальный список друзей */}
                  {friends.map(friend => {
                    const avatarUrl = resolveAvatarUrl(friend.avatarUrl)
                    const name = [friend.userName, friend.userSurname].filter(Boolean).join(' ') || `Пользователь #${friend.userId}`
                    const initials = [friend.userName?.[0], friend.userSurname?.[0]].filter(Boolean).join('').toUpperCase()

                    return (
                      <motion.div
                        key={friend.userId}
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        className="glass"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '16px 20px', borderRadius: 16, marginBottom: 12,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/profile?id=${friend.userId}`)}
                      >
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700, color: '#fff', overflow: 'hidden',
                        }}>
                          {avatarUrl
                            ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 15,
                            fontWeight: 700,
                            minWidth: 0,
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'normal'
                          }}>
                            {name}
                          </div>
                        </div>
                        <div onClick={() => navigate(`/chat`)} style={{
                          padding: '5px 12px', borderRadius: 999,
                          background: 'rgba(16,185,129,0.1)', color: '#10B981',
                          fontSize: 12, fontWeight: 600,
                          border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                          В друзьях
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  )
}
