'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-black">جاري التوجيه...</p>
      </div>
    </div>
  )
}