'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { hashPassword, setCurrentCustomer } from '../lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('كلمة السر لازم 6 أحرف على الأقل')
      return
    }
    if (password !== confirm) {
      setError('الكلمتين مش متطابقين')
      return
    }

    setLoading(true)

    // تحقق من الإيميل
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      setError('الإيميل مستخدم بالفعل')
      setLoading(false)
      return
    }

    const hash = await hashPassword(password)

    const { data, error: dbError } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        address: address.trim(),
        password_hash: hash,
      })
      .select()
      .single()

    if (dbError || !data) {
      setError('حدث خطأ، حاول تاني')
      setLoading(false)
      return
    }

    setCurrentCustomer({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    })

    router.push('/account')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 flex items-center justify-center p-6" dir="rtl">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

      <div className="absolute top-20 right-10 w-72 h-72 bg-rose-200/60 rounded-full filter blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-200/60 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-100 p-8 w-full max-w-md border border-rose-100 relative animate-fadeIn my-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-rose-200">
            ✨
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">حساب جديد</h1>
          <p className="text-slate-500 font-bold text-sm">سجل بياناتك واستمتع بالمزايا</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">👤 الاسم الكامل</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
              placeholder="اكتب اسمك"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">📧 الإيميل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
              placeholder="your@email.com"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">📱 رقم التليفون</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">📍 العنوان (اختياري)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition resize-none"
              placeholder="المحافظة، المدينة، الشارع"
            />
          </div>

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">🔑 كلمة السر</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition pl-12"
                placeholder="6 أحرف على الأقل"
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

          <div>
            <label className="block mb-2 font-black text-slate-700 text-sm">🔑 تأكيد كلمة السر</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
              placeholder="اكتب كلمة السر تاني"
              required
            />
            {confirm && password && confirm === password && (
              <p className="text-emerald-600 font-black text-xs mt-2">✓ الكلمتين متطابقين</p>
            )}
            {confirm && password && confirm !== password && (
              <p className="text-rose-500 font-black text-xs mt-2">⚠️ الكلمتين مش متطابقين</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl font-bold text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-200 hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التسجيل...
              </span>
            ) : (
              '✨ إنشاء الحساب'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 font-bold text-sm mb-3">عندك حساب بالفعل؟</p>
          <Link
            href="/login"
            className="inline-block w-full bg-white hover:bg-rose-50 text-rose-500 font-black py-3 rounded-2xl border-2 border-rose-200 hover:border-rose-300 transition text-center"
          >
            🔓 تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}