import api from './axios'

export async function bidFriend(friendId) {
  const res = await api.post('/friend_request/BidFriend', { FriendId: friendId })
  return res.data
}

export async function acceptFriendRequest(friendId) {
  const res = await api.post('/friend_request/AcceptedFriendRequest', { FriendId: friendId })
  return res.data
}

export async function rejectFriendRequest(friendId) {
  const res = await api.post('/friend_request/RejectedFriendRequest', { FriendId: friendId })
  return res.data
}

export async function getMyRequests() {
  const res = await api.get('/friend_request/GetMyRequests')
  return res.data
}

export async function getMyFriends() {
  const res = await api.get('/friend_request/GetMyFriends')
  return res.data
}

export async function getUserFriends(userId) {
  const res = await api.get(`/friend_request/GetUserFriends/${userId}`)
  return res.data
}

export async function getSentRequests() {
  const res = await api.get('/friend_request/GetSentRequests')
  return res.data
}

export async function getPendingRequestIds() {
  const res = await api.get('/friend_request/GetSentRequests')
  return new Set(res.data.map(r => r.user?.userId).filter(Boolean))
}