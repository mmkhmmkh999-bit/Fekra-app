import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from './components/Toast'

export const metadata: Metadata = {
  title: 'متجر الكراسات — تصميمك الخاص',
  description: 'اطلب كراستك بتصميمك الخاص، توصيل لكل مصر',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}