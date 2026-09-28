import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'admin_email')
      .single()

    const adminEmail = settings?.value || ''

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email not set' }, { status: 400 })
    }

    // تجهيز تفاصيل الكراسة
    const itemsHtml = items
      ?.map((item) => {
        const optionsHtml = Array.isArray(item.selected_options)
          ? item.selected_options
              .map(
                (opt: any) =>
                  `<p style="margin: 5px 0; font-size: 14px;">${opt.optionIcon || '•'} <strong>${opt.optionName}:</strong> ${opt.valueText}${
                    opt.price > 0 ? ` <span style="color: #d97706;">(+${opt.price} ج)</span>` : ''
                  }</p>`
              )
              .join('')
          : '<p style="margin: 5px 0; color: #6b7280;">لا توجد خيارات</p>'

        return `
      <div style="background: #faf7f2; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-right: 4px solid #065f46;">
        ${optionsHtml}
        <p style="margin: 5px 0; font-size: 14px; padding-top: 8px; border-top: 1px dashed #d1d5db;"><strong>الكمية:</strong> ${item.quantity}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>سعر الواحدة:</strong> ${item.unit_price} ج</p>
        ${
          item.custom_design_text
            ? `<p style="margin: 5px 0; font-size: 14px;"><strong>وصف التصميم:</strong> ${item.custom_design_text}</p>`
            : ''
        }
        ${
          item.custom_design_image_url
            ? `<p style="margin: 8px 0 5px 0; font-size: 14px;"><strong>صورة التصميم:</strong> <a href="${item.custom_design_image_url}" style="color: #065f46; text-decoration: underline;">اضغط للعرض</a></p>
               <img src="${item.custom_design_image_url}" alt="تصميم" style="max-width: 200px; border-radius: 8px; margin-top: 8px;" />`
            : ''
        }
      </div>
    `
      })
      .join('')

    // حساب الإجمالي قبل الخصم
    const subtotal = Number(order.total_price) - Number(order.shipping_cost) + Number(order.discount_amount || 0)

    // سطر الخصم
    const discountRow =
      Number(order.discount_amount) > 0
        ? `
      <tr>
        <td style="padding: 6px 0; color: #10b981; font-weight: bold;">🎟️ الخصم (${order.coupon_code || 'كوبون'}):</td>
        <td style="padding: 6px 0; font-weight: bold; color: #10b981; text-align: left;">-${Number(order.discount_amount).toFixed(2)} ج</td>
      </tr>
    `
        : ''

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #065f46 0%, #064e3b 100%); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📦 طلب جديد #${order.id}</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">وصل طلب جديد على متجر الكراسات</p>
          ${order.coupon_code ? `<div style="background: #fbbf24; color: #064e3b; padding: 5px 12px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; font-size: 12px;">🎟️ كوبون: ${order.coupon_code}</div>` : ''}
        </div>

        <!-- Customer Info -->
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #065f46; border-bottom: 2px solid #fbbf24; padding-bottom: 10px; font-size: 18px; margin-bottom: 15px;">👤 بيانات العميل</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 100px;">الاسم:</td>
              <td style="padding: 6px 0; font-weight: bold;">${order.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">التليفون:</td>
              <td style="padding: 6px 0; font-weight: bold;">
                <a href="tel:${order.phone}" style="color: #065f46; text-decoration: none;">${order.phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">العنوان:</td>
              <td style="padding: 6px 0; font-weight: bold;">${order.address}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">التاريخ:</td>
              <td style="padding: 6px 0;">${new Date(order.created_at).toLocaleString('ar-EG')}</td>
            </tr>
          </table>
        </div>

        <!-- Order Details -->
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #065f46; border-bottom: 2px solid #fbbf24; padding-bottom: 10px; font-size: 18px; margin-bottom: 15px;">📓 تفاصيل الكراسة</h2>
          ${itemsHtml}
        </div>

        <!-- Total -->
        <div style="background: #faf7f2; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #065f46; border-bottom: 2px solid #fbbf24; padding-bottom: 10px; font-size: 18px; margin-bottom: 15px;">💰 الحسابات</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">سعر المنتج:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: left;">${subtotal.toFixed(2)} ج</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">الشحن:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: left;">${Number(order.shipping_cost).toFixed(2)} ج</td>
            </tr>
            ${discountRow}
            <tr>
              <td style="padding: 12px 0 0 0; font-size: 20px; font-weight: bold; color: #065f46; border-top: 2px solid #e5e7eb;">الإجمالي:</td>
              <td style="padding: 12px 0 0 0; font-size: 20px; font-weight: bold; color: #065f46; text-align: left; border-top: 2px solid #e5e7eb;">${Number(order.total_price).toFixed(2)} ج</td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
          <a href="https://wa.me/${order.phone}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 تواصل مع العميل على واتساب</a>
        </div>

        <!-- Footer -->
        <div style="background: #064e3b; padding: 15px; text-align: center; border-radius: 0 0 12px 12px; color: #fbbf24; font-size: 12px;">
          متجر الكراسات — تم إرسال هذا الإيميل تلقائيًا
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: adminEmail,
      subject: `🛒 طلب جديد #${order.id} من ${order.customer_name} — ${Number(order.total_price).toFixed(2)} ج`,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}