# POS80GXA Print Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable the print bridge (Android app) to read orders/order_items, read shop_config for pickup time, and mark orders as printed via `orders.printed_at`. All changes in Cloud Cafe repo: DB migration + types + docs.

**Architecture:** Add `printed_at` to `orders`; RLS allows role `printer` to SELECT orders/order_items, UPDATE only `orders.printed_at`; printer user created in Supabase with `user_metadata.role = 'printer'`. No service role on device.

**Tech Stack:** Supabase (PostgreSQL RLS), TypeScript types, SQL migrations.

---

### Task 1: Add printed_at column to orders

**Files:**
- Create: `supabase_print_bridge.sql`
- Modify: (none in this task)

**Step 1: Create migration file**

Create `supabase_print_bridge.sql` with:
- `ALTER TABLE orders ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;`
- Comment: column used by print bridge to avoid duplicate prints.

**Step 2: Verify SQL is valid**

Run: open file and confirm no syntax errors (optional: run in Supabase SQL Editor if available).

**Step 3: Commit**

```bash
git add supabase_print_bridge.sql
git commit -m "feat(db): add orders.printed_at for print bridge de-dup"
```

---

### Task 2: RLS policies for printer role (orders)

**Files:**
- Modify: `supabase_print_bridge.sql` (append)

**Step 1: Add policy for printer to SELECT orders**

Append to `supabase_print_bridge.sql`:
- Policy name: "Printer can view all orders"
- ON orders FOR SELECT USING ( (auth.jwt()->'user_metadata'->>'role') = 'printer' )

**Step 2: Add policy for printer to UPDATE only printed_at**

Printer must only set printed_at. Use WITH CHECK so updated row only changes printed_at (or use a single column update policy). Option: "Printer can update orders printed_at" FOR UPDATE USING ( (auth.jwt()->'user_metadata'->>'role') = 'printer' ) WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'printer' ). Note: RLS does not restrict which columns; app must only update printed_at. Document in comment.

Append:
- "Printer can update orders printed_at" ON orders FOR UPDATE USING ( (auth.jwt()->'user_metadata'->>'role') = 'printer' )

**Step 3: Commit**

```bash
git add supabase_print_bridge.sql
git commit -m "feat(db): RLS allow printer role to select and update printed_at on orders"
```

---

### Task 3: RLS policies for printer role (order_items)

**Files:**
- Modify: `supabase_print_bridge.sql` (append)

**Step 1: Add policy for printer to SELECT order_items**

Append: "Printer can view all order items" ON order_items FOR SELECT USING ( (auth.jwt()->'user_metadata'->>'role') = 'printer' )

**Step 2: Commit**

```bash
git add supabase_print_bridge.sql
git commit -m "feat(db): RLS allow printer role to select order_items"
```

---

### Task 4: TypeScript type and docs

**Files:**
- Modify: `src/types/database.ts` (add printed_at to Order)
- Create or modify: `docs/plans/2026-02-11-pos80gxa-print-bridge-design.md` or new doc for printer user setup

**Step 1: Add printed_at to Order interface**

In `src/types/database.ts`, add to Order:
`printed_at?: string | null;`

**Step 2: Document printer user creation**

In `docs/plans/2026-02-11-pos80gxa-print-bridge-implementation-plan.md` (or a small `docs/print-bridge-setup.md`), add section "Printer user setup": create user in Supabase Auth, set user_metadata.role = 'printer', use anon key + this user for the Android app; run `supabase_print_bridge.sql` in SQL Editor before using bridge.

**Step 3: Commit**

```bash
git add src/types/database.ts docs/
git commit -m "feat: add printed_at to Order type and document printer user setup"
```

---

### Task 5: Verification

**Step 1: Run build**

Run: `npm run build`
Expected: success.

**Step 2: Confirm migration file is complete**

Read `supabase_print_bridge.sql` and confirm it contains: printed_at column, both orders policies, order_items policy. No syntax errors.

**Step 3: Report**

Report "Ready for feedback." with verification output.
