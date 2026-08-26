// Supabase Edge Function: print-receipt
// Called after payment succeeds → prints kitchen + customer receipt via xpyun cloud API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const XPYUN_USER      = 'cloudcafe44morrispark@gmail.com'
const XPYUN_KEY       = '518ec2ad7d0643cd9b4ed8011af2b011'
const PRINTER_SN      = '44056VLTX221049'
const XPYUN_PRINT_URL = 'https://open.xpyun.net/api/openapi/xprinter/print'

// ─── SHA1 (Web Crypto API available in Deno) ──────────────────────────────────

async function sha1(message: string): Promise<string> {
  const data = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── xpyun cloud print ────────────────────────────────────────────────────────

async function xpyunPrintOnce(content: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const sign = await sha1(XPYUN_USER + XPYUN_KEY + timestamp)

  const body = {
    user:      XPYUN_USER,
    timestamp,
    sign,
    sn:        PRINTER_SN,
    content,
    copies:    1,
    voice:     2,
    mode:      0,
  }

  const res = await fetch(XPYUN_PRINT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body:    JSON.stringify(body),
  })

  const json = await res.json()
  console.log('xpyun response:', JSON.stringify(json))

  if (json.code !== 0) {
    throw new Error(`xpyun error: ${JSON.stringify(json)}`)
  }
}

// Retry on transient failures (network blip / xpyun hiccup) so a single
// bad moment doesn't silently drop a receipt.
async function xpyunPrint(content: string, attempts = 3): Promise<void> {
  let lastErr: unknown
  for (let i = 1; i <= attempts; i++) {
    try {
      await xpyunPrintOnce(content)
      return
    } catch (err) {
      lastErr = err
      console.warn(`xpyun print attempt ${i}/${attempts} failed:`, String(err))
      if (i < attempts) await new Promise(r => setTimeout(r, 500 * i))
    }
  }
  throw lastErr
}

// ─── Receipt content builders ─────────────────────────────────────────────────

// xpyun markup: <CB>text</CB>=center+bold+big, <C>text</C>=center, <B>text</B>=bold
const DIV = '--------------------------------\n'

// Format in UK local time (Europe/London) so times track GMT/BST automatically.
// Deno ships full ICU, so the timeZone option handles daylight saving for us.
function formatTime(isoString: string): string {
  const d = new Date(isoString)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour:   '2-digit',
    minute: '2-digit',
    day:    '2-digit',
    month:  '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('hour')}:${get('minute')} ${get('day')}/${get('month')}`
}

function rightAlign(left: string, right: string, width = 32): string {
  const spaces = Math.max(1, width - left.length - right.length)
  return left + ' '.repeat(spaces) + right + '\n'
}

interface Item { product_name: string; quantity: number; price: number }

function buildKitchenReceipt(
  shortId: string,
  orderTime: string,
  pickupTime: string,
  customerName: string,
  items: Item[],
  notes: string | null,
  customerPhone: string | null,
): string {
  let s = ''
  s += '<C>** KITCHEN **</C>\n'
  s += '\n'
  s += `<C>${customerName}</C>\n`
  if (customerPhone) {
    s += `<C>Tel: ${customerPhone}</C>\n`
  }
  s += '\n'
  s += `<C>Order: ${shortId}</C>\n`
  s += `<C>Time: ${orderTime}</C>\n`
  s += `<C>Pickup: ${pickupTime}</C>\n`
  s += DIV
  for (const item of items) {
    s += `<CB>${item.quantity} x ${item.product_name}</CB>\n`
  }
  s += DIV
  if (notes) {
    s += `<CB>NOTE: ${notes}</CB>\n`
    s += DIV
  }
  s += '\n\n'
  return s
}

function buildCustomerReceipt(
  shortId: string,
  orderTime: string,
  pickupTime: string,
  customerName: string,
  items: Item[],
  notes: string | null,
  total: number,
  customerPhone: string | null,
): string {
  let s = ''
  s += '<C>Cloud Cafe</C>\n'
  s += '<C>Online</C>\n'
  s += '\n'
  s += `<C>${customerName}</C>\n`
  if (customerPhone) {
    s += `<C>Tel: ${customerPhone}</C>\n`
  }
  s += `<C>Order: #${shortId}</C>\n`
  s += `<C>Ordered: ${orderTime}</C>\n`
  s += `<C>Pickup: ${pickupTime}</C>\n`
  s += DIV
  for (const item of items) {
    const lineTotal = `GBP${(item.quantity * item.price).toFixed(2)}`
    const left = `${item.quantity} x ${item.product_name}`
    s += rightAlign(left, lineTotal)
  }
  s += DIV
  s += rightAlign('TOTAL:', `GBP${total.toFixed(2)}`)
  s += DIV
  if (notes) {
    s += `Note: ${notes}\n`
    s += DIV
  }
  s += '<C>Thank you!</C>\n'
  s += '<C>Cloud Cafe, Morris Park</C>\n'
  s += '<C>37 Rosyth Road, Glasgow</C>\n'
  s += '\n\n'
  return s
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    })
  }

  try {
    const { orderId, force } = await req.json()
    if (!orderId) throw new Error('Missing orderId')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, user_id, total, notes, created_at, pickup_time, customer_name, customer_phone, printed_at')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) throw new Error(`Order not found: ${orderErr?.message}`)
    if (order.printed_at && !force) {
      console.log(`Order ${orderId} already printed, skipping`)
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    // Fetch items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_name, quantity, price')
      .eq('order_id', orderId)

    if (itemsErr || !items) throw new Error(`Items not found: ${itemsErr?.message}`)

    // Fetch customer name / phone from auth.users when the order snapshot is missing
    let customerName = (order.customer_name || '').trim()
    let customerPhone = (order.customer_phone || '').trim()
    if (order.user_id && (!customerName || !customerPhone)) {
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id)
      const user = userData?.user
      const meta = user?.user_metadata || {}
      if (!customerName) {
        const first = (meta.first_name || '').trim()
        const last  = (meta.last_name  || '').trim()
        customerName = [first, last].filter(Boolean).join(' ')
        // Fall back to email prefix
        if (!customerName && user?.email) {
          customerName = user.email.split('@')[0]
        }
      }
      if (!customerPhone) {
        customerPhone = (meta.phone || user?.phone || '').trim()
      }
    }
    if (!customerName) customerName = 'Customer'

    const shortId = orderId.slice(0, 8)
    const orderTime    = formatTime(order.created_at)
    const pickupMinutes = order.pickup_time ?? 25
    const pickupMs     = new Date(order.created_at).getTime() + pickupMinutes * 60 * 1000
    const pickupTime   = formatTime(new Date(pickupMs).toISOString())
    const notes        = order.notes || null

    console.log(`Printing order ${shortId} for ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`)

    // Print kitchen receipt
    await xpyunPrint(buildKitchenReceipt(shortId, orderTime, pickupTime, customerName, items, notes, customerPhone || null))
    // Print customer receipt
    await xpyunPrint(buildCustomerReceipt(shortId, orderTime, pickupTime, customerName, items, notes, order.total, customerPhone || null))

    // Mark as printed
    await supabase
      .from('orders')
      .update({ printed_at: new Date().toISOString() })
      .eq('id', orderId)

    console.log(`✓ Order ${shortId} printed successfully`)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })

  } catch (err) {
    console.error('print-receipt error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
})
