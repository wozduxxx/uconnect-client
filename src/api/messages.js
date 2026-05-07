import api from './axios'
import { getUserById } from './users'

/**
 * Отправить сообщение (только друзьям)
 * @param {{ receiverId: number, message: string, files?: File[] }} dto
 * @returns {Promise<string>}
 */
export async function sendMessage({ receiverId, message, files = [] }) {
  const fd = new FormData()
  fd.append('ReceiverId', receiverId)
  fd.append('Message', message)
  files.forEach(f => fd.append('Files', f))
  const res = await api.post('/messages/SendMessage', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * История сообщений с пользователем
 * @param {number} receiverId
 * @param {{ offset?: number, limit?: number }} opts
 * @returns {Promise<Array<{ messageId, senderId, messageText, createAt, isRead, isMine }>>}
 */
export async function getChatHistory(receiverId, { offset = 0, limit = 50 } = {}) {
  const res = await api.get(`/messages/GetChatHistory/${receiverId}`, {
    params: { offset, limit },
  })
  return res.data
}

/**
 * Список всех чатов пользователя
 * @returns {Promise<Array<{ interlocutorId, lastMessage, lastMessageTime, unreadCount, user: { userName, userSurname, avatarUrl } }>>}
 */
export async function getMyChats() {
  const res = await api.get('/messages/GetMyChats')
  return res.data
}

/**
 * Обогатить список чатов данными собеседников
 * @param {Array<{ interlocutorId, lastMessage, lastMessageTime, unreadCount }>} chats
 * @returns {Promise<Array<{ interlocutorId, lastMessage, lastMessageTime, unreadCount, user: { userId, userName, userSurname, avatarUrl } }>>}
 */
export async function enrichChatsWithUserInfo(chats) {
  // Делаем запросы параллельно для скорости
  const enriched = await Promise.all(
      chats.map(async (chat) => {
        try {
          // Если бэкенд уже вернул user — пропускаем запрос
          if (chat.user) return chat

          // Запрашиваем данные собеседника по ID
          const user = await getUserById(chat.interlocutorId)
          return { ...chat, user }
        } catch (err) {
          // Возвращаем чат как есть, чтобы не ломать весь список
          return chat
        }
      })
  )
  return enriched
}
