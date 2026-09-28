'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

type OptionValue = {
  id: number
  option_id: number
  value: string
  price_add: number
  is_active: boolean
}

type Option = {
  id: number
  name: string
  icon: string
  description: string
  is_required: boolean
  display_type: string
  allow_custom_input: boolean
  display_order: number
  option_values: OptionValue[]
}

type OrderItem = {
  optionId: number
  optionName: string
  optionIcon: string
  valueId?: number
  valueText: string
  price: number
}

export default function CustomizePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [options, setOptions] = useState<Option[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [designPrice, setDesignPrice] = useState(0)
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({})
  const [quantity, setQuantity] = useState('')
  const [designText, setDesignText] = useState('')
  const [designImage, setDesignImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: optionsData } = await supabase
        .from('options')
        .select('*, option_values(*)')
        .eq('is_active', true)
        .order('display_order')

      const cleaned = (optionsData || []).map((o: any) => ({
        ...o,
        option_values: (o.option_values || [])
          .filter((v: OptionValue) => v.is_active)
          .sort((a: OptionValue, b: OptionValue) => a.id - b.id),
      }))

      setOptions(cleaned)

      const defaults: Record<number, number> = {}
      cleaned.forEach((o: Option) => {
        if (o.option_values.length > 0 && o.display_type !== 'number') {
          defaults[o.id] = o.option_values[0].id
        }
      })
      setSelections(defaults)

      const { data: settingsData } = await supabase.from('settings').select('*')
      settingsData?.forEach((s) => {
        if (s.key === 'base_price') setBasePrice(Number(s.value))
        if (s.key === 'design_price') setDesignPrice(Number(s.value))
      })

      setLoading(false)
    }
    loadData()
  }, [])

  const calculateUnitPrice = () => {
    let total = basePrice
    options.forEach((o) => {
      if (o.display_type === 'number') {
        const num = Number(customInputs[o.id]) || 0
        const match = o.option_values.find((v) => Number(v.value) === num)
        total += match?.price_add || 0
      } else {
        const sel = selections[o.id]
        if (sel) {
          const v = o.option_values.find((vv) => vv.id === sel)
          if (v) total += v.price_add
        }
        if (o.allow_custom_input && customInputs[o.id]) {
          const fallback = o.option_values[0]?.price_add || 0
          total += fallback
        }
      }
    })
    if (designText || designImage) total += designPrice
    return total
  }

  const unitPrice = calculateUnitPrice()
  const totalPrice = unitPrice * (Number(quantity) || 0)

  const collectOrderItems = (): OrderItem[] => {
    const items: OrderItem[] = []
    options.forEach((o) => {
      if (o.display_type === 'number') {
        if (customInputs[o.id]) {
          const num = Number(customInputs[o.id])
          const match = o.option_values.find((v) => Number(v.value) === num)
          items.push({
            optionId: o.id,
            optionName: o.name,
            optionIcon: o.icon,
            valueText: customInputs[o.id],
            price: match?.price_add || 0,
          })
        }
      } else {
        const sel = selections[o.id]
        const v = o.option_values.find((vv) => vv.id === sel)
        if (v) {
          items.push({
            optionId: o.id,
            optionName: o.name,
            optionIcon: o.icon,
            valueId: v.id,
            valueText: v.value,
            price: v.price_add,
          })
        }
        if (o.allow_custom_input && customInputs[o.id]) {
          items.push({
            optionId: o.id,
            optionName: o.name + ' (مخصص)',
            optionIcon: o.icon,
            valueText: customInputs[o.id],
            price: 0,
          })
        }
      }
    })
    return items
  }

  const goToCheckout = async () => {
    if (!quantity) {
      showToast('من فضلك اكتب الكمية', 'warning')
      return
    }

    for (const o of options) {
      if (o.is_required) {
        if (o.display_type === 'number' && !customInputs[o.id]) {
          showToast(`من فضلك اكتب ${o.name}`, 'warning')
          return
        }
        if (o.display_type !== 'number' && !selections[o.id] && !customInputs[o.id]) {
          showToast(`من فضلك اختار ${o.name}`, 'warning')
          return
        }
      }
    }

    const items = collectOrderItems()

    const orderData = {
      items,
      designText,
      designImageUrl: '',
      quantity: Number(quantity),
      unitPrice,
      totalPrice,
    }

    if (designImage) {
      const fileName = `${Date.now()}-${designImage.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('design')
        .upload(fileName, designImage)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('design').getPublicUrl(uploadData.path)
        orderData.designImageUrl = urlData.publicUrl
      }
    }

    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
    router.push('/checkout')
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-700 font-black">جاري التحميل...</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 pb-40" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-slate-700 hover:text-rose-500 font-black transition flex items-center gap-2">
            ← رجوع
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-l from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            🎨 تصميم الكراسة
          </h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3">
            اصنع كراستك المثالية
          </h1>
          <p className="text-lg text-slate-600 font-bold">
            اتبع الخطوات، والسعر بيتحدّث تلقائيًا
          </p>
        </div>

        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className="bg-white rounded-3xl shadow-sm p-6 border border-rose-100 hover:shadow-lg hover:shadow-rose-100/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <label className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <span>{opt.icon}</span>
                    {opt.name}
                    {opt.is_required && <span className="text-rose-500 text-sm">*</span>}
                  </label>
                  {opt.description && (
                    <p className="text-sm text-slate-500 font-bold">{opt.description}</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              {opt.display_type === 'buttons' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {opt.option_values.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelections({ ...selections, [opt.id]: v.id })
                        if (!opt.allow_custom_input) {
                          setCustomInputs({ ...customInputs, [opt.id]: '' })
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all text-right ${
                        selections[opt.id] === v.id
                          ? 'border-rose-400 bg-rose-50 shadow-lg shadow-rose-100'
                          : 'border-slate-100 bg-slate-50/50 hover:border-rose-200 hover:bg-rose-50/30'
                      }`}
                    >
                      <div className="font-black text-slate-800">{v.value}</div>
                      {v.price_add > 0 ? (
                        <div className="text-sm text-amber-600 font-black mt-1">
                          +{v.price_add} ج
                        </div>
                      ) : (
                        <div className="text-sm text-emerald-600 font-black mt-1">
                          مجانًا
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Dropdown */}
              {opt.display_type === 'dropdown' && (
                <select
                  value={selections[opt.id] || ''}
                  onChange={(e) => setSelections({ ...selections, [opt.id]: Number(e.target.value) })}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 text-lg font-black bg-white text-slate-800 focus:outline-none transition cursor-pointer"
                >
                  <option value="">-- اختر --</option>
                  {opt.option_values.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.value} {v.price_add > 0 ? `(+${v.price_add} ج)` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Number Input */}
              {opt.display_type === 'number' && (
                <input
                  type="number"
                  value={customInputs[opt.id] || ''}
                  onChange={(e) => setCustomInputs({ ...customInputs, [opt.id]: e.target.value })}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 text-lg font-black bg-white text-slate-800 focus:outline-none transition"
                  placeholder="اكتب القيمة"
                />
              )}

              {/* Custom Input */}
              {opt.allow_custom_input && opt.display_type !== 'number' && (
                <input
                  type="text"
                  value={customInputs[opt.id] || ''}
                  onChange={(e) => {
                    setCustomInputs({ ...customInputs, [opt.id]: e.target.value })
                    if (e.target.value) setSelections({ ...selections, [opt.id]: 0 })
                  }}
                  className="w-full border-2 border-dashed border-rose-200 rounded-2xl p-3 mt-3 text-slate-800 font-bold bg-rose-50/30 focus:border-rose-400 focus:outline-none transition"
                  placeholder="أو اكتب قيمة مخصصة..."
                />
              )}
            </div>
          ))}

          {/* التصميم */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-rose-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                🎨
              </div>
              <label className="text-xl font-black text-slate-800">
                التصميم (اختياري)
              </label>
            </div>
            <textarea
              value={designText}
              onChange={(e) => setDesignText(e.target.value)}
              rows={3}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 text-slate-800 font-bold bg-slate-50/50 focus:outline-none transition mb-3 resize-none"
              placeholder="اكتب وصف للتصميم اللي عايزه..."
            />
            <label className="flex items-center justify-center gap-3 border-2 border-dashed border-rose-200 rounded-2xl p-6 cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition">
              <span className="text-3xl">📸</span>
              <div>
                <p className="font-black text-slate-800">
                  {designImage ? designImage.name : 'ارفع صورة التصميم'}
                </p>
                <p className="text-xs text-slate-500 font-bold">
                  {designImage ? '✓ تم الاختيار' : 'اضغط لاختيار صورة'}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDesignImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {/* الكمية */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-rose-100">
            <label className="text-xl font-black text-slate-800 block mb-4 flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                📦
              </span>
              الكمية
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-4 text-lg font-black bg-white text-slate-800 focus:outline-none transition"
              placeholder="اكتب الكمية"
            />
          </div>
        </div>
      </div>

      {/* Sticky Price Bar */}
      <div className="fixed bottom-0 right-0 left-0 bg-white/95 backdrop-blur-xl border-t-2 border-rose-100 shadow-2xl z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 font-black">سعر الواحدة</p>
            <p className="text-lg font-black text-slate-800">
              {unitPrice.toFixed(2)} ج
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500 font-black">الإجمالي</p>
            <p className="text-3xl font-black bg-gradient-to-l from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
              {totalPrice.toFixed(2)} ج
            </p>
          </div>
          <button
            onClick={goToCheckout}
            className="bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-rose-200 hover:shadow-2xl transform hover:-translate-y-1"
          >
            🛒 اطلب الآن
          </button>
        </div>
      </div>
    </div>
  )
}