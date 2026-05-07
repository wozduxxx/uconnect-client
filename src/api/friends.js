import api from './axios'

/**
 * Отправить заявку в друзья
 * @param {number} friendId
 * @returns {Promise<string>}
 */
export async function bidFriend(friendId) {
  const res = await api.post('/friend_request/BidFriend', { FriendId: friendId })
  return res.data
}

/**
 * Принять входящую заявку
 * @param {number} friendId
 * @returns {Promise<string>}
 */
export async function acceptFriendRequest(friendId) {
  const res = await api.post('/friend_request/AcceptedFriendRequest', { FriendId: friendId })
  return res.data
}

/**
 * Отклонить входящую заявку
 * @param {number} friendId
 * @returns {Promise<string>}
 */
export async function rejectFriendRequest(friendId) {
  const res = await api.post('/friend_request/RejectedFriendRequest', { FriendId: friendId })
  return res.data
}

/**
 * Входящие pending-заявки (вам)
 * @returns {Promise<Array<{ requestId, fromUserId, user: { userId, userName, userSurname, avatarUrl }, createAt }>>}
 */
export async function getMyRequests() {
  const res = await api.get('/friend_request/GetMyRequests')
  return res.data
}

/**
 * Список ваших друзей
 * @returns {Promise<Array<{ friendInfo: { userId, userName, userSurname, avatarUrl } }>>}
 */
export async function getMyFriends() {
  const res = await api.get('/friend_request/GetMyFriends')
  return res.data
}

/**
 * Список друзей другого пользователя
 * @param {number} userId
 * @returns {Promise<Array<{ friendInfo: { userId, userName, userSurname, avatarUrl } }>>}
 */
export async function getUserFriends(userId) {
  const res = await api.get(`/friend_request/GetUserFriends/${userId}`)
  return res.data
}

/**
 * Ваши исходящие pending-заявки (отправленные вами)
 * @returns {Promise<Array<{ requestId, fromUserId, user: { userId, userName, userSurname, avatarUrl }, createAt }>>}
 */
export async function getSentRequests() {
  const res = await api.get('/friend_request/GetSentRequests')
  return res.data
}

/**
 * Получить Set ID пользователей, которым вы отправили заявки (pending)
 * Используется в Search.jsx для мгновенной проверки статуса кнопки
 * @returns {Promise<Set<number>>}
 */
export async function getPendingRequestIds() {
  const res = await api.get('/friend_request/GetSentRequests')
  // Бэкенд теперь возвращает { user: { userId, ... }, ... }
  return new Set(res.data.map(r => r.user?.userId).filter(Boolean))
}