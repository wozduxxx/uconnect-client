import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, ImagePlus } from 'lucide-react'
import Button from './Button'
import Toast, { toast } from './Toast'

export default function EditProfileModal({ open, onClose, profile, onSave }) {
    const [form, setForm] = useState({
        name: profile?.name || '',
        username: profile?.username || '',
        location: profile?.location || '',
        bio: profile?.bio || '',
    })

    const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || profile?.avatarPreview || null)
    const [bannerPreview, setBannerPreview] = useState(profile?.bannerUrl || profile?.bannerPreview || null)
    const [avatarFile, setAvatarFile] = useState(null)
    const [bannerFile, setBannerFile] = useState(null)

    const avatarRef = useRef()
    const bannerRef = useRef()

    const initials = form.name
        ? form.name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
        : '👤'

    function set(k) {
        return e => setForm(prev => ({ ...prev, [k]: e.target.value }))
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!['image/jpeg', 'image/png'].includes(file.type)) { toast('Только JPG и PNG'); return }
        if (file.size > 5 * 1024 * 1024) { toast('Файл слишком большой (макс. 5MB)'); return }

        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = ev => setAvatarPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    function handleBannerChange(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!['image/jpeg', 'image/png'].includes(file.type)) { toast('Только JPG и PNG'); return }
        if (file.size > 5 * 1024 * 1024) { toast('Файл слишком большой (макс. 5MB)'); return }

        setBannerFile(file)
        const reader = new FileReader()
        reader.onload = ev => setBannerPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    function handleSave() {
        if (!form.name.trim()) {
            toast('Имя не может быть пустым')
            return
        }

        onSave({
            ...form,
            avatarFile,
            bannerFile,
            avatarPreview,
            bannerPreview,
            avatarIsImage: !!avatarFile,
        })

        toast('Профиль обновлён')
        onClose()
    }

    const labelStyle = {
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        color: '#64748b',
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        marginBottom: 8,
    }

    return (
        <AnimatePresence>
            {open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px', pointerEvents: 'none',
                }}>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                            zIndex: -1, backdropFilter: 'blur(4px)',
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                        className="hide-scroll"
                        style={{
                            pointerEvents: 'auto', width: '100%', maxWidth: 460,
                            maxHeight: '90vh', overflowY: 'auto', borderRadius: 24,
                            background: '#F0F4FF', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '22px 24px 18px', background: '#F0F4FF',
                            borderBottom: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px 24px 0 0',
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: '#0f172a' }}>
                                Редактировать профиль
                            </div>
                            <button onClick={onClose} style={{
                                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0,
                            }}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Banner */}
                            <div>
                                <label style={labelStyle}>Обложка профиля</label>
                                <div onClick={() => bannerRef.current.click()} style={{
                                    width: '100%', height: 108, borderRadius: 14,
                                    background: bannerPreview ? `url(${bannerPreview}) center/cover no-repeat` : 'linear-gradient(135deg,#0f2150,#1e3a8a,#4c1d95)',
                                    border: '2px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden', transition: 'opacity 0.2s',
                                }}>
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                        background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '8px 18px', backdropFilter: 'blur(6px)',
                                    }}>
                                        <ImagePlus size={17} style={{ color: '#fff' }} />
                                        <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>
                                            {bannerPreview ? 'Изменить обложку' : 'Загрузить обложку'}
                                        </span>
                                    </div>
                                </div>
                                <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerChange} />
                            </div>

                            {/* Avatar */}
                            <div>
                                <label style={labelStyle}>Фото профиля</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{
                                            width: 72, height: 72, borderRadius: '50%', background: '#e5f1ff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: avatarFile ? 0 : 30, border: '3px solid rgba(255,255,255,0.8)',
                                            overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        }}>
                                            {avatarPreview
                                                ? <img src={avatarPreview} alt=" " style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : initials
                                            }
                                        </div>
                                        <button onClick={() => avatarRef.current.click()} style={{
                                            position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%',
                                            background: '#3B82F6', border: '2px solid #F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        }}>
                                            <Camera size={11} style={{ color: '#fff' }} />
                                        </button>
                                    </div>
                                    <div>
                                        <button onClick={() => avatarRef.current.click()} style={{
                                            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                            background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                                            border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                                        }}>
                                            Загрузить фото
                                        </button>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>JPG, PNG — до 5 MB</div>
                                    </div>
                                </div>
                                <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            </div>

                            <div style={{ height: 1, background: 'rgba(0,0,0,0.07)' }} />

                            {/* Text fields */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Имя</label>
                                    <input className="field" placeholder="Ваше имя" value={form.name} onChange={set('name')} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', color: '#0f172a' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>О себе</label>
                                    <textarea className="field" placeholder="Расскажите о себе..." value={form.bio} onChange={set('bio')} maxLength={160} rows={3} style={{ resize: 'none', lineHeight: 1.6, paddingTop: 12, paddingBottom: 12, fontFamily: 'Manrope, sans-serif', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', color: '#0f172a' }} />
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>{form.bio.length} / 160</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'rgba(0,0,0,0.06)', border: 'none', color: '#475569', cursor: 'pointer' }}>Отмена</button>
                                <Button fullWidth onClick={handleSave} style={{ flex: 1, padding: '13px 0' }}>Сохранить</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <style>{`
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AnimatePresence>
    )
}