// مكتبة مصادقة العملاء والأدمن

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'notebook_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ============ العميل ============
export function getCurrentCustomer(): {
  id: number
  name: string
  email: string
  phone: string
} | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('customer')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setCurrentCustomer(customer: {
  id: number
  name: string
  email: string
  phone: string
}) {
  localStorage.setItem('customer', JSON.stringify(customer))
}

export function logoutCustomer() {
  localStorage.removeItem('customer')
}

export function isLoggedIn(): boolean {
  return getCurrentCustomer() !== null
}

// ============ الأدمن ============
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'viewer'

export interface Admin {
  id: number
  username: string
  full_name: string | null
  email: string | null
  role: AdminRole
  is_active: boolean
}

export function getCurrentAdmin(): Admin | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('admin')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setCurrentAdmin(admin: Admin) {
  localStorage.setItem('admin', JSON.stringify(admin))
  localStorage.setItem('admin_logged_in', 'true')
  localStorage.setItem('admin_username', admin.username)
}

export function logoutAdmin() {
  localStorage.removeItem('admin')
  localStorage.removeItem('admin_logged_in')
  localStorage.removeItem('admin_username')
}

export function isAdminLoggedIn(): boolean {
  return getCurrentAdmin() !== null
}

// ============ الصلاحيات ============
export const ROLE_LABELS: Record<AdminRole, { label: string; icon: string; color: string; bg: string }> = {
  super_admin: { label: 'مدير رئيسي', icon: '👑', color: 'text-amber-700', bg: 'bg-amber-100' },
  admin: { label: 'مدير', icon: '🛡️', color: 'text-rose-700', bg: 'bg-rose-100' },
  manager: { label: 'مشرف', icon: '📋', color: 'text-blue-700', bg: 'bg-blue-100' },
  viewer: { label: 'مشاهد فقط', icon: '👁️', color: 'text-slate-700', bg: 'bg-slate-100' },
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['dashboard', 'orders', 'pricing', 'options', 'coupons', 'settings', 'admins'],
  admin: ['dashboard', 'orders', 'pricing', 'options', 'coupons'],
  manager: ['dashboard', 'orders'],
  viewer: ['dashboard'],
}

export function hasPermission(role: AdminRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}