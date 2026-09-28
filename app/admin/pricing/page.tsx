'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin } from '../../lib/auth'

type Setting = {
  key: string
  value: string
  label: string
}

type WeightOption = {
  id: number
  weight: number
  label: string
  price_add: number
  is_active: boolean
}

type OptionValue = {
  id: number
  option_id: number
  value: string
  price_add: number
  is_active: boolean
}

type ShippingZone = {
  id: number
  name: string
  cost: number
  is_active: boolean
}

export default function AdminPricingPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [settings, setSettings] = useState<Setting[]>([])
  const [weights, setWeights] = useState<WeightOption[]>([])
  const [bindingValues, setBindingValues] = useState<OptionValue[]>([])
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [bindingOptionId, setBindingOptionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingZones, setSavingZones] = useState(false)
  const [message, setMessage] = useState('')
  const [zoneMessage, setZoneMessage] = useState('')

  const [newWeight, setNewWeight] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const [newBindingValue, setNewBindingValue] = useState('')
  const [newBindingPrice, setNewBindingPrice] = useState('')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)
    loadData()
  }, [router])

  async function loadData() {
    setLoading(true)

    const { data: s } = await supabase.from('settings').select('*')
    setSettings((s as any) || [])

    const { data: w } = await supabase
      .from('weight_options').select('*').order('weight')
    setWeights(w || [])

    const { data: bindingOption } = await supabase
      .from('options').select('id').eq('name', 'التجليد').single()

    if (bindingOption) {
      setBindingOptionId(bindingOption.id)
      const { data: values } = await supabase
        .from('option_values').select('*').eq('option_id', bindingOption.id).order('id')
      setBindingValues(values || [])
    }

    const { data: zonesData } = await supabase
      .from('shipping_zones').select('*').order('id')
    setZones(zonesData || [])

    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')
    for (const s of settings) {
      await supabase.from('settings').update({ value: s.value, updated_at: new Date().toISOString() }).eq('key', s.key)
    }
    setSaving(false)
    setMessage('✅ تم حفظ الإعدادات')
    setTimeout(() => setMessage(''), 3000)
  }

  async function updateZone(id: number, updates: Partial<ShippingZone>) {
    await supabase.from('shipping_zones').update(updates).eq('id', id)
  }

  async function saveAllZones() {
    setSavingZones(true)
    setZoneMessage('')
    for (const z of zones) {
      await supabase.from('shipping_zones').update({ cost: z.cost, is_active: z.is_active }).eq('id', z.id)
    }
    setSavingZones(false)
    setZoneMessage('✅ تم حفظ أسعار الشحن')
    setTimeout(() => setZoneMessage(''), 3000)
  }

  async function applyToAll(cost: number) {
    if (!confirm(`هتحط ${cost} ج لكل المحافظات. متأكد؟`)) return
    setZones(zones.map(z => ({ ...z, cost })))
  }

  async function addWeight() {
    if (!newWeight || !newPrice) return
    const { error } = await supabase.from('weight_options').insert({
      weight: Number(newWeight),
      label: newLabel,
      price_add: Number(newPrice),
      is_active: true,
    })
    if (!error) {
      setNewWeight(''); setNewLabel(''); setNewPrice('')
      loadData()
    }
  }

  async function updateWeight(id: number, updates: Partial<WeightOption>) {
    await supabase.from('weight_options').update(updates).eq('id', id)
  }

  async function deleteWeight(id: number) {
    if (!confirm('متأكد من حذف الوزن ده؟')) return
    await supabase.from('weight_options').delete().eq('id', id)
    loadData()
  }

  async function addBinding() {
    if (!newBindingValue || !bindingOptionId) return
    const { error } = await supabase.from('option_values').insert({
      option_id: bindingOptionId,
      value: newBindingValue,
      price_add: Number(newBindingPrice) || 0,
      is_active: true,
    })
    if (!error) {
      setNewBindingValue(''); setNewBindingPrice('')
      loadData()
    }
  }

  async function updateBinding(id: number, updates: Partial<OptionValue>) {
    await supabase.from('option_values').update(updates).eq('id', id)
  }

  async function deleteBinding(id: number) {
    if (!confirm('متأكد من حذف نوع التجليد ده؟')) return
    await supabase.from('option_values').delete().eq('id', id)
    loadData()
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
            <h1 className="text-xl font-black text-slate-800">💰 الأسعار والشحن</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">💰</Link>
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
        {/* الشحن */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">🚚</span>
              أسعار الشحن ({zones.length} محافظة)
            </h2>
            <div className="flex items-center gap-2">
              {zoneMessage && <span className="text-emerald-600 font-black text-sm">{zoneMessage}</span>}
              <button
                onClick={saveAllZones}
                disabled={savingZones}
                className="bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black px-6 py-2.5 rounded-2xl disabled:opacity-50 transition shadow-lg text-sm"
              >
                {savingZones ? 'جاري الحفظ...' : '💾 حفظ الأسعار'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5 p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
            <span className="text-blue-700 font-black text-sm self-center">إجراءات سريعة:</span>
            <button
              onClick={() => applyToAll(30)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-700 font-black text-sm transition border border-blue-200"
            >
              كلهم 30 ج
            </button>
            <button
              onClick={() => applyToAll(45)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-700 font-black text-sm transition border border-blue-200"
            >
              كلهم 45 ج
            </button>
            <button
              onClick={() => applyToAll(60)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-700 font-black text-sm transition border border-blue-200"
            >
              كلهم 60 ج
            </button>
            <button
              onClick={() => {
                if (!confirm('هتصفر كل الأسعار. متأكد؟')) return
                applyToAll(0)
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-600 font-black text-sm transition border border-rose-200"
            >
              تصفير الكل
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex items-center gap-3 flex-wrap bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-blue-200 transition"
              >
                <div className={`w-2 h-10 rounded-full ${z.is_active ? 'bg-gradient-to-b from-blue-400 to-blue-500' : 'bg-slate-200'}`} />

                <div className="flex-1 min-w-[100px]">
                  <p className="font-black text-slate-800">{z.name}</p>
                </div>

                <div className="flex items-center gap-1 bg-blue-50 rounded-xl px-3 py-1.5 border border-blue-100">
                  <input
                    type="number"
                    value={z.cost}
                    onChange={(e) => {
                      setZones(zones.map(zz =>
                        zz.id === z.id ? { ...zz, cost: Number(e.target.value) } : zz
                      ))
                    }}
                    className="w-20 bg-transparent text-center text-slate-800 font-black focus:outline-none"
                  />
                  <span className="text-blue-600 font-black text-sm">ج</span>
                </div>

                <button
                  onClick={() => {
                    const updated = !z.is_active
                    setZones(zones.map(zz => zz.id === z.id ? { ...zz, is_active: updated } : zz))
                    updateZone(z.id, { is_active: updated })
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-black transition ${
                    z.is_active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {z.is_active ? 'مُفعّل' : 'مُعطّل'}
                </button>
              </div>
            ))}
          </div>

          {zones.length === 0 && (
            <p className="text-center py-6 text-slate-500 font-bold">مفيش محافظات. نفذ كود SQL الأول.</p>
          )}
        </div>

        {/* الإعدادات العامة */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center">⚙️</span>
            الإعدادات العامة
          </h2>
          <div className="space-y-3">
            {settings.map((s, i) => (
              <div key={s.key} className="flex items-center gap-4 flex-wrap">
                <label className="w-full md:w-56 font-black text-slate-700 text-sm">
                  {s.label || s.key}
                </label>
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => {
                    const arr = [...settings]
                    arr[i].value = e.target.value
                    setSettings(arr)
                  }}
                  className="flex-1 min-w-[200px] border-2 border-slate-100 focus:border-rose-300 rounded-xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-gradient-to-l from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black px-6 py-3 rounded-2xl disabled:opacity-50 transition shadow-lg"
            >
              {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
            </button>
            {message && <span className="text-emerald-600 font-black">{message}</span>}
          </div>
        </div>

        {/* أوزان الورق */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">📏</span>
            أوزان الورق
          </h2>

          <div className="flex flex-wrap gap-2 mb-5 p-4 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200">
            <input
              type="number"
              placeholder="الوزن (جرام)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="border-2 border-slate-100 focus:border-amber-300 rounded-xl p-2.5 w-32 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="الاسم (اختياري)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="border-2 border-slate-100 focus:border-amber-300 rounded-xl p-2.5 flex-1 min-w-[120px] focus:outline-none bg-white"
            />
            <input
              type="number"
              placeholder="السعر الإضافي"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="border-2 border-slate-100 focus:border-amber-300 rounded-xl p-2.5 w-32 focus:outline-none bg-white"
            />
            <button
              onClick={addWeight}
              className="bg-gradient-to-l from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black px-5 py-2.5 rounded-xl transition shadow-md"
            >
              ➕ إضافة
            </button>
          </div>

          <div className="space-y-2">
            {weights.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 flex-wrap bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-amber-200 transition"
              >
                <div className={`w-2 h-8 rounded-full ${w.is_active ? 'bg-gradient-to-b from-emerald-400 to-emerald-500' : 'bg-slate-200'}`} />
                <input
                  type="number"
                  value={w.weight}
                  onChange={(e) => updateWeight(w.id, { weight: Number(e.target.value) })}
                  className="w-24 border-2 border-slate-100 focus:border-amber-300 rounded-lg p-2 text-center bg-white text-slate-800 font-bold focus:outline-none"
                />
                <span className="text-sm text-slate-500 font-black">جم</span>
                <input
                  type="text"
                  value={w.label || ''}
                  placeholder="الاسم"
                  onChange={(e) => updateWeight(w.id, { label: e.target.value })}
                  className="flex-1 min-w-[150px] border-2 border-slate-100 focus:border-amber-300 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                />
                <div className="flex items-center gap-1 bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-100">
                  <span className="text-amber-600 font-black text-sm">+</span>
                  <input
                    type="number"
                    value={w.price_add}
                    onChange={(e) => updateWeight(w.id, { price_add: Number(e.target.value) })}
                    className="w-20 bg-transparent text-center text-slate-800 font-black focus:outline-none"
                  />
                  <span className="text-amber-600 font-black text-sm">ج</span>
                </div>
                <button
                  onClick={() => updateWeight(w.id, { is_active: !w.is_active })}
                  className={`px-3 py-1 rounded-full text-xs font-black transition ${
                    w.is_active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {w.is_active ? 'مُفعّل' : 'مُعطّل'}
                </button>
                <button
                  onClick={() => deleteWeight(w.id)}
                  className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 font-bold transition flex items-center justify-center"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* التجليد */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-black mb-4 text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">🔗</span>
            أنواع التجليد
          </h2>

          <div className="flex flex-wrap gap-2 mb-5 p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
            <input
              type="text"
              placeholder="اسم نوع التجليد (مثلاً: سلك)"
              value={newBindingValue}
              onChange={(e) => setNewBindingValue(e.target.value)}
              className="border-2 border-slate-100 focus:border-purple-300 rounded-xl p-2.5 flex-1 min-w-[150px] focus:outline-none bg-white"
            />
            <input
              type="number"
              placeholder="السعر الإضافي"
              value={newBindingPrice}
              onChange={(e) => setNewBindingPrice(e.target.value)}
              className="border-2 border-slate-100 focus:border-purple-300 rounded-xl p-2.5 w-32 focus:outline-none bg-white"
            />
            <button
              onClick={addBinding}
              className="bg-gradient-to-l from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black px-5 py-2.5 rounded-xl transition shadow-md"
            >
              ➕ إضافة
            </button>
          </div>

          <div className="space-y-2">
            {bindingValues.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 flex-wrap bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-purple-200 transition"
              >
                <div className={`w-2 h-8 rounded-full ${b.is_active ? 'bg-gradient-to-b from-emerald-400 to-emerald-500' : 'bg-slate-200'}`} />
                <input
                  type="text"
                  value={b.value}
                  onChange={(e) => updateBinding(b.id, { value: e.target.value })}
                  className="flex-1 min-w-[150px] border-2 border-slate-100 focus:border-purple-300 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                />
                <div className="flex items-center gap-1 bg-purple-50 rounded-xl px-3 py-1.5 border border-purple-100">
                  <span className="text-purple-600 font-black text-sm">+</span>
                  <input
                    type="number"
                    value={b.price_add}
                    onChange={(e) => updateBinding(b.id, { price_add: Number(e.target.value) })}
                    className="w-20 bg-transparent text-center text-slate-800 font-black focus:outline-none"
                  />
                  <span className="text-purple-600 font-black text-sm">ج</span>
                </div>
                <button
                  onClick={() => updateBinding(b.id, { is_active: !b.is_active })}
                  className={`px-3 py-1 rounded-full text-xs font-black transition ${
                    b.is_active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {b.is_active ? 'مُفعّل' : 'مُعطّل'}
                </button>
                <button
                  onClick={() => deleteBinding(b.id)}
                  className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 font-bold transition flex items-center justify-center"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}