'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  getCurrentAdmin,
  hashPassword,
  Admin,
  AdminRole,
  ROLE_LABELS,
  hasPermission,
} from '../../lib/auth'

export default function AdminAdminsPage() {
  const router = useRouter()
  const [currentAdmin, setCurrentAdminState] = useState<Admin | null>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const admin = getCurrentAdmin()
    if (!admin) {
      router.push('/login')
      return
    }
    if (!hasPermission(admin.role, 'admins')) {
      router.push('/admin')
      return
    }
    setCurrentAdminState(admin)
    loadAdmins()
  }, [router])

  async function loadAdmins() {
    setLoading(true)
    const { data } = await supabase.from('admins').select('*').order('id', { ascending: true })
    setAdmins(data || [])
    setLoading(false)
  }

  function showMsg(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3500)
  }

  function resetForm() {
    setFullName('')
    setEmail('')
    setUsername('')
    setPassword('')
    setRole('admin')
    setIsActive(true)
    setEditingId(null)
    setShowAdd(false)
  }

  function startEdit(admin: any) {
    setFullName(admin.full_name || '')
    setEmail(admin.email || '')
    setUsername(admin.username)
    setPassword('')
    setRole(admin.role as AdminRole)
    setIsActive(admin.is_active)
    setEditingId(admin.id)
    setShowAdd(true)
  }

  async function saveAdmin() {
    if (!username.trim()) {
      showMsg('اكتب اسم المستخدم', 'error')
      return
    }

    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .neq('id', editingId || 0)
      .single()

    if (existing) {
      showMsg('اسم المستخدم مستخدم بالفعل', 'error')
      return
    }

    if (editingId) {
      const updates: any = {
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        is_active: isActive,
      }

      if (password.trim()) {
        if (password.length < 6) {
          showMsg('كلمة السر لازم 6 أحرف على الأقل', 'error')
          return
        }
        updates.password_hash = await hashPassword(password)
      }

      const { error } = await supabase.from('admins').update(updates).eq('id', editingId)
      if (error) {
        showMsg('حدث خطأ: ' + error.message, 'error')
        return
      }
      showMsg('✅ تم تحديث الأدمن', 'success')
    } else {
      if (!password.trim() || password.length < 6) {
        showMsg('كلمة السر لازم 6 أحرف على الأقل', 'error')
        return
      }

      const hash = await hashPassword(password)

      const { error } = await supabase.from('admins').insert({
        username: username.toLowerCase().trim(),
        password_hash: hash,
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        is_active: isActive,
      })
      if (error) {
        showMsg('حدث خطأ: ' + error.message, 'error')
        return
      }
      showMsg('✅ تم إضافة الأدمن', 'success')
    }

    resetForm()
    loadAdmins()
  }

  async function deleteAdmin(id: number, name: string) {
    if (currentAdmin?.id === id) {
      showMsg('مينفعش تحذف نفسك!', 'error')
      return
    }

    if (!confirm(`متأكد من حذف الأدمن "${name}"؟`)) return

    const { error } = await supabase.from('admins').delete().eq('id', id)
    if (error) {
      showMsg('حدث خطأ', 'error')
      return
    }
    showMsg('✅ تم الحذف', 'success')
    loadAdmins()
  }

  async function toggleActive(id: number, current: boolean) {
    if (currentAdmin?.id === id) {
      showMsg('مينفعش تعطّل نفسك!', 'error')
      return
    }
    await supabase.from('admins').update({ is_active: !current }).eq('id', id)
    loadAdmins()
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              👨‍💼
            </Link>
            <h1 className="text-xl font-black text-slate-800">🛡️ إدارة الأدمنز</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">💰</Link>
            <Link href="/admin/options" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎛️</Link>
            <Link href="/admin/coupons" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎟️</Link>
            <Link href="/admin/admins" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">🛡️</Link>
            <Link href="/admin/settings" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">⚙️</Link>
            <button
              onClick={() => {
                localStorage.removeItem('admin_logged_in')
                localStorage.removeItem('admin_username')
                localStorage.removeItem('admin')
                router.push('/login')
              }}
              className="px-3 py-2 rounded-xl font-bold bg-rose-100 hover:bg-rose-200 text-rose-600 text-sm"
            >
              🚪
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {message && (
          <div className={`mb-4 p-4 rounded-2xl font-black text-center animate-fadeIn border-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-3xl p-5 border-2 border-white shadow-lg mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
              {ROLE_LABELS[currentAdmin?.role || 'admin']?.icon || '👤'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-500">إنت داخل باسم</p>
              <p className="text-xl font-black text-slate-800">{currentAdmin?.full_name || currentAdmin?.username}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-black ${ROLE_LABELS[currentAdmin?.role || 'admin']?.bg} ${ROLE_LABELS[currentAdmin?.role || 'admin']?.color}`}>
              {ROLE_LABELS[currentAdmin?.role || 'admin']?.icon} {ROLE_LABELS[currentAdmin?.role || 'admin']?.label}
            </span>
          </div>
        </div>

        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full bg-white hover:bg-gradient-to-l hover:from-rose-50 hover:to-amber-50 border-2 border-dashed border-rose-200 hover:border-rose-300 text-rose-500 font-black py-5 rounded-3xl transition-all flex items-center justify-center gap-3 mb-6"
          >
            <span className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">+</span>
            إضافة أدمن جديد
          </button>
        )}

        {showAdd && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-rose-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-800">
                {editingId ? '✏️ تعديل الأدمن' : '✨ أدمن جديد'}
              </h2>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-black transition"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">👤 الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أحمد محمد"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">📧 الإيميل (اختياري)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">🔤 اسم المستخدم</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">
                  🔑 كلمة السر {editingId && <span className="text-amber-600">(سيبها فاضية لو مش هتغيرها)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-black text-slate-500 mb-2">🎭 الصلاحية</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-2xl font-black text-sm transition-all border-2 ${
                      role === r
                        ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-white border-transparent shadow-lg'
                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{ROLE_LABELS[r].icon}</div>
                    <div className="text-xs">{ROLE_LABELS[r].label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold mt-2">
                {role === 'super_admin' && '👑 صلاحيات كاملة — يتحكم في كل حاجة + الأدمنز'}
                {role === 'admin' && '🛡️ يتحكم في الطلبات، الأسعار، الخيارات، والكوبونات'}
                {role === 'manager' && '📋 يتحكم في الطلبات فقط'}
                {role === 'viewer' && '👁️ مشاهدة فقط بدون تعديل'}
              </p>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-2xl">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-14 h-8 rounded-full transition ${
                  isActive ? 'bg-emerald-400' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                  isActive ? 'left-1' : 'left-7'
                }`} />
              </button>
              <span className="font-black text-slate-700 text-sm">
                {isActive ? '✓ مُفعّل' : '✕ مُعطّل'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveAdmin}
                className="flex-1 bg-gradient-to-l from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black py-3 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                {editingId ? '💾 حفظ التعديلات' : '✅ إضافة الأدمن'}
              </button>
              <button
                onClick={resetForm}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {admins.map((a) => {
            const isMe = currentAdmin?.id === a.id
            const roleInfo = ROLE_LABELS[a.role as AdminRole] || ROLE_LABELS.admin
            return (
              <div
                key={a.id}
                className={`bg-white rounded-3xl p-5 border-2 transition-all flex items-center gap-4 flex-wrap ${
                  isMe ? 'border-rose-300 shadow-lg shadow-rose-100' : 'border-slate-100 hover:border-rose-200 hover:shadow-lg'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                  a.is_active ? 'bg-gradient-to-br from-rose-100 to-amber-100' : 'bg-slate-100'
                }`}>
                  {roleInfo.icon}
                </div>

                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-lg text-slate-800">
                      {a.full_name || a.username}
                    </p>
                    {isMe && (
                      <span className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full font-black">أنت</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-bold" dir="ltr">@{a.username}</p>
                  {a.email && (
                    <p className="text-xs text-slate-400 font-bold" dir="ltr">📧 {a.email}</p>
                  )}
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black ${roleInfo.bg} ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>

                <button
                  onClick={() => toggleActive(a.id, a.is_active)}
                  disabled={isMe}
                  className={`px-3 py-1 rounded-full text-xs font-black transition disabled:opacity-50 ${
                    a.is_active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {a.is_active ? '✓ مُفعّل' : '✕ مُعطّل'}
                </button>

                <button
                  onClick={() => startEdit(a)}
                  className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition"
                  title="تعديل"
                >
                  ✏️
                </button>

                <button
                  onClick={() => deleteAdmin(a.id, a.full_name || a.username)}
                  disabled={isMe}
                  className="w-10 h-10 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title={isMe ? 'مينفعش تحذف نفسك' : 'حذف'}
                >
                  🗑️
                </button>
              </div>
            )
          })}
        </div>

        {admins.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-500 font-black">مفيش أدمنز لسه</p>
          </div>
        )}
      </div>
    </div>
  )
}