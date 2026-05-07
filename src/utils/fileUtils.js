/**
 * Допустимые расширения для аватаров/изображений
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']

/**
 * Проверяет файл изображения по расширению и размеру
 * @param {File} file
 * @param {number} maxSizeMB - максимальный размер в МБ (по умолчанию 5)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, maxSizeMB = 5) {
  if (!file) return { valid: true }

  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Недопустимый формат файла. Разрешены: ${IMAGE_EXTENSIONS.join(', ')}` }
  }

  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return { valid: false, error: `Файл слишком большой. Максимум ${maxSizeMB} МБ` }
  }

  return { valid: true }
}

/**
 * Формирует URL для аватара, полученного с бэкенда (относительный путь → абсолютный)
 * @param {string|null} avatarUrl - например "/avatars/guid.jpg"
 * @returns {string|null}
 */
export function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
  return `${base}${avatarUrl}`
}

/**
 * Читает файл и возвращает data-URL для превью
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

/**
 * Форматирует дату рождения для отправки на сервер
 * Бэкенд ожидает ISO строку DateTime
 * @param {string} dateString - формат "YYYY-MM-DD" (из <input type="date">)
 * @returns {string} ISO DateTime string
 */
export function formatBirthday(dateString) {
  return new Date(dateString).toISOString()
}

/**
 * Парсит дату с бэкенда (формат "dd.MM.yyyy") в строку YYYY-MM-DD для input[type=date]
 * @param {string} ddmmyyyy - например "15.03.2000"
 * @returns {string} - например "2000-03-15"
 */
export function parseBirthdayFromServer(ddmmyyyy) {
  if (!ddmmyyyy) return ''
  const [dd, mm, yyyy] = ddmmyyyy.split('.')
  return `${yyyy}-${mm}-${dd}`
}
