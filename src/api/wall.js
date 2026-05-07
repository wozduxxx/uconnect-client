import api from './axios'

export async function getWallPosts({ offset = 0, limit = 20 } = {}) {
  const res = await api.get('/wall/GetPosts', { params: { offset, limit } })
  return res.data
}

export async function createWallPost({ text, file }) {
  const fd = new FormData()
  if (text?.trim()) fd.append('Text', text.trim())
  if (file) fd.append('Image', file)
  const res = await api.post('/wall/CreatePost', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteWallPost(postId) {
  const res = await api.delete(`/wall/DeletePost/${postId}`)
  return res.data
}

/** @returns {Promise<{ isLiked: boolean, likesCount: number }>} */
export async function toggleLike(postId) {
  const res = await api.post(`/wall/ToggleLike/${postId}`)
  return res.data
}

export async function getComments(postId, { offset = 0, limit = 20 } = {}) {
  const res = await api.get(`/wall/GetComments/${postId}`, { params: { offset, limit } })
  return res.data
}

export async function addComment(postId, text) {
  const res = await api.post(`/wall/AddComment/${postId}`, { text })
  return res.data
}

export async function deleteComment(commentId) {
  const res = await api.delete(`/wall/DeleteComment/${commentId}`)
  return res.data
}

export async function getUserPosts(userId, { offset = 0, limit = 20 } = {}) {
  const res = await api.get(`/wall/GetUserPosts/${userId}`, { params: { offset, limit } })
  return res.data
}