# POS80GXA Print Bridge Design

**Goal:** Automatically print new orders to EPOS Now POS80GXA (fixed IP, port 9100, 80mm) using an always-on Android tablet, and include pickup time on the receipt.

**Architecture:** A lightweight Android "print bridge" app subscribes to Supabase realtime `orders` inserts, fetches full order details, formats ESC/POS output for 80mm paper, and sends raw print data over TCP to the printer. It de-duplicates prints and retries on network failure. Pickup time is computed from `shop_config` collection minutes (busy mode) using order `created_at`.

**Tech Stack:** Supabase JS (Realtime + PostgREST), Android (Kotlin/Java), TCP socket to printer (ESC/POS), local storage for config + de-dup.

---

## Requirements
- Printer: EPOS Now POS80GXA, fixed IP, port 9100, 80mm paper.
- Network: Android tablet and printer on same WiFi.
- Printing: fully automatic on new order.
- Receipt: includes order time, pickup time, items, notes, total.
- Reliable: retry on disconnect; avoid duplicate prints.

## Data Flow
1. Android app authenticates to Supabase as a dedicated `printer` user.
2. Subscribe to `orders` `INSERT` via Realtime.
3. On new order ID:
   - Fetch order + `order_items`.
   - Fetch `shop_config` busy mode value and compute `collectionMinutes`.
   - Compute `pickup_time = created_at + collectionMinutes`.
4. Format ESC/POS receipt for 80mm and send to `IP:9100`.
5. Mark printed (local and/or DB) and store last printed IDs.

## Security & Auth
- Create a dedicated Supabase auth user with `user_metadata.role = 'printer'`.
- RLS policies allow:
  - `select` on `orders` and `order_items` for role `printer`
  - `update` on `orders.printed_at` for role `printer` (if using DB-side de-dup)
- App uses anon key + printer user login. No service role key on device.

## Receipt Layout (80mm)
- Header: Store name + "Order Receipt"
- Metadata: Order short ID, order time, pickup time
- Items: `qty x name` with line total
- Notes (if any)
- Total

## De-dup Strategy
**Preferred:** `orders.printed_at` (timestamp)
- On successful print, set `printed_at = now()`.
- On startup, fetch `printed_at is null` and `created_at > now()-24h` to catch missed orders.

**Fallback:** local de-dup only
- Store last 24h printed order IDs in local storage.

## Error Handling
- Realtime disconnect: auto-reconnect with backoff.
- Printer unreachable: queue order for retry; UI status shows "printer offline".
- Duplicate events: ignore if already printed (DB or local).
- Timezone: convert `created_at` to local time before computing pickup time.

## Testing Plan
1. Connectivity test: send "Test Receipt" to IP:9100.
2. New order: place order -> auto print.
3. Disconnect/reconnect: disable WiFi -> re-enable -> queued orders print.
4. Duplicate protection: ensure one print per order.
5. Pickup time: matches frontend collection time (busy mode).

## Open Decisions
- Use DB `printed_at` (recommended) or local-only de-dup.
- Android app framework (native Kotlin vs lightweight WebView/Node bridge).
