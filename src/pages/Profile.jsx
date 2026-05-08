import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {ChevronRight, MapPin, Users, Zap, Sparkles, Edit3, UserPlus, UserCheck, Loader2, Globe, X} from 'lucide-react'
import Navbar from '../components/Navbar'
import Tag from '../components/Tag'
import Button from '../components/Button'
import Toast, { toast } from '../components/Toast'
import EditProfileModal from '../components/EditProfileModal'
import { useAuth } from '../context/AuthContext'
import { updateProfile, getUserById } from '../api/users'
import { getMyFriends, getUserFriends, bidFriend, getSentRequests } from '../api/friends'
import { getUserTags } from '../api/interests'
import { resolveAvatarUrl, validateImageFile } from '../utils/fileUtils'
// Импорт компонентов стенки и API
import { WallPost, ComposeBox, PostSkeleton } from './Wall'
import { getUserPosts, createWallPost, deleteWallPost } from '../api/wall'

const TAG_COLORS = ['tag-blue', 'tag-purple', 'tag-green', 'tag-pink', 'tag-yellow', 'tag-teal']
function getTagColor(name) {
  if (!name) return 'tag-blue'
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return TAG_COLORS[sum % TAG_COLORS.length]
}

export default function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser, refreshProfile } = useAuth()

  const [selectedImage, setSelectedImage] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Состояния для своего профиля
  const [editOpen, setEditOpen] = useState(false)
  const [friends, setFriends] = useState([])
  const [userTags, setUserTags] = useState([])

  // Состояния для чужого профиля
  const [viewingOtherProfile, setViewingOtherProfile] = useState(false)
  const [otherProfileData, setOtherProfileData] = useState(null)
  const [otherFriends, setOtherFriends] = useState([])
  const [otherTags, setOtherTags] = useState([])
  const [isFriendWithOther, setIsFriendWithOther] = useState(false)
  const [friendRequestSent, setFriendRequestSent] = useState(false)

  // Глобальный лоадер
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSmall, setIsSmall] = useState(false)


  const [userPosts, setUserPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postOffset, setPostOffset] = useState(0)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const POST_LIMIT = 10

  // Читаем ?id= из URL
  const searchParams = new URLSearchParams(location.search)
  const profileUserId = searchParams.get('id')

  const imgRef = useRef(null)
  const touchStateRef = useRef({ lastDist: 0, lastScale: 1, lastPos: { x: 0, y: 0 }, touches: [] })

  // Адаптивность
  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 400)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!selectedImage) return

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

  // Загрузка профиля
  useEffect(() => {
    async function load() {
      setProfileLoading(true)
      try {
        if (profileUserId && currentUser?.userId?.toString() !== profileUserId) {
          setViewingOtherProfile(true)
          const targetId = Number(profileUserId)
          const [otherProfile, otherFriendsList, otherTagsList, myFriendsList, sentReqs] = await Promise.all([
            getUserById(targetId),
            getUserFriends(targetId),
            getUserTags(targetId),
            getMyFriends(),
            getSentRequests()
          ])

          setOtherProfileData(otherProfile)
          setOtherFriends(otherFriendsList.map(f => f.friendInfo).filter(Boolean))
          setOtherTags(otherTagsList || [])

          const isFriend = myFriendsList.some(f => f.friendInfo?.userId === targetId)
          const hasPending = sentReqs.some(r => r.user?.userId === targetId)

          setIsFriendWithOther(isFriend)
          setFriendRequestSent(hasPending)
        } else {
          setViewingOtherProfile(false)
          setOtherProfileData(null)

          const [friendsData, myTagsData] = await Promise.all([
            getMyFriends(),
            currentUser?.userId ? getUserTags(currentUser.userId) : Promise.resolve([])
          ])

          setFriends(friendsData.map(f => f.friendInfo).filter(Boolean))
          setUserTags(myTagsData || [])
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки профиля:', err)
        const msg = err.response?.data || 'Ошибка загрузки профиля'
        toast(typeof msg === 'string' ? msg : 'Ошибка загрузки профиля')
      } finally {
        setProfileLoading(false)
      }
    }

    if (currentUser) {
      load()
    } else {
      setProfileLoading(false)
    }
  }, [profileUserId, currentUser?.userId])


  useEffect(() => {
    if (profileLoading) return
    const targetId = viewingOtherProfile ? profileUserId : currentUser?.userId
    if (!targetId) return

    async function loadPosts() {
      setPostsLoading(true)
      setPostOffset(0)
      try {
        const data = await getUserPosts(targetId, { offset: 0, limit: POST_LIMIT })
        const list = Array.isArray(data) ? data : []
        setUserPosts(list)
        setPostOffset(list.length)
        setHasMorePosts(list.length === POST_LIMIT)
      } catch (err) {
        console.error('Ошибка загрузки постов:', err)
      } finally {
        setPostsLoading(false)
      }
    }
    loadPosts()
  }, [profileUserId, currentUser?.userId, viewingOtherProfile, profileLoading])

  async function handleAddFriend() {
    if (!profileUserId) return
    setFriendRequestSent(true)
    try {
      const msg = await bidFriend(Number(profileUserId))
      toast(msg || 'Заявка отправлена')
      if (msg?.includes('друзья')) {
        setIsFriendWithOther(true)
        setFriendRequestSent(false)
      }
    } catch (err) {
      setFriendRequestSent(false)
      const msg = err.response?.data || 'Ошибка отправки заявки'
      toast(typeof msg === 'string' ? msg : 'Ошибка отправки заявки')
    }
  }

  async function handleSave(updated) {
    try {
      const fd = new FormData()
      if (updated.name) {
        const parts = updated.name.trim().split(' ')
        fd.append('UserName', parts[0] || '')
        fd.append('UserSurname', parts.slice(1).join(' ') || '')
      }
      if (updated.bio) fd.append('UserDescription', updated.bio)
      if (updated.avatarFile) {
        const { valid, error } = validateImageFile(updated.avatarFile, 5)
        if (!valid) { toast(error); return }
        fd.append('UserAvatar', updated.avatarFile)
      }
      if (updated.bannerFile) {
        const { valid, error } = validateImageFile(updated.bannerFile, 5)
        if (!valid) { toast(error); return }
        fd.append('UserBaner', updated.bannerFile)
      }
      await updateProfile(fd)
      toast('Профиль обновлён')
      await refreshProfile()
    } catch (err) {
      const msg = err.response?.data || 'Ошибка обновления'
      toast(typeof msg === 'string' ? msg : 'Ошибка обновления')
    }
  }


  async function handleCreatePost({ text, file }) {
    const newPost = await createWallPost({ text, file })
    const enriched = {
      ...newPost,
      user: { userId: currentUser.userId, userName: currentUser.userName, userSurname: currentUser.userSurname, avatarUrl: currentUser.avatarUrl },
      createdAt: newPost.createdAt || new Date().toISOString(),
      likesCount: 0, isLiked: false, commentsCount: 0,
    }
    setUserPosts(prev => [enriched, ...prev])
    setPostOffset(prev => prev + 1)
    toast('Опубликовано!')
  }

  async function handleDeletePost(postId) {
    setUserPosts(prev => prev.filter(p => p.postId !== postId))
    setPostOffset(prev => prev - 1)
    try { await deleteWallPost(postId) } catch { /* fallback handled by UI */ }
  }

  async function loadMorePosts() {
    const targetId = viewingOtherProfile ? profileUserId : currentUser?.userId
    if (!targetId) return
    try {
      const data = await getUserPosts(targetId, { offset: postOffset, limit: POST_LIMIT })
      const list = Array.isArray(data) ? data : []
      setUserPosts(prev => [...prev, ...list])
      setPostOffset(prev => prev + list.length)
      setHasMorePosts(list.length === POST_LIMIT)
    } catch (err) {
      toast('Ошибка загрузки постов')
    }
  }

  const profile = !profileLoading && !viewingOtherProfile && currentUser ? {
    name: [currentUser.userName, currentUser.userSurname].filter(Boolean).join(' ') || 'Пользователь',
    location: '',
    bio: currentUser.userDescription || '',
    avatarUrl: resolveAvatarUrl(currentUser.avatarUrl),
    avatarPreview: resolveAvatarUrl(currentUser.avatarUrl),
    avatarIsImage: !!currentUser.avatarUrl,
    bannerUrl: resolveAvatarUrl(currentUser.userBaner),
  } : null

  const otherProfile = !profileLoading && viewingOtherProfile && otherProfileData ? {
    name: [otherProfileData.userName, otherProfileData.userSurname].filter(Boolean).join(' ') || 'Пользователь',
    location: '',
    bio: otherProfileData.userDescription || '',
    avatarUrl: resolveAvatarUrl(otherProfileData.avatarUrl),
    avatarPreview: resolveAvatarUrl(otherProfileData.avatarUrl),
    avatarIsImage: !!otherProfileData.avatarUrl,
    bannerUrl: resolveAvatarUrl(otherProfileData.userBaner),
  } : null

  const initials = viewingOtherProfile && otherProfileData
      ? [otherProfileData.userName?.[0], otherProfileData.userSurname?.[0]].filter(Boolean).join('').toUpperCase()
      : [currentUser?.userName?.[0], currentUser?.userSurname?.[0]].filter(Boolean).join('').toUpperCase()

  if (profileLoading) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <Loader2 size={40} style={{ animation: 'spin 0.7s linear infinite', color: '#3B82F6' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
  }

  const activeProfile = viewingOtherProfile ? otherProfile : profile
  if (!activeProfile) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Профиль не найден
        </div>
    )
  }

  return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <Navbar />
        <Toast />

        {!viewingOtherProfile && profile && (
            <EditProfileModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                profile={profile}
                onSave={handleSave}
            />
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Banner */}
          <div style={{
            height: 200,
            background: activeProfile.bannerUrl
                ? `url(${activeProfile.bannerUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg,#0f2150 0%,#1e3a8a 40%,#4c1d95 100%)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg...")`,
            }} />
          </div>

          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px 60px' }}>
            {/* Profile header */}
            <motion.div
                key={viewingOtherProfile ? `other-${profileUserId}` : 'my-profile'}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ borderRadius: 24, padding: '0 28px 24px', marginTop: -60, position: 'relative', zIndex: 2, minWidth: 300 }}

            >
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      width: 96, height: 96, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: activeProfile.avatarIsImage ? 0 : 32,
                      fontWeight: 700, color: '#fff',
                      border: '3px solid rgba(255,255,255,0.8)',
                      marginTop: -48, flexShrink: 0,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      cursor: activeProfile.avatarIsImage ? 'pointer' : 'default',
                      transition: 'transform 0.2s',
                    }}
                    whileHover={activeProfile.avatarIsImage ? { scale: 1.05 } : {}}
                    onClick={() => {
                      if (activeProfile.avatarIsImage) {
                        setSelectedImage(activeProfile.avatarUrl)
                      }
                    }}
                >
                  {activeProfile.avatarIsImage
                      ? <img src={activeProfile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (initials || '👤')
                  }
                </motion.div>

                {viewingOtherProfile ? (
                    isFriendWithOther ? (
                        <Button onClick={() => navigate('/chat')} variant="green" style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Edit3 size={13} /> Написать
                        </Button>
                    ) : friendRequestSent ? (
                        <Button variant="purple" disabled style={{ padding: '8px 18px', fontSize: 13 }} >
                          {isSmall ? 'Отправлено' : 'Заявка отправлена'}
                        </Button >
                    ) : (
                        <Button
                            onClick={handleAddFriend}
                            style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <UserPlus size={13} /> {isSmall ? 'Добавить' : 'Добавить в друзья'}
                        </Button>
                    )
                ) : (
                    <Button
                        onClick={() => setEditOpen(true)}
                        style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Edit3 size={13} />
                      {isSmall ? 'Изменить' : 'Изменить профиль'}
                    </Button>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, overflowWrap: 'break-word' }}>
                  {activeProfile.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                  {activeProfile.location && (
                      <>
                        <MapPin size={12} />
                        <span>{activeProfile.location}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                      </>
                  )}
                </div>
              </div>

              {activeProfile.bio && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 520, marginBottom: 20 }}>
                    {activeProfile.bio}
                  </p>
              )}

              {/* Статистика */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                {[
                  {
                    num: viewingOtherProfile ? otherFriends.length : friends.length,
                    label: 'Друзей',
                    icon: <Users size={14} />,
                  },
                  {
                    num: viewingOtherProfile ? otherTags.length : userTags.length,
                    label: 'Тегов',
                    icon: <Zap size={14} />,
                  },
                ].map((s, i) => (
                    <div key={s.label} style={{
                      flex: 1, textAlign: 'center',
                      borderRight: i < 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      padding: '4px 0',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{s.num}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {s.icon}{s.label}
                      </div>
                    </div>
                ))}
              </div>
            </motion.div>

            {/* Body grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16, marginTop: 16,
            }}>
              {/* Друзья */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass"
                  style={{ padding: 20, borderRadius: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Друзья</div>
                  {!viewingOtherProfile && (
                      <div
                          onClick={() => navigate('/requests')}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                          className="hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Посмотреть заявки  <ChevronRight size={13} />
                      </div>
                  )}
                </div>

                {(viewingOtherProfile ? otherFriends : friends).length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
                      Пока нет друзей. {viewingOtherProfile ? '' : <span
                        onClick={() => navigate('/interests')}
                        style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                    >
                                                В поиск!
                                            </span>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(viewingOtherProfile ? otherFriends : friends).slice(0, 6).map(friend => {
                        const friendAvatarUrl = resolveAvatarUrl(friend.avatarUrl)
                        const friendName = [friend.userName, friend.userSurname].filter(Boolean).join(' ')
                        const friendInitials = [friend.userName?.[0], friend.userSurname?.[0]].filter(Boolean).join('').toUpperCase()
                        return (
                            <div
                                key={friend.userId}
                                onClick={() => navigate(`/profile?id=${friend.userId}`)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '9px 10px', borderRadius: 12, cursor: 'pointer',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                                overflow: 'hidden',
                              }}>
                                {friendAvatarUrl
                                    ? <img src={friendAvatarUrl} alt={friendName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : friendInitials
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{friendName}</div>
                              </div>
                              <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        )
                      })}
                    </div>
                )}
              </motion.div>

              {/* Теги / Интересы и навыки */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass"
                  style={{ padding: 20, borderRadius: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <Sparkles size={15} style={{ color: '#A78BFA' }} />
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Интересы и навыки</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {(viewingOtherProfile ? otherTags : userTags).map(t => (
                      <Tag key={t.tagId || t.TagId} label={t.tagName || t.TagName} variant={getTagColor(t.tagName || t.TagName)} />
                  ))}
                  {(viewingOtherProfile ? otherTags : userTags).length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {viewingOtherProfile
                            ? 'Интересы не добавлены'
                            : <>Интересы не добавлены.{' '}
                              <span
                                  onClick={() => navigate('/interests')}
                                  style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                              >
                                                    Добавить
                                                </span>
                            </>
                        }
                      </div>
                  ) : (
                      !viewingOtherProfile && (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5, marginLeft: 3 }}>
                                            <span
                                                onClick={() => navigate('/interests')}
                                                style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Изменить
                                            </span>
                          </div>
                      )
                  )}
                </div>
              </motion.div>
            </div>


              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 16, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={20} style={{ color: '#60A5FA' }} />
                {viewingOtherProfile ? 'Публикации' : 'Мои публикации'}
              </div>

              {/* Compose Box (только для своего профиля) */}
              {!viewingOtherProfile && currentUser && (
                  <ComposeBox currentUser={currentUser} onPost={handleCreatePost} />
              )}

              {/* Состояния загрузки / пустоты / списка */}
              {postsLoading ? (
                  [1, 2].map(i => <PostSkeleton key={i} />)
              ) : userPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {viewingOtherProfile ? 'У пользователя пока нет публикаций' : 'У вас пока нет публикаций. Напишите что-нибудь!'}
                  </div>
              ) : (
                  <>
                    {userPosts.map(post => (
                        <WallPost
                            key={post.postId}
                            post={post}
                            currentUserId={currentUser?.userId}
                            currentUser={currentUser}
                            onDelete={handleDeletePost}
                            onImageClick={setSelectedImage}
                        />
                    ))}
                    {hasMorePosts && (
                        <button
                            onClick={loadMorePosts}
                            style={{
                              width: '100%', padding: '10px', marginTop: 12,
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 12, color: '#60A5FA', fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        >
                          Загрузить ещё
                        </button>
                    )}
                  </>
              )}
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
          </div>


          <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 480px) {
    .wall-btn-label { display: none !important; }
    .wall-hint { display: none !important; }
  }
`}</style>
        </div>

      </div>
  )
}