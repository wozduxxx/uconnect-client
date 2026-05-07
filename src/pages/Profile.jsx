import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, MapPin, Users, Zap, Sparkles, Edit3, UserPlus, UserCheck, Loader2 } from 'lucide-react'
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

  // Читаем ?id= из URL
  const searchParams = new URLSearchParams(location.search)
  const profileUserId = searchParams.get('id')

  // Адаптивность
  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 400)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function load() {
      setProfileLoading(true)
      try {
        if (profileUserId && currentUser?.userId?.toString() !== profileUserId) {
          setViewingOtherProfile(true)
          const targetId = Number(profileUserId)

          // Параллельная загрузка: профиль + друзья + теги + статус дружбы
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

          // Статус дружбы: проверяем среди своих друзей и отправленных заявок
          const isFriend = myFriendsList.some(f => f.friendInfo?.userId === targetId)
          const hasPending = sentReqs.some(r => r.user?.userId === targetId)

          setIsFriendWithOther(isFriend)
          setFriendRequestSent(hasPending)
        }
        else {
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

    // Загружаем только когда есть currentUser
    if (currentUser) {
      load()
    } else {
      setProfileLoading(false)
    }
  }, [profileUserId, currentUser?.userId])

  async function handleAddFriend() {
    if (!profileUserId) return
    setFriendRequestSent(true)
    try {
      const msg = await bidFriend(Number(profileUserId))
      toast(msg || 'Заявка отправлена')
      // Если мгновенно стали друзьями (была обратная заявка)
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

      // Имя и фамилия
      if (updated.name) {
        const parts = updated.name.trim().split(' ')
        fd.append('UserName', parts[0] || '')
        fd.append('UserSurname', parts.slice(1).join(' ') || '')
      }

      // Описание
      if (updated.bio) fd.append('UserDescription', updated.bio)

      // Аватар
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
        <Navbar showLinks />
        <Toast />

        {/* EditProfileModal — рендерим ТОЛЬКО для своего профиля И ТОЛЬКО когда profile определён */}
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
                {/* Аватар */}
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
                        <Button variant="ghost" disabled style={{ padding: '8px 18px', fontSize: 13 }}>
                          Заявка отправлена
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAddFriend}
                            style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <UserPlus size={13} /> Добавить в друзья
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
                        Посмотреть всех <ChevronRight size={13} />
                      </div>
                  )}
                </div>

                {(viewingOtherProfile ? otherFriends : friends).length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
                      Пока нет друзей
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
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
  )
}