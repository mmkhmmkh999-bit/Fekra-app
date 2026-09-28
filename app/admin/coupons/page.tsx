'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin } from '../../lib/auth'

type Coupon = {
  id: number
  code: string
  discount_type: string
  discount_value: number
  min_order: number
  max_uses: number
  uses_count: number
  expires_at: string | null
  is_active: boolean
}

export default function AdminCouponsPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [message, setMessage] = useState('')

  const [code, setCode] = useState('')
  const [type, setType] = useState('percentage')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)
    load()
  }, [router])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  function showMsg(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  async function addCoupon() {
    if (!code || !value) {
      showMsg('❌ اكتب كود الخصم والقيمة')
      return
    }
    const { error } = await supabase.from('coupons').insert({
      code: code.toUpperCase(),
      discount_type: type,
      discount_value: Number(value),
      min_order: Number(minOrder) || 0,
      max_uses: Number(maxUses) || 100,
      expires_at: expiresAt || null,
      is_active: true,
    })
    if (error) {
      showMsg('❌ الكود موجود بالفعل!')
    } else {
      showMsg('✅ تم إضافة الكوبون')
      setCode(''); setValue(''); setMinOrder(''); setMaxUses('100'); setExpiresAt('')
      setShowAdd(false)
      load()
    }
  }

  async function toggleActive(id: number, current: boolean) {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    showMsg(current ? '✕ تم التعطيل' : '✓ تم التفعيل')
    load()
  }

  async function deleteCoupon(id: number) {
    if (!confirm('متأكد من حذف الكوبون؟')) return
    await supabase.from('coupons').delete().eq('id', id)
    showMsg('✅ تم الحذف')
    load()
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              👨‍💼
            </Link>
            <h1 className="text-xl font-black text-slate-800">🎟️ الكوبونات</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">💰</Link>
            <Link href="/admin/options" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎛️</Link>
            <Link href="/admin/coupons" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">🎟️</Link>
            <Link href="/admin/settings" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">⚙️</Link>
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

      <div className="max-w-6xl mx-auto p-6">
        {message && (
          <div className={`mb-4 p-4 rounded-2xl font-black text-center ${
            message.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200' : 'bg-rose-50 text-rose-700 border-2 border-rose-200'
          }`}>
            {message}
          </div>
        )}

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full bg-white hover:bg-gradient-to-l hover:from-rose-50 hover:to-amber-50 border-2 border-dashed border-rose-200 hover:border-rose-300 text-rose-500 font-black py-5 rounded-3xl transition-all flex items-center justify-center gap-3 mb-6"
          >
            <span className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">+</span>
            إضافة كوبون جديد
          </button>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-rose-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-800">🎟️ كوبون جديد</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-black transition"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">كود الخصم</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثلاً: WELCOME10"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-black tracking-widest"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">النوع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setType('percentage')}
                    className={`p-3 rounded-2xl font-black text-sm transition ${
                      type === 'percentage'
                        ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg'
                        : 'bg-white border-2 border-slate-100 text-slate-600'
                    }`}
                  >
                    % نسبة
                  </button>
                  <button
                    onClick={() => setType('fixed')}
                    className={`p-3 rounded-2xl font-black text-sm transition ${
                      type === 'fixed'
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg'
                        : 'bg-white border-2 border-slate-100 text-slate-600'
                    }`}
                  >
                    💰 ثابت
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">القيمة</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'percentage' ? '10' : '50'}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">أقل مبلغ للطلب</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">أقصى استخدام</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="100"
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-black text-slate-500 mb-1">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={addCoupon}
                className="flex-1 bg-gradient-to-l from-rose-500 to-amber-500 text-white font-black py-3 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                ✅ إضافة
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {coupons.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <div className="text-6xl mb-4">🎟️</div>
              <p className="text-slate-500 font-black">مفيش كوبونات لسه</p>
            </div>
          ) : coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-rose-200 hover:shadow-lg transition-all flex items-center gap-4 flex-wrap">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${c.is_active ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                🎟️
              </div>
              <div className="flex-1 min-w-[150px]">
                <div className="font-black text-xl text-slate-800 tracking-widest">{c.code}</div>
                <div className="text-sm text-slate-500 font-bold">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% خصم` : `${c.discount_value} ج خصم`}
                  {c.min_order > 0 && ` • أقل طلب ${c.min_order} ج`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-rose-500">{c.uses_count}/{c.max_uses}</div>
                <div className="text-xs text-slate-500 font-bold">استخدام</div>
              </div>
              <button
                onClick={() => toggleActive(c.id, c.is_active)}
                className={`px-4 py-2 rounded-full text-xs font-black transition ${
                  c.is_active
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {c.is_active ? '✓ مُفعّل' : '✕ مُعطّل'}
              </button>
              <button
                onClick={() => deleteCoupon(c.id)}
                className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}