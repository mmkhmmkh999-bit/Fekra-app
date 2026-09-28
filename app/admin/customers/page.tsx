'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin, hasPermission } from '../../lib/auth'

type Customer = {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
  created_at: string
  last_login: string | null
  total_orders: number
  total_spent: number
  is_active: boolean
  notes: string | null
}

type CustomerWithOrders = Customer & {
  orders_count?: number
  orders_total?: number
  last_order?: string | null
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'top'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [message, setMessage] = useState('')
  const [editingNotes, setEditingNotes] = useState('')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    if (!hasPermission(a.role, 'orders') && !hasPermission(a.role, 'admins')) {
      router.push('/admin')
      return
    }
    setAdmin(a)
    loadCustomers()
  }, [router])

  async function loadCustomers() {
    setLoading(true)

    // جلب العملاء
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    // جلب كل الطلبات
    const { data: ordersData } = await supabase
      .from('orders')
      .select('customer_id, total_price, status, created_at')

    const customersWithStats = (customersData || []).map((c: Customer) => {
      const cOrders = (ordersData || []).filter((o: any) => o.customer_id === c.id)
      const validOrders = cOrders.filter((o: any) => o.status !== 'cancelled')
      return {
        ...c,
        orders_count: cOrders.length,
        orders_total: validOrders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0),
        last_order: cOrders.length > 0
          ? cOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null,
      }
    })

    setCustomers(customersWithStats)
    setLoading(false)
  }

  async function openCustomerDetails(customer: CustomerWithOrders) {
    setSelectedCustomer(customer)
    setEditingNotes(customer.notes || '')
    setLoadingOrders(true)

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    setCustomerOrders(data || [])
    setLoadingOrders(false)
  }

  async function saveNotes() {
    if (!selectedCustomer) return
    const { error } = await supabase
      .from('customers')
      .update({ notes: editingNotes })
      .eq('id', selectedCustomer.id)

    if (!error) {
      setMessage('✅ تم حفظ الملاحظات')
      loadCustomers()
      setSelectedCustomer({ ...selectedCustomer, notes: editingNotes })
    }
    setTimeout(() => setMessage(''), 3000)
  }

  async function toggleActive(id: number, current: boolean) {
    await supabase.from('customers').update({ is_active: !current }).eq('id', id)
    setMessage(current ? '✕ تم تعطيل الحساب' : '✓ تم تفعيل الحساب')
    loadCustomers()
    if (selectedCustomer?.id === id) {
      setSelectedCustomer({ ...selectedCustomer, is_active: !current })
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const filteredCustomers = customers.filter((c) => {
    const matchSearch = search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? c.is_active :
      (c.orders_total || 0) > 0
    return matchSearch && matchFilter
  })

  // إحصائيات
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.is_active).length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.orders_total || 0), 0)
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              👨‍💼
            </Link>
            <h1 className="text-xl font-black text-slate-800">👥 العملاء</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">👥</Link>
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

      <div className="max-w-7xl mx-auto p-6">
        {message && (
          <div className="mb-4 p-4 rounded-2xl font-black text-center bg-emerald-50 text-emerald-700 border-2 border-emerald-200 animate-fadeIn">
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-black text-slate-800">{totalCustomers}</div>
            <div className="text-sm text-slate-500 font-bold">إجمالي العملاء</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-black text-emerald-600">{activeCustomers}</div>
            <div className="text-sm text-slate-500 font-bold">حسابات مُفعّلة</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-black text-rose-500">{totalRevenue.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">إجمالي مشترياتهم</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-black text-amber-500">{avgSpent.toFixed(0)} ج</div>
            <div className="text-sm text-slate-500 font-bold">متوسط الشراء</div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث بالاسم، الإيميل، أو التليفون..."
            className="flex-1 min-w-[250px] border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-white text-slate-800 font-bold transition shadow-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'الكل', icon: '👥' },
              { id: 'active', label: 'نشط', icon: '✅' },
              { id: 'top', label: 'بائع', icon: '⭐' },
            ].map((f: any) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition ${
                  filter === f.id
                    ? 'bg-gradient-to-l from-rose-400 to-amber-400 text-white shadow-lg shadow-rose-200'
                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-500 font-black text-lg">مفيش عملاء</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-right p-4 font-black text-slate-700 text-sm">العميل</th>
                    <th className="text-right p-4 font-black text-slate-700 text-sm">التواصل</th>
                    <th className="text-center p-4 font-black text-slate-700 text-sm">الطلبات</th>
                    <th className="text-center p-4 font-black text-slate-700 text-sm">إجمالي الشراء</th>
                    <th className="text-center p-4 font-black text-slate-700 text-sm">الحالة</th>
                    <th className="text-center p-4 font-black text-slate-700 text-sm">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-rose-50/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-800">{c.name}</div>
                            <div className="text-xs text-slate-400 font-bold">
                              {new Date(c.created_at).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-700" dir="ltr">📧 {c.email}</div>
                        <div className="text-sm font-bold text-slate-600" dir="ltr">📱 {c.phone}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                          {c.orders_count || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-emerald-600">
                          {(c.orders_total || 0).toFixed(0)} ج
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleActive(c.id, c.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-black transition ${
                            c.is_active
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {c.is_active ? '✓ مُفعّل' : '✕ مُعطّل'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openCustomerDetails(c)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-l from-rose-400 to-amber-400 text-white font-black text-sm shadow-md hover:shadow-lg transition"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-800 truncate">{c.name}</div>
                      <div className="text-xs text-slate-500 font-bold truncate" dir="ltr">{c.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-rose-50 rounded-xl p-2">
                      <div className="text-xs text-slate-500 font-bold">الطلبات</div>
                      <div className="font-black text-rose-600">{c.orders_count || 0}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <div className="text-xs text-slate-500 font-bold">الشراء</div>
                      <div className="font-black text-emerald-600">{(c.orders_total || 0).toFixed(0)} ج</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openCustomerDetails(c)}
                    className="w-full bg-gradient-to-l from-rose-400 to-amber-400 text-white font-black py-2.5 rounded-xl shadow-md"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 py-8">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 p-6 text-white relative">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black text-xl transition"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/30 backdrop-blur-lg rounded-3xl flex items-center justify-center text-4xl font-black border-2 border-white/50">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black mb-1">{selectedCustomer.name}</h2>
                  <div className="text-white/90 font-bold text-sm" dir="ltr">📧 {selectedCustomer.email}</div>
                  <div className="text-white/90 font-bold text-sm" dir="ltr">📱 {selectedCustomer.phone}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                <div className="text-2xl font-black text-rose-500">{selectedCustomer.orders_count || 0}</div>
                <div className="text-xs text-slate-500 font-bold">طلب</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                <div className="text-2xl font-black text-emerald-600">{(selectedCustomer.orders_total || 0).toFixed(0)} ج</div>
                <div className="text-xs text-slate-500 font-bold">إجمالي</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                <div className="text-sm font-black text-amber-500">
                  {selectedCustomer.last_order
                    ? new Date(selectedCustomer.last_order).toLocaleDateString('ar-EG')
                    : '—'}
                </div>
                <div className="text-xs text-slate-500 font-bold">آخر طلب</div>
              </div>
            </div>

            {/* Info + Orders */}
            <div className="p-6 space-y-4">
              {/* Contact */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <h3 className="text-sm font-black text-slate-500 mb-2">📍 معلومات التواصل</h3>
                <p className="font-bold text-slate-800 text-sm mb-1" dir="ltr">📧 {selectedCustomer.email}</p>
                <p className="font-bold text-slate-800 text-sm mb-1" dir="ltr">📱 {selectedCustomer.phone}</p>
                {selectedCustomer.address && (
                  <p className="font-bold text-slate-800 text-sm">🏠 {selectedCustomer.address}</p>
                )}
                <p className="text-xs text-slate-400 font-bold mt-2">
                  📅 مسجل من: {new Date(selectedCustomer.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>

              {/* Notes */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <h3 className="text-sm font-black text-amber-700 mb-2">📝 ملاحظات الإدارة</h3>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  rows={3}
                  placeholder="اكتب أي ملاحظات عن العميل (اختياري)..."
                  className="w-full border-2 border-amber-200 focus:border-amber-400 rounded-xl p-3 focus:outline-none bg-white text-slate-800 font-bold resize-none"
                />
                <button
                  onClick={saveNotes}
                  className="mt-2 bg-gradient-to-l from-amber-400 to-amber-500 text-white font-black px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition text-sm"
                >
                  💾 حفظ الملاحظات
                </button>
              </div>

              {/* Orders */}
              <div>
                <h3 className="text-sm font-black text-slate-500 mb-3">📦 سجل الطلبات</h3>
                {loadingOrders ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-slate-500 font-bold text-sm">مفيش طلبات</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerOrders.map((order: any) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-100 hover:border-rose-200 transition"
                      >
                        <div>
                          <div className="font-black text-slate-800">#{order.id}</div>
                          <div className="text-xs text-slate-400 font-bold">
                            {new Date(order.created_at).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                        <div className="font-black text-rose-500">
                          {Number(order.total_price).toFixed(0)} ج
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => toggleActive(selectedCustomer.id, selectedCustomer.is_active)}
                  className={`flex-1 font-black py-3 rounded-2xl transition ${
                    selectedCustomer.is_active
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-2 border-emerald-200'
                  }`}
                >
                  {selectedCustomer.is_active ? '🚫 تعطيل الحساب' : '✓ تفعيل الحساب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}