'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin } from '../../lib/auth'

type Order = {
  id: number
  customer_name: string
  phone: string
  address: string
  shipping_cost: number
  total_price: number
  discount_amount: number
  coupon_code: string | null
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'تم الشحن', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'ملغي', color: 'bg-rose-100 text-rose-700' },
}

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [admin, setAdmin] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(searchParams.get('filter') || 'all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)
    loadOrders()
  }, [router])

  async function loadOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }

  async function deleteOrder(id: number, name: string) {
    if (!confirm(`متأكد من حذف الطلب #${id} للعميل "${name}"؟\n\n⚠️ ده هيمسح كل تفاصيل الطلب نهائيًا!`)) return

    setDeleting(id)
    await supabase.from('order_items').delete().eq('order_id', id)
    const { error } = await supabase.from('orders').delete().eq('id', id)

    if (error) {
      setMessage('❌ حدث خطأ في الحذف')
    } else {
      setMessage(`✅ تم حذف الطلب #${id} بنجاح`)
      setOrders(prev => prev.filter(o => o.id !== id))
    }
    setDeleting(null)
    setTimeout(() => setMessage(''), 3000)
  }

  const filteredOrders = orders.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = search === '' ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      String(o.id).includes(search)
    return matchFilter && matchSearch
  })

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
            <h1 className="text-xl font-black text-slate-800">📦 الطلبات</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">💰</Link>
            <Link href="/admin/options" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎛️</Link>
            <Link href="/admin/coupons" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🎟️</Link>
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

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث برقم الطلب، اسم العميل، أو رقم التليفون..."
            className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-white text-slate-800 font-bold transition shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-black transition ${
              filter === 'all'
                ? 'bg-gradient-to-l from-rose-400 to-amber-400 text-white shadow-lg shadow-rose-200'
                : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            الكل ({orders.length})
          </button>
          {Object.entries(STATUS_LABELS).map(([key, val]) => {
            const count = orders.filter((o) => o.status === key).length
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition ${
                  filter === key
                    ? 'bg-gradient-to-l from-rose-400 to-amber-400 text-white shadow-lg shadow-rose-200'
                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                }`}
              >
                {val.label} ({count})
              </button>
            )
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-500 font-black text-lg">مفيش طلبات في الفئة دي</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const status = STATUS_LABELS[order.status] || {
                label: order.status,
                color: 'bg-slate-100 text-slate-700',
              }
              const isDeleting = deleting === order.id
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-sm p-5 hover:shadow-lg hover:shadow-rose-100/50 transition-all border border-slate-100 flex items-center gap-4 flex-wrap"
                >
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex-1 min-w-[200px]"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-black text-lg text-slate-800 bg-gradient-to-br from-rose-100 to-amber-100 px-3 py-1 rounded-xl">
                            #{order.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${status.color}`}>
                            {status.label}
                          </span>
                          {order.coupon_code && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                              🎟️ {order.coupon_code}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700">
                          <span className="font-black">العميل:</span> {order.customer_name}
                        </p>
                        <p className="text-slate-500 text-sm font-bold">📱 {order.phone}</p>
                        <p className="text-slate-400 text-xs mt-1 font-bold">
                          {new Date(order.created_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      {Number(order.discount_amount) > 0 && (
                        <p className="text-xs text-slate-400 line-through font-bold">
                          {(Number(order.total_price) + Number(order.discount_amount)).toFixed(2)} ج
                        </p>
                      )}
                      <p className="text-2xl font-black text-rose-500">
                        {Number(order.total_price).toFixed(2)} ج
                      </p>
                    </div>

                    <button
                      onClick={() => deleteOrder(order.id, order.customer_name)}
                      disabled={isDeleting}
                      className="w-11 h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition disabled:opacity-50"
                      title="حذف الطلب"
                    >
                      {isDeleting ? (
                        <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        '🗑️'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}