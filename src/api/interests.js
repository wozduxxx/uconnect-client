import api from './axios'

/**
 * Получить все категории с тегами
 * @returns {Promise<Array<{ categoryId: number, categoryName: string, tags: Array<{ tagId: number, tagName: string }> }>>}
 */
export async function getTags() {
  const res = await api.get('/interests/GetTags')
  return res.data
}

/**
 * Сохранить теги пользователя (полная замена старых)
 * @param {Array<{ tagId: number, level: string }>} tags - массив тегов с уровнем владения
 * @returns {Promise<string>} Сообщение от сервера
 */
export async function addTags(tags) {
  const res = await api.post('/interests/addTags', { tags })
  return res.data
}

/**
 * Поиск пользователей по тегам
 * @param {number[]} tagsId - массив ID тегов для поиска
 *                           если пустой → поиск по тегам текущего пользователя
 * @returns {Promise<Array<{ userId: number, userName: string, userSurname: string, avatarUrl: string, count: number }>>}
 */
export async function searchByUserTags(tagsId = []) {
  const res = await api.post('/interests/searchByUserTags', { tagsId })
  return res.data
}

/**
 * Получить теги конкретного пользователя по ID
 * @param {number} userId
 * @returns {Promise<Array<{ tagId: number, level: string, tagName: string, categoryName: string }>>}
 */
export async function getUserTags(userId) {
  const res = await api.get('/interests/GetUserTags', { params: { userId } })
  return res.data
}

/**
 * Получить свои теги (обёртка над getUserTags для удобства)
 * @param {number} userId - ID текущего пользователя (из AuthContext)
 * @returns {Promise<Array<{ tagId: number, level: string, tagName: string, categoryName: string }>>}
 */
export async function getMyTags(userId) {
  if (!userId) {
    return []
  }
  return getUserTags(userId)
}