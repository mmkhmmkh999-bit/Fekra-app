'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from './lib/supabase'
import { getCurrentCustomer, getCurrentAdmin } from './lib/auth'

type Settings = { [key: string]: string }

type Stats = {
  totalOrders: number
  totalNotebooks: number
  totalZones: number
  completedOrders: number
}

const Icon = {
  Pencil: () => (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
  Palette: () => (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>),
  Truck: () => (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>),
  Check: () => (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>),
  Arrow: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>),
  Up: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>),
  User: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  Shield: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>),
  Whatsapp: () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>),
  Facebook: () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>),
  Instagram: () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>),
  Messenger: () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" /></svg>),
  Fire: () => (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .524 2.5.524 2.5a3 3 0 01-.154 3.62z" clipRule="evenodd" /></svg>),
  Sparkle: () => (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l2.39 6.5H19l-5.5 4 2.1 6.5L10 14 4.4 18l2.1-6.5L1 7.5h6.61L10 1z" /></svg>),
}

function Counter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    if (end === 0) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          setCount(Math.floor(end * (1 - Math.pow(1 - progress, 3))))
          if (progress < 1) requestAnimationFrame(tick)
        }
        tick()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])
  return <div ref={ref}>{count}{suffix}</div>
}

function Countdown() {
  const [time, setTime] = useState({ h: 23, m: 59, s: 59 })
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 }
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 }
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 }
        return { h: 23, m: 59, s: 59 }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const box = (val: number, label: string) => (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 md:w-18 md:h-18 bg-white shadow-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-rose-500 border border-rose-100">
        {String(val).padStart(2, '0')}
      </div>
      <span className="text-[10px] md:text-xs text-slate-500 mt-2 font-bold tracking-wider uppercase">{label}</span>
    </div>
  )
  return (
    <div className="flex gap-3">
      {box(time.h, 'Hrs')}
      {box(time.m, 'Min')}
      {box(time.s, 'Sec')}
    </div>
  )
}

export default function HomePage() {
  const [settings, setSettings] = useState<Settings>({})
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalNotebooks: 0, totalZones: 0, completedOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const [email, setEmail] = useState('')
  const [customer, setCustomer] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // تحميل بيانات المستخدمين
    setCustomer(getCurrentCustomer())
    setAdmin(getCurrentAdmin())

    // Popup ترحيبي لو مش داخل
    setTimeout(() => {
      const c = getCurrentCustomer()
      const a = getCurrentAdmin()
      if (!c && !a && !sessionStorage.getItem('welcome_shown')) {
        setShowWelcome(true)
        sessionStorage.setItem('welcome_shown', 'true')
      }
    }, 1500)

    async function loadData() {
      const { data: settingsData } = await supabase.from('settings').select('*')
      const obj: Settings = {}
      settingsData?.forEach((s) => { obj[s.key] = String(s.value) })
      setSettings(obj)

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'cancelled')

      const { count: completedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('quantity')

      const totalNotebooks = itemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0

      const { count: zonesCount } = await supabase
        .from('shipping_zones')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats({
        totalOrders: ordersCount || 0,
        totalNotebooks: totalNotebooks,
        totalZones: zonesCount || 0,
        completedOrders: completedCount || 0,
      })

      setLoading(false)
    }
    loadData()

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress((scrollTop / docHeight) * 100)
      setShowTop(scrollTop > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const siteTitle = settings.site_title || 'متجر الكراسات'
  const siteDesc = settings.site_description || 'اطلب كراستك بتصميمك الخاص'
  const whatsapp = settings.whatsapp_number || ''

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
        <div className="w-16 h-16 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" dir="rtl">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(5deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes pulseRing { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradientShift 5s ease infinite; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .pulse-ring::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #10b981; animation: pulseRing 2s ease-out infinite; z-index: -1; }
        .text-shine {
          background: linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #f43f5e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
        }
      `}</style>

      {/* Scroll Progress */}
      <div className="fixed top-0 right-0 left-0 h-1 z-[100]">
        <div className="h-full bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Announcement Bar */}
      <div className="bg-gradient-to-l from-rose-100 via-amber-100 to-emerald-100 text-slate-700 text-sm font-bold py-2.5 overflow-hidden border-b border-rose-200/50">
        <div className="flex gap-12 animate-marquee whitespace-nowrap" style={{ width: 'fit-content' }}>
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>✨ تصميم فاخر لكل عميل</span>
              <span>🚚 توصيل لكل محافظات مصر</span>
              <span>🎁 خصم خاص على الطلبات الكبيرة</span>
              <span>💎 جودة عالية مضمونة</span>
              <span>📞 دعم فوري 24/7</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-1 z-50 bg-white/80 backdrop-blur-xl border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-200">
              {siteTitle.charAt(0)}
            </div>
            <span className="text-xl font-black text-slate-800 hidden sm:block">{siteTitle}</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 bg-rose-50 rounded-full p-1 border border-rose-100">
            {[
              { href: '#features', label: 'المميزات' },
              { href: '#how', label: 'الخطوات' },
              { href: '#faq', label: 'أسئلة' },
            ].map((link) => (
              <a key={link.href} href={link.href} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-rose-500 hover:bg-white rounded-full transition-all">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* زر الإدارة — يظهر فقط للأدمن المسجل */}
            {admin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-gradient-to-l from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-black px-4 py-2.5 rounded-full transition-all text-sm shadow-lg shadow-slate-300"
                title={`لوحة الإدارة — ${admin.full_name || admin.username}`}
              >
                <Icon.Shield />
                <span className="hidden md:inline">لوحة الإدارة</span>
              </Link>
            )}

            {/* زر العميل — يظهر فقط للعميل المسجل */}
            {customer && !admin && (
              <Link
                href="/account"
                className="flex items-center gap-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-500 font-black px-4 py-2.5 rounded-full transition-all text-sm border-2 border-rose-200 hover:border-rose-300"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-xs font-black">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{customer.name.split(' ')[0]}</span>
              </Link>
            )}

            {/* زر الدخول — يظهر فقط لو مش داخل */}
            {!customer && !admin && (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-500 font-black px-4 py-2.5 rounded-full transition-all text-sm border-2 border-rose-200 hover:border-rose-300"
              >
                <Icon.User />
                <span className="hidden md:inline">دخول</span>
              </Link>
            )}

            <Link
              href="/customize"
              className="bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black px-5 py-2.5 rounded-full transition-all text-sm shadow-lg shadow-rose-200 hover:shadow-xl flex items-center gap-2"
            >
              ابدأ الآن <Icon.Arrow />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-24 px-6 overflow-hidden">
        <div className="absolute top-32 right-0 w-96 h-96 bg-rose-200/60 rounded-full filter blur-3xl animate-float" />
        <div className="absolute top-60 left-0 w-96 h-96 bg-amber-200/60 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-emerald-200/60 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div className="animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-white border border-rose-200 text-rose-500 font-bold px-4 py-2 rounded-full text-sm mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              متاح الآن — التوصيل لكل مصر
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-800 leading-[1.05] mb-6 tracking-tight">
              كراستك،
              <br />
              <span className="text-shine">بتصميمك الخاص</span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl font-medium">
              {siteDesc}. اختر عدد الورق والوزن والتجليد، وارفع تصميمك، واحنا هنجهزهولك بأعلى جودة.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/customize" className="group bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-rose-200 hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-3">
                <Icon.Pencil />
                <span>صمّم كراستك دلوقتي</span>
                <span className="group-hover:-translate-x-1 transition-transform"><Icon.Arrow /></span>
              </Link>
              <a href="#how" className="bg-white text-slate-700 font-black px-8 py-4 rounded-2xl border-2 border-rose-200 hover:border-amber-300 hover:text-rose-500 transition-all">
                إزاي بيشتغل؟
              </a>
            </div>
          </div>

          <div className="relative animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-rose-300 via-amber-300 to-emerald-300 rounded-[2rem] blur-2xl opacity-60" />
              <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border-8 border-white">
                <img src="https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80" alt="كراسة" className="w-full h-[500px] object-cover" />
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-rose-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-xl flex items-center justify-center text-white"><Icon.Check /></div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">جودة فاخرة</p>
                    <p className="text-xs text-slate-500 font-bold">ورق بريميوم</p>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-rose-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl flex items-center justify-center text-white"><Icon.Truck /></div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">توصيل سريع</p>
                    <p className="text-xs text-slate-500 font-bold">2-4 أيام</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Offer */}
      <section className="py-12 px-6 bg-gradient-to-l from-rose-100 via-amber-100 to-emerald-100 border-y border-rose-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-400 border border-rose-200 shadow-md">
                <Icon.Fire />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2">
                  عرض حصري لفترة محدودة 🔥
                </div>
                <div className="text-slate-600 text-sm font-bold mt-1">
                  خصم خاص على الطلبات فوق 50 كراسة
                </div>
              </div>
            </div>
            <Countdown />
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-14 px-6 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🛡️', title: 'دفع آمن', desc: 'حماية كاملة' },
            { icon: '⏰', title: 'توصيل سريع', desc: '2-4 أيام' },
            { icon: '💎', title: 'جودة مضمونة', desc: 'أو استرداد' },
            { icon: '🎨', title: 'تصميم مخصص', desc: 'على مزاجك' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-rose-100">
                {badge.icon}
              </div>
              <div>
                <div className="font-black text-slate-800">{badge.title}</div>
                <div className="text-sm text-slate-500 font-bold">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-sm font-black text-rose-500 bg-rose-100 px-4 py-2 rounded-full mb-4 border border-rose-200">
              <Icon.Sparkle /> المميزات
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
              ليه <span className="text-rose-500">تختارنا</span>؟
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">كل تفصيلة في الكراسة بتاعتك بتتصمم على مزاجك</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Icon.Pencil />, title: 'تصميم مخصص', desc: 'اختار عدد الورق، الوزن، والتجليد اللي يناسبك', bg: 'bg-rose-50', color: 'text-rose-500', gradient: 'from-rose-300 to-rose-500' },
              { icon: <Icon.Palette />, title: 'غلاف بتصميمك', desc: 'ارفع صورة أو اكتب وصف للتصميم اللي عايزه', bg: 'bg-amber-50', color: 'text-amber-500', gradient: 'from-amber-300 to-amber-500' },
              { icon: <Icon.Truck />, title: 'توصيل سريع', desc: 'توصيل لكل محافظات مصر بأقل تكلفة', bg: 'bg-emerald-50', color: 'text-emerald-500', gradient: 'from-emerald-300 to-emerald-500' },
            ].map((f, i) => (
              <div key={i} className="group relative bg-white rounded-3xl p-8 hover:shadow-2xl hover:shadow-rose-100 transition-all duration-500 transform hover:-translate-y-2 border border-slate-100">
                <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                <h3 className="text-2xl font-black text-slate-800 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{f.desc}</p>
                <div className={`absolute bottom-0 right-0 left-0 h-1.5 bg-gradient-to-l ${f.gradient} rounded-b-3xl scale-x-0 group-hover:scale-x-100 transition-transform origin-right`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-sm font-black text-amber-500 bg-amber-100 px-4 py-2 rounded-full mb-4 border border-amber-200">
              🚀 خطوة بخطوة
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">3 خطوات بس</h2>
            <p className="text-xl text-slate-600 font-medium">وكراستك في إيدك</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'اختر المواصفات', desc: 'حدد عدد الورق، الوزن، والتجليد', icon: <Icon.Pencil />, color: 'from-rose-300 to-rose-500' },
              { num: '02', title: 'ارفع تصميمك', desc: 'صورة أو وصف للتصميم اللي تحبه', icon: <Icon.Palette />, color: 'from-amber-300 to-amber-500' },
              { num: '03', title: 'استلم كراستك', desc: 'توصيل سريع لباب البيت', icon: <Icon.Truck />, color: 'from-emerald-300 to-emerald-500' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="text-6xl font-black text-slate-100">{step.num}</div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>{step.icon}</div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-600 font-medium">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/customize" className="inline-flex items-center gap-3 bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-rose-200 transition-all transform hover:-translate-y-1 text-lg">
              ابدأ تصميمك الآن <Icon.Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 border-y border-rose-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-5xl md:text-6xl font-black mb-2 text-rose-500">
              <Counter end={stats.totalOrders} suffix="+" />
            </div>
            <div className="text-slate-600 font-bold">طلب تم</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black mb-2 text-amber-500">
              <Counter end={stats.totalNotebooks} suffix="+" />
            </div>
            <div className="text-slate-600 font-bold">كراسة اتصممت</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black mb-2 text-emerald-500">
              <Counter end={stats.totalZones} />
            </div>
            <div className="text-slate-600 font-bold">محافظة نوصلها</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black mb-2 text-rose-500">
              <Counter end={stats.completedOrders} suffix="+" />
            </div>
            <div className="text-slate-600 font-bold">طلب مكتمل</div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-10 text-center border border-rose-200 shadow-lg shadow-rose-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-200/40 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200/40 rounded-full filter blur-3xl" />
            <div className="relative">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-3xl font-black text-slate-800 mb-3">اشترك في النشرة</h2>
              <p className="text-slate-600 mb-6 font-medium">خليك أول من يعرف بالعروض والخصومات</p>
              <div className="flex gap-2 max-w-md mx-auto flex-wrap sm:flex-nowrap">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" className="flex-1 px-5 py-3 rounded-xl border-2 border-rose-100 focus:border-rose-300 focus:outline-none bg-rose-50/30 text-slate-800 font-medium transition" />
                <button onClick={() => { if (email) { alert('شكرًا لاشتراكك!'); setEmail('') } }} className="bg-gradient-to-l from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-rose-200">
                  اشترك
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 rounded-3xl p-12 md:p-16 overflow-hidden border-2 border-white shadow-2xl shadow-rose-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/50 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/50 rounded-full filter blur-3xl" />
            <div className="relative text-center">
              <div className="text-6xl mb-6">📓</div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6">جاهز تصمم كراستك؟</h2>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto font-medium">3 خطوات بس وهتوصلك كراستك المخصصة لباب البيت</p>
              <Link href="/customize" className="inline-flex items-center gap-3 bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black px-10 py-5 rounded-2xl transition-all transform hover:-translate-y-1 shadow-xl shadow-rose-200 text-lg">
                ابدأ دلوقتي <Icon.Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-6 bg-white/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 bg-emerald-100 px-4 py-2 rounded-full mb-4 border border-emerald-200">
              ❓ أسئلة شائعة
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">عندك سؤال؟</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'إيه أقل كمية ممكن أطلبها؟', a: 'مفيش حد أدنى، تقدر تطلب كراسة واحدة أو ألف.' },
              { q: 'بياخد قد إيه لحد ما توصل؟', a: 'من 2 لـ 4 أيام عمل حسب المحافظة.' },
              { q: 'ممكن أرفع صورة تصميمي؟', a: 'أيوه، ترفع صورة جاهزة، أو تكتب وصف واحنا نصممهولك.' },
              { q: 'طرق الدفع إيه؟', a: 'الدفع عند الاستلام، فيزا، محافظ إلكترونية.' },
              { q: 'لو مفيش صورة تصميم؟', a: 'عادي! اكتب وصف بسيط وهنصمم الغلاف على أساسه.' },
              { q: 'فيه ضمان؟', a: 'أيوه، لو الجودة مش زي ما اتفقنا، تقدر ترجع الطلب.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 hover:border-rose-200 transition-all overflow-hidden shadow-sm">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full p-6 cursor-pointer font-black text-slate-800 flex justify-between items-center text-right">
                  <span>{item.q}</span>
                  <span className={`text-2xl text-rose-500 transition-transform duration-300 ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-slate-600 leading-relaxed font-medium">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-28 px-6 bg-gradient-to-br from-rose-100 via-amber-50 to-emerald-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-800">
            عندك أي سؤال؟ 🤔
            <br />
            <span className="text-shine">احنا في خدمتك</span>
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium">تواصل معانا على أي منصة، فريقنا جاهز يرد عليك</p>

          <div className="flex flex-wrap justify-center gap-4">
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-emerald-50 text-emerald-600 font-black px-6 py-4 rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-emerald-200"><Icon.Whatsapp /> واتساب</a>}
            {settings.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-blue-50 text-blue-600 font-black px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-blue-200"><Icon.Facebook /> فيسبوك</a>}
            {settings.messenger_url && <a href={settings.messenger_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-blue-50 text-blue-500 font-black px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-blue-200"><Icon.Messenger /> ماسنجر</a>}
            {settings.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-pink-50 text-pink-500 font-black px-6 py-4 rounded-2xl shadow-lg shadow-pink-100 hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-pink-200"><Icon.Instagram /> إنستجرام</a>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-lg flex items-center justify-center text-white font-black">{siteTitle.charAt(0)}</div>
              <span className="font-black text-slate-800">{siteTitle}</span>
            </div>
            <p className="text-sm text-slate-500 font-bold">© {new Date().getFullYear()} {siteTitle} — كل الحقوق محفوظة</p>
            {admin ? (
              <Link href="/admin" className="text-sm text-slate-500 hover:text-rose-500 font-black transition flex items-center gap-1.5">
                🔐 لوحة الإدارة
              </Link>
            ) : (
              <span className="text-xs text-slate-300 font-bold">{siteTitle}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-24 md:bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-300 hover:scale-110 transition-all pulse-ring" aria-label="تواصل">
          <Icon.Whatsapp />
        </a>
      )}

      {/* Back to Top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-24 md:bottom-6 right-6 z-40 w-12 h-12 bg-white hover:bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-rose-200 hover:scale-110 transition-all border-2 border-rose-200 ${showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <Icon.Up />
      </button>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-white/95 backdrop-blur-xl border-t border-rose-100 animate-slideUp shadow-2xl">
        <div className="grid grid-cols-4">
          <a href="#features" className="flex flex-col items-center py-3 text-slate-500 hover:text-rose-500 transition">
            <span className="text-xl mb-1">✨</span>
            <span className="text-xs font-black">المميزات</span>
          </a>
          <Link href="/customize" className="flex flex-col items-center py-3 bg-gradient-to-l from-rose-400 to-amber-400 text-white">
            <span className="text-xl mb-1">🎨</span>
            <span className="text-xs font-black">صمّم</span>
          </Link>

          {admin && (
            <Link href="/admin" className="flex flex-col items-center py-3 text-slate-500 hover:text-rose-500 transition">
              <span className="text-xl mb-1">🛡️</span>
              <span className="text-xs font-black">الإدارة</span>
            </Link>
          )}

          {customer && !admin && (
            <Link href="/account" className="flex flex-col items-center py-3 text-slate-500 hover:text-rose-500 transition">
              <span className="text-xl mb-1">👤</span>
              <span className="text-xs font-black">حسابي</span>
            </Link>
          )}

          {!customer && !admin && (
            <Link href="/login" className="flex flex-col items-center py-3 text-slate-500 hover:text-rose-500 transition">
              <span className="text-xl mb-1">🔓</span>
              <span className="text-xs font-black">دخول</span>
            </Link>
          )}

          <a href="#contact" className="flex flex-col items-center py-3 text-slate-500 hover:text-rose-500 transition">
            <span className="text-xl mb-1">💬</span>
            <span className="text-xs font-black">تواصل</span>
          </a>
        </div>
      </div>

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-black transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-rose-200">
                🎉
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                أهلاً بيك في {siteTitle}!
              </h2>
              <p className="text-slate-600 font-bold text-sm">
                سجّل دخول عشان تستمتع بمزايا إضافية
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3 bg-rose-50 rounded-xl p-3">
                <span className="text-2xl">📦</span>
                <span className="font-bold text-slate-700 text-sm">تتبع طلباتك بسهولة</span>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
                <span className="text-2xl">⚡</span>
                <span className="font-bold text-slate-700 text-sm">املأ بياناتك تلقائيًا</span>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3">
                <span className="text-2xl">🎁</span>
                <span className="font-bold text-slate-700 text-sm">عروض خاصة للأعضاء</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 bg-gradient-to-l from-rose-400 via-amber-400 to-emerald-400 hover:from-rose-500 hover:via-amber-500 hover:to-emerald-500 text-white font-black py-3 rounded-2xl text-center transition-all shadow-lg hover:shadow-xl"
              >
                🔓 سجّل دخول
              </Link>
              <button
                onClick={() => setShowWelcome(false)}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition"
              >
                بعدين
              </button>
            </div>

            <div className="text-center mt-4">
              <Link href="/register" className="text-rose-500 hover:text-rose-600 font-black text-xs transition">
                أو أنشئ حساب جديد ←
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}