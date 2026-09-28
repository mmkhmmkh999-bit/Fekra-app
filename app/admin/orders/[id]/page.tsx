'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getCurrentAdmin } from '../../../lib/auth'

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

type OrderItem = {
  id: number
  order_id: number
  quantity: number
  unit_price: number
  selected_options: any
  custom_design_text: string
  custom_design_image_url: string
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'processing', label: 'قيد التنفيذ' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
]

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    loadOrder()
  }, [router])

  async function loadOrder() {
    setLoading(true)
    const { data: orderData } = await supabase
      .from('orders').select('*').eq('id', orderId).single()
    if (orderData) setOrder(orderData)

    const { data: itemsData } = await supabase
      .from('order_items').select('*').eq('order_id', orderId)
    if (itemsData) setItems(itemsData)
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    if (!order) return
    setSaving(true)
    const { error } = await supabase
      .from('orders').update({ status: newStatus }).eq('id', order.id)
    if (!error) {
      setOrder({ ...order, status: newStatus })
      setMessage('✅ تم تحديث الحالة')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 2000)
  }

  async function deleteOrder() {
    if (!order) return
    if (!confirm(`متأكد من حذف الطلب #${order.id} للعميل "${order.customer_name}"؟\n\n⚠️ ده هيمسح الطلب وكل تفاصيله نهائيًا!`)) return

    setDeleting(true)
    await supabase.from('order_items').delete().eq('order_id', order.id)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)

    if (error) {
      setMessage('❌ حدث خطأ')
      setDeleting(false)
    } else {
      router.push('/admin/orders')
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-slate-800 font-black text-xl">الطلب غير موجود</p>
        </div>
      </div>
    )

  const subtotal = Number(order.total_price) - Number(order.shipping_cost) + Number(order.discount_amount || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-rose-500 hover:text-rose-600 font-black mb-4 flex items-center gap-2 transition"
        >
          ← رجوع للطلبات
        </button>

        {message && (
          <div className="mb-4 p-3 rounded-2xl font-black text-center bg-emerald-50 text-emerald-700 border-2 border-emerald-200">
            {message}
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              #{order.id}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">تفاصيل الطلب</h1>
              <p className="text-sm text-slate-500 font-bold">
                {new Date(order.created_at).toLocaleString('ar-EG')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={saving}
              className="border-2 border-slate-200 rounded-2xl p-3 font-black focus:border-rose-400 focus:outline-none bg-white text-slate-800 cursor-pointer transition"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {saving && <span className="text-rose-500 font-bold text-sm">جاري الحفظ...</span>}

            <button
              onClick={deleteOrder}
              disabled={deleting}
              className="px-4 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black transition disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>🗑️ حذف الطلب</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center">
              👤
            </span>
            بيانات العميل
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs font-black mb-1">الاسم</p>
              <p className="font-black text-slate-800 text-lg">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-black mb-1">التليفون</p>
              <a href={`tel:${order.phone}`} className="font-black text-rose-500 hover:text-rose-600 text-lg">
                {order.phone}
              </a>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500 text-xs font-black mb-1">العنوان</p>
              <p className="font-bold text-slate-800">{order.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
              📓
            </span>
            تفاصيل الكراسة
          </h2>
          {items.map((item) => (
            <div key={item.id} className="border-b last:border-b-0 pb-4 mb-4 last:pb-0 last:mb-0">
              <div className="bg-slate-50 rounded-2xl p-4 mb-3">
                {Array.isArray(item.selected_options) &&
                  item.selected_options.map((opt: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-bold text-sm">
                        {opt.optionIcon} {opt.optionName}:
                      </span>
                      <span className="font-black text-slate-800 text-sm">
                        {opt.valueText}
                        {opt.price > 0 && (
                          <span className="text-amber-600 mr-2 text-xs">(+{opt.price} ج)</span>
                        )}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <p className="text-slate-500 text-xs font-black">الكمية</p>
                  <p className="font-black text-slate-800 text-lg">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-black">سعر الواحدة</p>
                  <p className="font-black text-slate-800 text-lg">{item.unit_price} ج</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-black">الإجمالي</p>
                  <p className="font-black text-rose-500 text-lg">
                    {(Number(item.unit_price) * item.quantity).toFixed(2)} ج
                  </p>
                </div>
              </div>

              {item.custom_design_text && (
                <div className="mt-3 bg-rose-50 rounded-2xl p-4">
                  <p className="text-rose-600 text-xs font-black mb-1">🎨 وصف التصميم</p>
                  <p className="font-bold text-slate-800 whitespace-pre-wrap text-sm">
                    {item.custom_design_text}
                  </p>
                </div>
              )}

              {item.custom_design_image_url && (
                <div className="mt-3">
                  <p className="text-slate-500 text-xs font-black mb-2">📸 صورة التصميم</p>
                  <a href={item.custom_design_image_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={item.custom_design_image_url}
                      alt="تصميم"
                      className="max-w-xs rounded-2xl shadow-md border-2 border-rose-100 hover:border-rose-300 transition cursor-pointer"
                    />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
              💰
            </span>
            الحسابات
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">سعر المنتج:</span>
              <span className="font-black text-slate-800">{subtotal.toFixed(2)} ج</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">الشحن:</span>
              <span className="font-black text-slate-800">
                {Number(order.shipping_cost).toFixed(2)} ج
              </span>
            </div>

            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between bg-emerald-50 rounded-xl p-3 -mx-1">
                <span className="text-emerald-600 font-black text-sm">
                  🎟️ الخصم ({order.coupon_code}):
                </span>
                <span className="font-black text-emerald-600">
                  -{Number(order.discount_amount).toFixed(2)} ج
                </span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t-2 border-slate-100">
              <span className="text-xl font-black text-slate-800">الإجمالي:</span>
              <span className="text-3xl font-black bg-gradient-to-l from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                {Number(order.total_price).toFixed(2)} ج
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-rose-50 border-2 border-rose-200 rounded-3xl p-6">
          <h3 className="text-lg font-black text-rose-700 mb-2 flex items-center gap-2">
            ⚠️ منطقة الخطر
          </h3>
          <p className="text-rose-600 font-bold text-sm mb-4">
            حذف الطلب نهائيًا وكل تفاصيله. العملية دي **لا يمكن الرجوع عنها**.
          </p>
          <button
            onClick={deleteOrder}
            disabled={deleting}
            className="bg-rose-500 hover:bg-rose-600 text-white font-black px-6 py-3 rounded-2xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>🗑️ حذف الطلب نهائيًا</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}