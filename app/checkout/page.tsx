'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { getCurrentCustomer } from '../lib/auth'

type OrderItem = {
  optionId: number
  optionName: string
  optionIcon: string
  valueId?: number
  valueText: string
  price: number
}

type OrderData = {
  items: OrderItem[]
  designText: string
  designImageUrl: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

type ShippingZone = {
  id: number
  name: string
  cost: number
}

type Coupon = {
  id: number
  code: string
  discount_type: string
  discount_value: number
  min_order: number
  max_uses: number
  uses_count: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [selectedZone, setSelectedZone] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingOrder')
    if (!stored) {
      router.push('/customize')
      return
    }
    setOrderData(JSON.parse(stored))

    // auto-fill from logged in customer
    const c = getCurrentCustomer()
    if (c) {
      setName(c.name)
      setPhone(c.phone)
    }

    async function loadZones() {
      const { data } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('is_active', true)
        .order('id')
      setZones(data || [])
      if (data && data.length > 0) setSelectedZone(data[0].id)
      setLoading(false)
    }
    loadZones()
  }, [router])

  const shippingCost = zones.find((z) => z.id === selectedZone)?.cost || 0
  const subtotal = orderData?.totalPrice || 0
  const finalTotal = subtotal + shippingCost - discountAmount

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCheckingCoupon(true)

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      showToast('الكوبون غير صحيح أو غير مُفعّل', 'error')
      setCheckingCoupon(false)
      return
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      showToast('الكوبون منتهي الصلاحية', 'error')
      setCheckingCoupon(false)
      return
    }

    if (data.uses_count >= data.max_uses) {
      showToast('الكوبون استُخدم بالكامل', 'error')
      setCheckingCoupon(false)
      return
    }

    if (subtotal < data.min_order) {
      showToast(`الكوبون يحتاج طلب بحد أدنى ${data.min_order} ج`, 'error')
      setCheckingCoupon(false)
      return
    }

    const discount =
      data.discount_type === 'percentage'
        ? (subtotal * data.discount_value) / 100
        : data.discount_value

    setAppliedCoupon(data)
    setDiscountAmount(discount)
    showToast(`تم تطبيق الخصم: -${discount.toFixed(2)} ج ✓`, 'success')
    setCheckingCoupon(false)
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setDiscountAmount(0)
    showToast('تم إلغاء الكوبون', 'info')
  }

  async function submitOrder() {
    if (!name || !phone || !address || !selectedZone) {
      showToast('من فضلك اكمل كل البيانات', 'warning')
      return
    }
    if (!orderData) return

    setSubmitting(true)
    const customer = getCurrentCustomer()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: name,
        phone,
        address,
        shipping_cost: shippingCost,
        total_price: finalTotal,
        status: 'pending',
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discountAmount,
        customer_id: customer?.id || null,
      })
      .select()
      .single()

    if (error || !order) {
      showToast('حدث خطأ: ' + error?.message, 'error')
      setSubmitting(false)
      return
    }

    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      quantity: orderData.quantity,
      unit_price: orderData.unitPrice,
      selected_options: orderData.items,
      custom_design_text: orderData.designText,
      custom_design_image_url: orderData.designImageUrl,
    })

    if (itemError) {
      showToast('حدث خطأ في تفاصيل الطلب: ' + itemError.message, 'error')
      setSubmitting(false)
      return
    }

    if (appliedCoupon) {
      await supabase
        .from('coupons')
        .update({ uses_count: appliedCoupon.uses_count + 1 })
        .eq('id', appliedCoupon.id)
    }

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    }).catch((err) => console.error('Email error:', err))

    sessionStorage.removeItem('pendingOrder')
    router.push(`/order-success?id=${order.id}`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  if (!orderData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 p-6 py-10" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3">
            🛒 إتمام الطلب
          </h1>
          <p className="text-lg text-slate-600 font-bold">
            اكمل بياناتك وهنوصلك كراستك بأسرع وقت
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ملخص الطلب */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-rose-100">
            <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-xl flex items-center justify-center">📋</span>
              ملخص الطلب
            </h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
              {orderData.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center gap-3">
                  <span className="text-slate-600 font-bold text-sm flex items-center gap-1.5">
                    <span className="text-lg">{item.optionIcon}</span>
                    {item.optionName}:
                  </span>
                  <span className="font-black text-slate-800 text-sm text-left">
                    {item.valueText}
                    {item.price > 0 && (
                      <span className="text-amber-600 mr-2 text-xs">(+{item.price} ج)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {(orderData.designText || orderData.designImageUrl) && (
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                {orderData.designText && (
                  <div>
                    <p className="text-slate-500 font-bold text-xs mb-1">🎨 وصف التصميم</p>
                    <p className="text-slate-800 font-bold text-sm whitespace-pre-wrap">{orderData.designText}</p>
                  </div>
                )}
                {orderData.designImageUrl && (
                  <div>
                    <p className="text-slate-500 font-bold text-xs mb-2">📸 صورة التصميم</p>
                    <img src={orderData.designImageUrl} alt="تصميم" className="w-24 h-24 object-cover rounded-xl border-2 border-rose-100" />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold text-sm">الكمية</span>
                <span className="font-black text-slate-800">{orderData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold text-sm">سعر الواحدة</span>
                <span className="font-black text-slate-800">{orderData.unitPrice.toFixed(2)} ج</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold text-sm">إجمالي المنتج</span>
                <span className="font-black text-slate-800">{orderData.totalPrice.toFixed(2)} ج</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold text-sm">الشحن ({zones.find(z => z.id === selectedZone)?.name || '—'})</span>
                <span className="font-black text-slate-800">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600">مجانًا</span>
                  ) : (
                    `${shippingCost.toFixed(2)} ج`
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50 rounded-xl p-3 -mx-1">
                  <span className="font-black text-sm">🎟️ الخصم ({appliedCoupon?.code})</span>
                  <span className="font-black">-{discountAmount.toFixed(2)} ج</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">الإجمالي النهائي</span>
                <span className="text-3xl font-black bg-gradient-to-l from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                  {finalTotal.toFixed(2)} ج
                </span>
              </div>
            </div>
          </div>

          {/* بيانات العميل */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-rose-100">
            <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-xl flex items-center justify-center">📝</span>
              بياناتك
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2 font-black text-slate-700 text-sm">👤 الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                  placeholder="اكتب اسمك"
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
                />
              </div>

              <div>
                <label className="block mb-2 font-black text-slate-700 text-sm">📍 العنوان بالتفصيل</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition resize-none"
                  placeholder="المدينة، الشارع، رقم المبنى"
                />
              </div>

              <div>
                <label className="block mb-2 font-black text-slate-700 text-sm">
                  🗺️ المحافظة ({zones.length} متاحة)
                </label>
                <select
                  value={selectedZone || ''}
                  onChange={(e) => setSelectedZone(Number(e.target.value))}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 focus:outline-none bg-slate-50/50 text-slate-800 font-black transition cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} {z.cost > 0 ? `— ${z.cost} ج` : '— مجانًا'}
                    </option>
                  ))}
                </select>
                {selectedZone && shippingCost === 0 && (
                  <p className="text-emerald-600 font-black text-xs mt-2">🎉 الشحن مجاني للمحافظة دي!</p>
                )}
              </div>

              {/* الكوبون */}
              <div className="border-2 border-dashed border-amber-200 rounded-2xl p-4 bg-amber-50/50">
                <label className="block mb-2 font-black text-amber-700 text-sm">🎟️ عندك كوبون خصم؟</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود"
                    disabled={!!appliedCoupon}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !appliedCoupon) applyCoupon() }}
                    className="flex-1 border-2 border-amber-100 rounded-xl p-3 focus:border-amber-400 focus:outline-none bg-white text-slate-800 font-black tracking-widest disabled:opacity-50"
                  />
                  {appliedCoupon ? (
                    <button onClick={removeCoupon} className="bg-red-500 hover:bg-red-600 text-white font-black px-5 rounded-xl transition">
                      إلغاء
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      disabled={checkingCoupon || !couponCode.trim()}
                      className="bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-5 rounded-xl disabled:opacity-50 transition"
                    >
                      {checkingCoupon ? '...' : 'تطبيق'}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-emerald-600 font-black text-sm mt-2">
                    ✓ تم تطبيق خصم {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} ج`}
                  </p>
                )}
              </div>

              <button
                onClick={submitOrder}
                disabled={submitting}
                className="w-full bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black py-5 rounded-2xl text-lg transition-all shadow-xl shadow-rose-200 hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري إرسال الطلب...
                  </span>
                ) : (
                  '✅ تأكيد الطلب'
                )}
              </button>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  دفع آمن 100%
                </div>
                <div className="text-slate-300">•</div>
                <div className="text-xs text-slate-500 font-bold">🚚 توصيل سريع</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}