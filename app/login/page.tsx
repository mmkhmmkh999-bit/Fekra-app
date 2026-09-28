'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { hashPassword, setCurrentCustomer, setCurrentAdmin } from '../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const input = identifier.trim().toLowerCase()
    const isEmail = input.includes('@')
    const hash = await hashPassword(password)

    // ===== 1) لو مدخلش إيميل — نجرب الأدمن الأول =====
    if (!isEmail) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('username', input)
        .eq('is_active', true)
        .single()

      if (adminData) {
        const validPass =
          adminData.password_hash === hash || adminData.password_hash === password

        if (!validPass) {
          setError('كلمة السر غلط')
          setLoading(false)
          return
        }

        await supabase
          .from('admins')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminData.id)

        setCurrentAdmin({
          id: adminData.id,
          username: adminData.username,
          full_name: adminData.full_name,
          email: adminData.email,
          role: adminData.role,
          is_active: adminData.is_active,
        })

        // الأدمن — يروح للوحة
        router.push('/admin')
        return
      }
    }

    // ===== 2) نجرب العميل =====
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('email', isEmail ? input : '')
      .eq('password_hash', hash)
      .single()

    // لو مش لاقي بالإيميل، نجرب الإيميل بدون تطابق hash
    if (!customerData) {
      const { data: emailOnly } = await supabase
        .from('customers')
        .select('*')
        .eq('email', isEmail ? input : input)
        .single()

      if (emailOnly && (emailOnly.password_hash === hash || emailOnly.password_hash === password)) {
        setCurrentCustomer({
          id: emailOnly.id,
          name: emailOnly.name,
          email: emailOnly.email,
          phone: emailOnly.phone,
        })
        router.push('/account')
        return
      }

      setError('الإيميل أو كلمة السر غلط')
      setLoading(false)
      return
    }

    setCurrentCustomer({
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
    })
    router.push('/account')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 flex items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

      <div className="absolute top-20 right-10 w-72 h-72 bg-rose-200/60 rounded-full filter blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-amber-200/60 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-emerald-200/60 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-100 p-8 w-full max-w-md border border-rose-100 relative animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-rose-200">
            🔓
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">تسجيل الدخول</h1>
          <p className="text-slate-500 font-bold text-sm">
            ادخل بياناتك للوصول للموقع
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">
              📧 الإيميل أو اسم المستخدم
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
              placeholder="admin أو your@email.com"
              autoFocus
              required
            />
            <p className="text-xs text-slate-400 font-bold mt-1">
              💡 الأدمن بيدخل بـ username، العميل بيدخل بالإيميل
            </p>
          </div>

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">🔑 كلمة السر</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition pl-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xl"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl font-bold text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="w-full bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-200 hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحقق...
              </span>
            ) : (
              '🔓 دخول'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 font-bold text-sm mb-3">معندكش حساب؟</p>
          <Link
            href="/register"
            className="inline-block w-full bg-white hover:bg-rose-50 text-rose-500 font-black py-3 rounded-2xl border-2 border-rose-200 hover:border-rose-300 transition text-center"
          >
            📝 إنشاء حساب جديد
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-slate-400 hover:text-rose-500 font-bold text-sm transition">
            ← الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}