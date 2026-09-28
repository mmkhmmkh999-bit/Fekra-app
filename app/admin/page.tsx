'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getCurrentAdmin, hasPermission } from '../lib/auth'

type Stats = {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  completedOrders: number
  cancelledOrders: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  allTimeRevenue: number
  productRevenue: number
  shippingRevenue: number
  totalDiscounts: number
  todayOrders: number
  weekOrders: number
  monthOrders: number
  avgOrder: number
  completionRate: number
  totalCoupons: number
  activeCoupons: number
  totalOptions: number
  totalZones: number
  totalAdmins: number
  totalCustomers: number
}

type RecentOrder = {
  id: number
  customer_name: string
  phone: string
  total_price: number
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending: { label: 'قيد المراجعة', bg: 'bg-amber-100', color: 'text-amber-700', icon: '⏰' },
  processing: { label: 'قيد التنفيذ', bg: 'bg-blue-100', color: 'text-blue-700', icon: '⚙️' },
  shipped: { label: 'تم الشحن', bg: 'bg-purple-100', color: 'text-purple-700', icon: '🚚' },
  completed: { label: 'مكتمل', bg: 'bg-emerald-100', color: 'text-emerald-700', icon: '✅' },
  cancelled: { label: 'ملغي', bg: 'bg-rose-100', color: 'text-rose-700', icon: '❌' },
}

export default function AdminHomePage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, processingOrders: 0, shippedOrders: 0,
    completedOrders: 0, cancelledOrders: 0, todayRevenue: 0, weekRevenue: 0,
    monthRevenue: 0, allTimeRevenue: 0, productRevenue: 0, shippingRevenue: 0,
    totalDiscounts: 0, todayOrders: 0, weekOrders: 0, monthOrders: 0,
    avgOrder: 0, completionRate: 0, totalCoupons: 0, activeCoupons: 0,
    totalOptions: 0, totalZones: 0, totalAdmins: 0, totalCustomers: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)

    const hour = new Date().getHours()
    if (hour < 12) setGreeting('صباح الخير ☀️')
    else if (hour < 18) setGreeting('مساء الخير 🌤️')
    else setGreeting('مساء الخير 🌙')

    loadData()
  }, [router])

  async function loadData() {
    setLoading(true)

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    const { count: couponsCount } = await supabase
      .from('coupons').select('*', { count: 'exact', head: true })
    const { count: activeCouponsCount } = await supabase
      .from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: optionsCount } = await supabase
      .from('options').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: zonesCount } = await supabase
      .from('shipping_zones').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: adminsCount } = await supabase
      .from('admins').select('*', { count: 'exact', head: true })
    const { count: customersCount } = await supabase
      .from('customers').select('*', { count: 'exact', head: true })

    if (orders) {
      const now = new Date()
      const today = now.toDateString()
      const startOfWeek = new Date()
      startOfWeek.setDate(now.getDate() - 7)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
      const weekOrders = orders.filter(o => new Date(o.created_at) >= startOfWeek)
      const monthOrders = orders.filter(o => new Date(o.created_at) >= startOfMonth)
      const validOrders = orders.filter(o => o.status !== 'cancelled')

      const calcRevenue = (orderList: any[]) =>
        orderList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_price), 0)

      const productRev = validOrders.reduce((sum, o) =>
        sum + (Number(o.total_price) - Number(o.shipping_cost) + Number(o.discount_amount || 0)), 0)
      const shippingRev = validOrders.reduce((sum, o) => sum + Number(o.shipping_cost), 0)
      const discounts = validOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0)

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        processingOrders: orders.filter(o => o.status === 'processing').length,
        shippedOrders: orders.filter(o => o.status === 'shipped').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        todayRevenue: calcRevenue(todaysOrders),
        weekRevenue: calcRevenue(weekOrders),
        monthRevenue: calcRevenue(monthOrders),
        allTimeRevenue: calcRevenue(orders),
        productRevenue: productRev,
        shippingRevenue: shippingRev,
        totalDiscounts: discounts,
        todayOrders: todaysOrders.length,
        weekOrders: weekOrders.length,
        monthOrders: monthOrders.length,
        avgOrder: validOrders.length > 0 ? calcRevenue(orders) / validOrders.length : 0,
        completionRate: orders.length > 0
          ? (orders.filter(o => o.status === 'completed').length / orders.length) * 100
          : 0,
        totalCoupons: couponsCount || 0,
        activeCoupons: activeCouponsCount || 0,
        totalOptions: optionsCount || 0,
        totalZones: zonesCount || 0,
        totalAdmins: adminsCount || 0,
        totalCustomers: customersCount || 0,
      })

      setRecentOrders(orders.slice(0, 5))
    }

    setLoading(false)
  }

  const periodLabels = {
    today: { label: 'اليوم', revenue: stats.todayRevenue, orders: stats.todayOrders },
    week: { label: 'الأسبوع', revenue: stats.weekRevenue, orders: stats.weekOrders },
    month: { label: 'الشهر', revenue: stats.monthRevenue, orders: stats.monthOrders },
    all: { label: 'الإجمالي', revenue: stats.allTimeRevenue, orders: stats.totalOrders },
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-black">جاري التحميل...</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>

      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-200">
              👨‍💼
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">لوحة التحكم</h1>
              <p className="text-xs text-slate-500 font-bold">أهلاً {admin?.full_name || admin?.username} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/" className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition text-sm">
              🏠 الموقع
            </Link>
            <Link href="/admin/orders" className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition text-sm">
              📦 الطلبات
            </Link>
            <Link href="/admin/customers" className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition text-sm">
              👥 العملاء
            </Link>
            <Link href="/admin/settings" className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition text-sm">
              ⚙️ الإعدادات
            </Link>
            {admin?.role === 'super_admin' && (
              <Link href="/admin/admins" className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition text-sm">
                🛡️ الأدمنز
              </Link>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('admin_logged_in')
                localStorage.removeItem('admin_username')
                localStorage.removeItem('admin')
                router.push('/login')
              }}
              className="px-4 py-2 rounded-xl font-bold bg-rose-100 hover:bg-rose-200 text-rose-600 transition text-sm"
            >
              🚪 خروج
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">
            {greeting}، {admin?.full_name || admin?.username}
          </h1>
          <p className="text-slate-600 font-bold">ده ملخص كل اللي بيحصل في المتجر</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 animate-fadeIn">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 rounded-full text-sm font-black transition ${
                period === p
                  ? 'bg-gradient-to-l from-rose-400 to-amber-400 text-white shadow-lg shadow-rose-200'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              {periodLabels[p].label}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-3xl p-8 border-2 border-white shadow-xl mb-6 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-black text-slate-500 mb-2">
                💰 إيرادات {periodLabels[period].label}
              </div>
              <div className="text-5xl md:text-6xl font-black text-slate-800 mb-3">
                {periodLabels[period].revenue.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} <span className="text-3xl">ج</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-bold flex-wrap">
                <span className="bg-white/60 rounded-full px-3 py-1">📦 {periodLabels[period].orders} طلب</span>
                {period === 'all' && (
                  <span className="bg-white/60 rounded-full px-3 py-1">📊 متوسط {stats.avgOrder.toFixed(0)} ج</span>
                )}
              </div>
            </div>
            <div className="text-8xl">💸</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center text-2xl">📓</div>
              <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full">منتج</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.productRevenue.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">إيراد المنتجات</div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center text-2xl">🚚</div>
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">شحن</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.shippingRevenue.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">إيراد الشحن</div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center text-2xl">🎟️</div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">خصم</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.totalDiscounts.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">خصومات ممنوحة</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-3xl font-black text-slate-800">{stats.totalOrders}</div>
            <div className="text-sm text-slate-500 font-bold">إجمالي الطلبات</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-black text-slate-800">{stats.totalCustomers}</div>
            <div className="text-sm text-slate-500 font-bold">إجمالي العملاء</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-3xl font-black text-slate-800">{stats.avgOrder.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">متوسط الطلب</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-black text-emerald-600">{stats.completionRate.toFixed(0)}%</div>
            <div className="text-sm text-slate-500 font-bold">نسبة الإتمام</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-3xl font-black text-rose-500">{stats.pendingOrders}</div>
            <div className="text-sm text-slate-500 font-bold">محتاج مراجعة</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-black text-slate-800 mb-4">📊 حالات الطلبات</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(STATUS_LABELS).map(([key, val]) => {
              const counts: any = {
                pending: stats.pendingOrders,
                processing: stats.processingOrders,
                shipped: stats.shippedOrders,
                completed: stats.completedOrders,
                cancelled: stats.cancelledOrders,
              }
              return (
                <Link
                  key={key}
                  href={`/admin/orders?filter=${key}`}
                  className={`${val.bg} rounded-2xl p-4 border border-white hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className="text-3xl mb-2">{val.icon}</div>
                  <div className={`text-2xl font-black ${val.color}`}>{counts[key]}</div>
                  <div className={`text-xs font-black ${val.color} opacity-80`}>{val.label}</div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-black text-slate-800 mb-4">⚡ إجراءات سريعة</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { href: '/admin/orders', icon: '📦', title: 'الطلبات', desc: `${stats.totalOrders} طلب`, gradient: 'from-rose-400 to-rose-500', badge: stats.pendingOrders > 0 ? stats.pendingOrders : null },
              { href: '/admin/customers', icon: '👥', title: 'العملاء', desc: `${stats.totalCustomers} عميل`, gradient: 'from-purple-400 to-purple-500' },
              { href: '/admin/pricing', icon: '💰', title: 'الأسعار', desc: 'تعديل الإعدادات', gradient: 'from-amber-400 to-amber-500' },
              { href: '/admin/options', icon: '🎛️', title: 'الخيارات', desc: `${stats.totalOptions} خيار`, gradient: 'from-emerald-400 to-emerald-500' },
              { href: '/admin/coupons', icon: '🎟️', title: 'الكوبونات', desc: `${stats.activeCoupons} نشط`, gradient: 'from-blue-400 to-blue-500' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group relative bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-rose-100/50 transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="font-black text-slate-800 text-lg mb-1">{action.title}</div>
                <div className="text-sm text-slate-500 font-bold">{action.desc}</div>
                {action.badge && (
                  <div className="absolute top-4 left-4 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center font-black text-xs animate-pulse-slow">
                    {action.badge}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-right" />
              </Link>
            ))}
          </div>
        </div>

        {admin?.role === 'super_admin' && (
          <Link
            href="/admin/admins"
            className="block bg-gradient-to-br from-amber-100 via-rose-100 to-emerald-100 rounded-3xl p-6 border-2 border-white shadow-lg hover:shadow-xl transition mb-6 animate-fadeIn"
            style={{ animationDelay: '0.45s' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-md">
                  🛡️
                </div>
                <div>
                  <div className="text-xl font-black text-slate-800">إدارة الأدمنز</div>
                  <div className="text-sm font-bold text-slate-600">
                    {stats.totalAdmins} أدمن مسجل — إضافة، تعديل، صلاحيات
                  </div>
                </div>
              </div>
              <div className="text-4xl">←</div>
            </div>
          </Link>
        )}

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-slate-800">🕐 آخر الطلبات</h2>
            <Link href="/admin/orders" className="text-sm font-black text-rose-500 hover:text-rose-600 transition">
              عرض الكل →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">📭</div>
              <p className="text-slate-500 font-black">مفيش طلبات لسه</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, bg: 'bg-slate-100', color: 'text-slate-700', icon: '•' }
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition border border-slate-100 hover:border-rose-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl flex items-center justify-center font-black text-rose-500 text-sm">
                      #{order.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-800 truncate">{order.customer_name}</div>
                      <div className="text-xs text-slate-500 font-bold">📱 {order.phone}</div>
                    </div>
                    <div className="hidden sm:block">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-rose-500">{Number(order.total_price).toFixed(0)} ج</div>
                      <div className="text-xs text-slate-500 font-bold">{new Date(order.created_at).toLocaleDateString('ar-EG')}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}