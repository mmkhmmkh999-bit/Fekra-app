'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('id')

  return (
    <div className="bg-white rounded-xl shadow-md p-10 text-center max-w-lg w-full">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        تم استلام طلبك بنجاح!
      </h1>
      <p className="text-gray-600 mb-2">
        رقم الطلب: <span className="font-bold text-gray-800">#{orderId}</span>
      </p>
      <p className="text-gray-600 mb-6">
        هنكلمك قريب لتأكيد التفاصيل والدفع
      </p>
      <Link
        href="/customize"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition"
      >
        اطلب كراسة تانية
      </Link>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}