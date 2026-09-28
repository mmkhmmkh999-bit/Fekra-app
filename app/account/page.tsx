'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getCurrentCustomer, logoutCustomer } from '../lib/auth'

type Order = {
  id: number
  total_price: number
  status: string
  created_at: string
  address: string
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending: { label: 'قيد المراجعة', bg: 'bg-amber-100', color: 'text-amber-700', icon: '⏰' },
  processing: { label: 'قيد التنفيذ', bg: 'bg-blue-100', color: 'text-blue-700', icon: '⚙️' },
  shipped: { label: 'تم الشحن', bg: 'bg-purple-100', color: 'text-purple-700', icon: '🚚' },
  completed: { label: 'مكتمل', bg: 'bg-emerald-100', color: 'text-emerald-700', icon: '✅' },
  cancelled: { label: 'ملغي', bg: 'bg-rose-100', color: 'text-rose-700', icon: '❌' },
}

export default function AccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const c = getCurrentCustomer()
    if (!c) {
      router.push('/login?redirect=/account')
      return
    }
    setCustomer(c)
    loadOrders(c.id)
  }, [router])

  async function loadOrders(customerId: number) {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  function handleLogout() {
    if (!confirm('متأكد من تسجيل الخروج؟')) return
    logoutCustomer()
    router.push('/')
  }

  if (!customer)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-black text-slate-800 hover:text-rose-500 transition">
            ← الرئيسية
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-l from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            👤 حسابي
          </h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-3xl p-8 border-2 border-white shadow-xl mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl font-black text-rose-500 shadow-lg">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-3xl font-black text-slate-800 mb-1">أهلاً، {customer.name} 👋</h1>
              <p className="text-slate-600 font-bold text-sm" dir="ltr">📧 {customer.email}</p>
              <p className="text-slate-600 font-bold text-sm" dir="ltr">📱 {customer.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-rose-50 text-rose-500 font-black px-6 py-3 rounded-2xl border-2 border-rose-200 hover:border-rose-300 transition"
            >
              🚪 خروج
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Link
            href="/customize"
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-rose-100/50 transition-all transform hover:-translate-y-1 group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
              🎨
            </div>
            <div className="font-black text-slate-800 text-lg mb-1">صمّم كراسة</div>
            <div className="text-sm text-slate-500 font-bold">اطلب كراسة جديدة</div>
          </Link>

          <Link
            href="/track"
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-amber-100/50 transition-all transform hover:-translate-y-1 group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
              📦
            </div>
            <div className="font-black text-slate-800 text-lg mb-1">تتبع طلب</div>
            <div className="text-sm text-slate-500 font-bold">اعرف حالة طلبك</div>
          </Link>

          <Link
            href="/contact"
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all transform hover:-translate-y-1 group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
              💬
            </div>
            <div className="font-black text-slate-800 text-lg mb-1">تواصل معنا</div>
            <div className="text-sm text-slate-500 font-bold">احنا هنا لمساعدتك</div>
          </Link>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex items-center justify-center">
                📦
              </span>
              طلباتي ({orders.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-500 font-black text-lg mb-2">مفيش طلبات لسه</p>
              <p className="text-slate-400 font-bold text-sm mb-6">ابدأ أول طلب ليك دلوقتي</p>
              <Link
                href="/customize"
                className="inline-block bg-gradient-to-l from-rose-400 to-amber-400 text-white font-black px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                🎨 صمّم كراستك
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] || {
                  label: order.status,
                  bg: 'bg-slate-100',
                  color: 'text-slate-700',
                  icon: '•',
                }
                return (
                  <div
                    key={order.id}
                    className="bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-rose-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-black text-lg text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-100">
                            #{order.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${status.bg} ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold">
                          {new Date(order.created_at).toLocaleString('ar-EG')}
                        </p>
                        {order.address && (
                          <p className="text-slate-500 text-xs font-bold mt-1">📍 {order.address}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-black text-rose-500">
                          {Number(order.total_price).toFixed(2)} ج
                        </p>
                        <Link
                          href={`/track?id=${order.id}`}
                          className="text-xs text-rose-500 hover:text-rose-600 font-black underline mt-1 inline-block"
                        >
                          تتبع الطلب →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}