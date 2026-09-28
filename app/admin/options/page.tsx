'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getCurrentAdmin } from '../../lib/auth'

type OptionValue = {
  id: number
  option_id: number
  value: string
  price_add: number
  is_active: boolean
  display_order: number
}

type Option = {
  id: number
  name: string
  icon: string
  description: string
  is_active: boolean
  is_required: boolean
  display_type: string
  allow_custom_input: boolean
  display_order: number
  option_values: OptionValue[]
}

export default function AdminOptionsPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOption, setExpandedOption] = useState<number | null>(null)
  const [showAddOption, setShowAddOption] = useState(false)

  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('📝')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState('buttons')

  useEffect(() => {
    const a = getCurrentAdmin()
    if (!a) {
      router.push('/login')
      return
    }
    setAdmin(a)
    loadOptions()
  }, [router])

  async function loadOptions() {
    setLoading(true)
    const { data } = await supabase
      .from('options')
      .select('*, option_values(*)')
      .order('display_order')
    setOptions((data as any) || [])
    setLoading(false)
  }

  async function addOption() {
    if (!newName) return
    const { error } = await supabase.from('options').insert({
      name: newName,
      icon: newIcon,
      description: newDesc,
      display_type: newType,
      is_active: true,
      is_required: true,
      display_order: options.length + 1,
    })
    if (!error) {
      setNewName('')
      setNewIcon('📝')
      setNewDesc('')
      setNewType('buttons')
      setShowAddOption(false)
      loadOptions()
    }
  }

  async function updateOption(id: number, updates: Partial<Option>) {
    await supabase.from('options').update(updates).eq('id', id)
  }

  async function deleteOption(id: number) {
    if (!confirm('متأكد؟ ده هيمسح كل القيم المرتبطة بيه!')) return
    await supabase.from('options').delete().eq('id', id)
    loadOptions()
  }

  async function addValue(optionId: number, value: string, price: string) {
    if (!value) return
    await supabase.from('option_values').insert({
      option_id: optionId,
      value,
      price_add: Number(price) || 0,
      is_active: true,
    })
    loadOptions()
  }

  async function updateValue(id: number, updates: Partial<OptionValue>) {
    await supabase.from('option_values').update(updates).eq('id', id)
  }

  async function deleteValue(id: number) {
    if (!confirm('متأكد من حذف القيمة؟')) return
    await supabase.from('option_values').delete().eq('id', id)
    loadOptions()
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <nav className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              👨‍💼
            </Link>
            <h1 className="text-xl font-black text-slate-800">🎛️ الخيارات</h1>
          </div>
          <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 flex-wrap">
            <Link href="/admin" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">🏠</Link>
            <Link href="/admin/orders" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">📦</Link>
            <Link href="/admin/customers" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">👥</Link>
            <Link href="/admin/pricing" className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-white text-sm">💰</Link>
            <Link href="/admin/options" className="px-3 py-2 rounded-xl font-bold bg-gradient-to-l from-rose-500 to-amber-500 text-white text-sm">🎛️</Link>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">🎛️</div>
              <div>
                <p className="text-2xl font-black text-slate-800">{options.length}</p>
                <p className="text-xs text-slate-500 font-bold">خيار</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">✅</div>
              <div>
                <p className="text-2xl font-black text-slate-800">{options.filter(o => o.is_active).length}</p>
                <p className="text-xs text-slate-500 font-bold">مُفعّل</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">📝</div>
              <div>
                <p className="text-2xl font-black text-slate-800">
                  {options.reduce((sum, o) => sum + (o.option_values?.length || 0), 0)}
                </p>
                <p className="text-xs text-slate-500 font-bold">قيمة</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          {!showAddOption ? (
            <button
              onClick={() => setShowAddOption(true)}
              className="w-full bg-white hover:bg-gradient-to-l hover:from-rose-50 hover:to-amber-50 border-2 border-dashed border-rose-200 hover:border-rose-300 text-rose-500 font-black py-5 rounded-3xl transition-all flex items-center justify-center gap-3 group"
            >
              <span className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-rose-200">+</span>
              إضافة خيار جديد
            </button>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-rose-100/50 p-6 border border-rose-100 animate-fadeIn">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="text-2xl">✨</span> خيار جديد
                </h2>
                <button
                  onClick={() => setShowAddOption(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-black transition"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">اسم الخيار</label>
                  <input
                    type="text"
                    placeholder="مثلاً: نوع الغلاف"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">الأيقونة</label>
                  <input
                    type="text"
                    placeholder="📝"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition text-center text-xl"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-black text-slate-500 mb-1.5">وصف مختصر (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثلاً: اختار نوع الغلاف المناسب"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border-2 border-slate-100 focus:border-rose-300 rounded-2xl p-3 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-black text-slate-500 mb-2">طريقة العرض للعميل</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'buttons', label: 'أزرار', icon: '🔘', color: 'from-rose-400 to-rose-500' },
                    { val: 'dropdown', label: 'قائمة', icon: '📋', color: 'from-amber-400 to-amber-500' },
                    { val: 'number', label: 'رقم', icon: '🔢', color: 'from-emerald-400 to-emerald-500' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setNewType(t.val)}
                      className={`p-3 rounded-2xl font-black text-sm transition-all border-2 ${
                        newType === t.val
                          ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg`
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addOption}
                className="w-full bg-gradient-to-l from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-200 hover:shadow-xl"
              >
                ✅ إضافة الخيار
              </button>
            </div>
          )}
        </div>

        {options.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-slate-200/60">
            <div className="text-6xl mb-4 animate-float">📭</div>
            <p className="text-slate-500 font-black text-lg">مفيش خيارات لسه</p>
            <p className="text-slate-400 font-semibold text-sm mt-1">ابدأ بإضافة أول خيار للعميل</p>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-lg hover:shadow-rose-100/40 border border-slate-200/60 hover:border-rose-200 transition-all overflow-hidden animate-fadeIn"
              >
                <div className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white">
                        {opt.icon}
                      </div>
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => updateOption(opt.id, { name: e.target.value })}
                        onBlur={() => loadOptions()}
                        className="font-black text-lg text-slate-800 bg-transparent border-b-2 border-transparent hover:border-rose-200 focus:border-rose-400 focus:outline-none w-full transition"
                      />
                      {opt.description && (
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{opt.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-black border border-rose-100">
                      {opt.option_values?.length || 0} قيمة
                    </span>

                    <button
                      onClick={() => updateOption(opt.id, { is_active: !opt.is_active })}
                      className={`px-3 py-1 rounded-full text-xs font-black transition ${
                        opt.is_active
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {opt.is_active ? '✓ مُفعّل' : '✕ مُعطّل'}
                    </button>

                    <button
                      onClick={() => updateOption(opt.id, { is_required: !opt.is_required })}
                      className={`px-3 py-1 rounded-full text-xs font-black transition ${
                        opt.is_required
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {opt.is_required ? '⚠️ إجباري' : '⚪ اختياري'}
                    </button>

                    <button
                      onClick={() => setExpandedOption(expandedOption === opt.id ? null : opt.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1 ${
                        expandedOption === opt.id
                          ? 'bg-gradient-to-l from-rose-500 to-amber-500 text-white shadow-md shadow-rose-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500 border border-slate-200'
                      }`}
                    >
                      {expandedOption === opt.id ? '▼' : '▶'}
                      <span>تعديل القيم</span>
                    </button>

                    <button
                      onClick={() => deleteOption(opt.id)}
                      className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 font-bold transition flex items-center justify-center"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedOption === opt.id && (
                  <div className="border-t border-slate-100 p-5 bg-gradient-to-br from-rose-50/50 via-amber-50/50 to-emerald-50/50 animate-fadeIn">
                    <ValueEditor
                      optionId={opt.id}
                      values={opt.option_values || []}
                      onAdd={addValue}
                      onUpdate={updateValue}
                      onDelete={deleteValue}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ValueEditor({
  optionId,
  values,
  onAdd,
  onUpdate,
  onDelete,
}: {
  optionId: number
  values: OptionValue[]
  onAdd: (optId: number, value: string, price: string) => void
  onUpdate: (id: number, updates: Partial<OptionValue>) => void
  onDelete: (id: number) => void
}) {
  const [newVal, setNewVal] = useState('')
  const [newPrice, setNewPrice] = useState('')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white rounded-2xl border-2 border-dashed border-rose-200">
        <input
          type="text"
          placeholder="اسم القيمة (مثلاً: سلك)"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          className="flex-1 min-w-[150px] border-2 border-slate-100 focus:border-rose-300 rounded-xl p-2.5 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
        />
        <input
          type="number"
          placeholder="السعر الإضافي"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="w-32 border-2 border-slate-100 focus:border-amber-300 rounded-xl p-2.5 focus:outline-none bg-slate-50/50 text-slate-800 font-bold transition"
        />
        <button
          onClick={() => {
            onAdd(optionId, newVal, newPrice)
            setNewVal('')
            setNewPrice('')
          }}
          className="bg-gradient-to-l from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-200 hover:shadow-lg"
        >
          ➕ إضافة
        </button>
      </div>

      {values.length === 0 ? (
        <div className="text-center py-8 text-slate-400 font-bold">
          <div className="text-4xl mb-2">📝</div>
          مفيش قيم لسه، ابدأ بإضافة واحدة
        </div>
      ) : (
        <div className="space-y-2">
          {values.sort((a, b) => a.id - b.id).map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 flex-wrap bg-white rounded-2xl p-3 border border-slate-100 hover:border-rose-200 hover:shadow-sm transition-all"
            >
              <div className={`w-2 h-8 rounded-full ${v.is_active ? 'bg-gradient-to-b from-emerald-400 to-emerald-500' : 'bg-slate-200'}`} />

              <input
                type="text"
                value={v.value}
                onChange={(e) => onUpdate(v.id, { value: e.target.value })}
                className="flex-1 min-w-[150px] border-b-2 border-transparent hover:border-slate-200 focus:border-rose-400 focus:outline-none bg-transparent text-slate-800 font-black transition py-1"
              />

              <div className="flex items-center gap-1 bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-100">
                <span className="text-amber-600 font-black text-sm">+</span>
                <input
                  type="number"
                  value={v.price_add}
                  onChange={(e) => onUpdate(v.id, { price_add: Number(e.target.value) })}
                  className="w-20 bg-transparent text-center text-slate-800 font-black focus:outline-none"
                />
                <span className="text-amber-600 font-black text-sm">ج</span>
              </div>

              <button
                onClick={() => onUpdate(v.id, { is_active: !v.is_active })}
                className={`px-3 py-1 rounded-full text-xs font-black transition ${
                  v.is_active
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {v.is_active ? 'مُفعّل' : 'مُعطّل'}
              </button>

              <button
                onClick={() => onDelete(v.id)}
                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 font-bold transition flex items-center justify-center"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}