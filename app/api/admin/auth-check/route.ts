import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← مفتاح سري جديد
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { username, passwordHash, password } = await request.json();

    // بحث في الأدمنز من السيرفر فقط
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('is_active', true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'not_found' }, { status: 401 });
    }

const isValid = admin.password_hash === passwordHash;
    if (!isValid) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        is_active: admin.is_active,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}