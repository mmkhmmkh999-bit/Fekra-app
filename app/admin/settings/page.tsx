'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin, hashPassword, ROLE_LABELS, AdminRole } from '../../lib/auth'

type Setting = {
  key: string
  value: string
  label: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)
    setNewUsername(a.username)
    loadSettings()
  }, [router])

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*')
    setSettings((data as any) || [])
    setLoading(false)
  }

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  async function changeMyCredentials() {
    if (!currentPassword) {
      showMessage('ادخل كلمة السر الحالية', 'error')
      return
    }
    if (!newUsername.trim()) {
      showMessage('اكتب اسم المستخدم', 'error')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      showMessage('كلمة السر الجديدة مش متطابقة', 'error')
      return
    }
    if (newPassword && newPassword.length < 6) {
      showMessage('كلمة السر لازم 6 أحرف على الأقل', 'error')
      return
    }

    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('id', admin.id)
      .single()

    if (!adminData) {
      showMessage('حدث خطأ', 'error')
      return
    }

    const currentHashed = await hashPassword(currentPassword)
    const isValid = adminData.password_hash === currentHashed || adminData.password_hash === currentPassword

    if (!isValid) {
      showMessage('كلمة السر الحالية غلط', 'error')
      return
    }

    if (newUsername !== admin.username) {
      const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .eq('username', newUsername.toLowerCase().trim())
        .neq('id', admin.id)
        .single()

      if (existing) {
        showMessage('اسم المستخدم مستخدم بالفعل', 'error')
        return
      }
    }

    setChanging(true)

    const updates: any = {
      username: newUsername.toLowerCase().trim(),
    }

    if (newPassword) {
      updates.password_hash = await hashPassword(newPassword)
    }

    const { error } = await supabase.from('admins').update(updates).eq('id', admin.id)

    setChanging(false)

    if (error) {
      showMessage('حدث خطأ: ' + error.message, 'error')
      return
    }

    const newAdmin = { ...admin, username: newUsername.toLowerCase().trim() }
    localStorage.setItem('admin', JSON.stringify(newAdmin))
    localStorage.setItem('admin_username', newAdmin.username)
    setAdmin(newAdmin)

    showMessage('✅ تم تغيير البيانات بنجاح', 'success')

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')

    setTimeout(() => {
      localStorage.removeItem('admin_logged_in')
      localStorage.removeItem('admin_username')
      localStorage.removeItem('admin')
      router.push('/login')
    }, 2000)
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
    setSaving(false)
    if (!error) showMessage('✅ تم الحفظ', 'success')
  }

  const generalSettings = settings.filter(
    (s) => !['admin_username', 'admin_password'].includes(s.key)
  )

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
            <h1 className="text-xl font-black text-slate-800">⚙️ الإعدادات</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">💰</Link>
            <Link href="/admin/options" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎛️</Link>
            <Link href="/admin/coupons" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎟️</Link>
            <Link href="/admin/settings" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">⚙️</Link>
            {admin?.role === 'super_admin' && (
              <Link href="/admin/admins" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🛡️</Link>
            )}
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

      <div className="max-w-4xl mx-auto p-6">
        {message && (
          <div className={`mb-4 p-4 rounded-2xl font-black text-center animate-fadeIn border-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">⚙️ إعدادات النظام</h1>
          <p className="text-slate-600 font-bold">تحكم كامل في بياناتك وإعدادات المتجر</p>
        </div>

        <div className="bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-3xl p-6 border-2 border-white shadow-lg mb-6 animate-fadeIn">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
              {ROLE_LABELS[(admin?.role as AdminRole) || 'admin']?.icon || '👤'}
            </div>
            <div className="flex-1 min-w-[150px]">
              <p className="text-xs font-black text-slate-500">إنت داخل باسم</p>
              <p className="text-2xl font-black text-slate-800">{admin?.full_name || admin?.username}</p>
              <p className="text-sm font-bold text-slate-500" dir="ltr">@{admin?.username}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-black ${ROLE_LABELS[(admin?.role as AdminRole) || 'admin']?.bg} ${ROLE_LABELS[(admin?.role as AdminRole) || 'admin']?.color}`}>
              {ROLE_LABELS[(admin?.role as AdminRole) || 'admin']?.label}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              🔐
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">بيانات الدخول</h2>
              <p className="text-xs text-slate-500 font-bold">غيّر اسم المستخدم وكلمة السر</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <p className="text-amber-700 font-black text-sm mb-1">⚠️ لازم تأكد من كلمة السر الحالية</p>
              <p className="text-amber-600 font-bold text-xs">عشان الأمان، ادخل كلمة السر الحالية قبل أي تغيير</p>
            </div>

            <div>
              <label className="block mb-2 font-black text-slate-700 text-sm">🔑 كلمة السر الحالية</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition pl-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
                >
                  {showCurrentPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-slate-100 pt-4 mt-4">
              <p className="text-slate-500 font-black text-sm mb-3">✨ البيانات الجديدة</p>

              <div className="space-y-3">
                <div>
                  <label className="block mb-2 font-black text-slate-700 text-sm">👤 اسم المستخدم</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    className="w-full border-2 border-slate-100 focus:border-emerald-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                    placeholder="username"
                    dir="ltr"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 font-black text-slate-700 text-sm">
                      🔑 كلمة السر الجديدة
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border-2 border-slate-100 focus:border-emerald-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition pl-12"
                        placeholder="سيبها فاضية لو مش هتغيرها"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
                      >
                        {showNewPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-black text-slate-700 text-sm">
                      🔑 تأكيد كلمة السر
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-2 border-slate-100 focus:border-emerald-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                      placeholder="اكتب كلمة السر تاني"
                    />
                  </div>
                </div>

                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <p className="text-rose-500 font-black text-xs">⚠️ الكلمتين مش متطابقين</p>
                )}
                {confirmPassword && newPassword && confirmPassword === newPassword && (
                  <p className="text-emerald-600 font-black text-xs">✓ الكلمتين متطابقين</p>
                )}
              </div>
            </div>

            <button
              onClick={changeMyCredentials}
              disabled={changing}
              className="w-full bg-gradient-to-l from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-200 hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none mt-4"
            >
              {changing ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </span>
              ) : (
                '🔐 تغيير البيانات'
              )}
            </button>
            <p className="text-xs text-slate-500 font-bold text-center">
              ⚠️ هتخرج من اللوحة وتدخل بالبيانات الجديدة
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              🛠️
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">الإعدادات العامة</h2>
              <p className="text-xs text-slate-500 font-bold">بيانات المتجر والتواصل</p>
            </div>
          </div>

          <div className="space-y-4">
            {generalSettings.map((s) => (
              <div key={s.key} className="flex items-center gap-3 flex-wrap">
                <label className="w-full md:w-44 font-black text-slate-700 text-sm">
                  {s.label || s.key}
                </label>
                <input
                  type="text"
                  defaultValue={s.value}
                  onBlur={(e) => {
                    if (e.target.value !== s.value) {
                      saveSetting(s.key, e.target.value)
                    }
                  }}
                  className="flex-1 min-w-[200px] border-2 border-slate-100 focus:border-amber-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                />
              </div>
            ))}

            {generalSettings.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">مفيش إعدادات عامة</p>
            )}
          </div>
          <p className="text-xs text-slate-500 font-bold text-center mt-4">
            💡 أي تعديل بيتحفظ تلقائيًا لما تسيب الحقل
          </p>
        </div>

        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 mt-6 animate-fadeIn">
          <h3 className="text-lg font-black text-rose-700 mb-2 flex items-center gap-2">
            ⚠️ منطقة الخطر
          </h3>
          <p className="text-rose-600 font-bold text-sm mb-4">تسجيل الخروج من اللوحة على الجهاز الحالي</p>
          <button
            onClick={() => {
              if (confirm('متأكد من تسجيل الخروج؟')) {
                localStorage.removeItem('admin_logged_in')
                localStorage.removeItem('admin_username')
                localStorage.removeItem('admin')
                router.push('/login')
              }
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white font-black px-6 py-3 rounded-2xl transition shadow-lg"
          >
            🚪 تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}