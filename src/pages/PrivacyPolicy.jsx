import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/Button'

export default function PrivacyPolicy() {
    const navigate = useNavigate()

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

            <div style={{ flex: 1, padding: '40px 20px 60px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                    <ArrowLeft size={16} /> Назад
                </button>

                <div className="glass" style={{ padding: 32, borderRadius: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Политика конфиденциальности</h1>

                    <div style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: 15 }}>
                        <p style={{ marginBottom: 16 }}>Настоящая Политика конфиденциальности определяет порядок обработки и защиты информации о Пользователях сайта УКоннект.</p>

                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>1. Сбор данных</h3>
                        <p style={{ marginBottom: 16 }}>Мы собираем следующие данные при регистрации: <b>Имя, Фамилия, Email, Номер телефона, Хэш пароля</b>. После входа мы также храним: <b>Аватар, Описание профиля, Баннер, Список друзей и Шифрованные сообщения</b>.</p>

                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>2. Использование данных</h3>
                        <p style={{ marginBottom: 16 }}>Данные используются исключительно для работы сервиса: авторизации, отображения профиля, обеспечения связи между друзьями и поиска пользователей.</p>

                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>3. Защита данных</h3>
                        <p style={{ marginBottom: 16 }}>Пароли хранятся в виде хэша. Мы используем защищенные протоколы передачи данных (HTTPS). Сообщения шифруются.</p>

                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>4. Права пользователя</h3>
                        <p style={{ marginBottom: 16 }}>Вы имеете право запросить удаление вашего аккаунта и всех связанных с ним данных в любой момент через настройки профиля.</p>

                        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ fontSize: 13, opacity: 0.6 }}>Последнее обновление: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}