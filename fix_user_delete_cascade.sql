-- ==========================================
-- Make "delete user" work from the Supabase dashboard
-- ==========================================
-- Deleting an auth user fails with e.g.
--   violates foreign key constraint "user_rewards_user_id_fkey"
-- because app tables reference auth.users without ON DELETE CASCADE, so the
-- dashboard delete 500s and the account silently survives (which also makes
-- re-registration return a fake 200 with no verification email).
--
-- This script rewrites EVERY foreign key that points at auth.users — and any
-- that point at public.orders (order_items) — to ON DELETE CASCADE, so deleting
-- a user cleanly removes their rewards, orders, order items, and leaderboard
-- rows in one go.
--
-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent by effect).

DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT
      con.conname,
      con.conrelid::regclass AS child_table,
      con.confrelid::regclass AS parent_table,
      pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    WHERE con.contype = 'f'
      AND con.confrelid IN ('auth.users'::regclass, 'public.orders'::regclass)
      AND con.confdeltype <> 'c'  -- skip ones already ON DELETE CASCADE
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      fk.child_table, fk.conname
    );
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I %s ON DELETE CASCADE',
      fk.child_table, fk.conname,
      -- strip any existing ON DELETE/ON UPDATE clause from the original def
      regexp_replace(fk.def, ' ON (DELETE|UPDATE) [A-Z ]+', '', 'g')
    );
    RAISE NOTICE 'CASCADE added: % -> %', fk.child_table, fk.parent_table;
  END LOOP;
END $$;

-- Verify: list all FKs now pointing at auth.users / orders with their delete rule
SELECT
  con.conrelid::regclass AS child_table,
  con.conname,
  CASE con.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'a' THEN 'NO ACTION'
       WHEN 'r' THEN 'RESTRICT' WHEN 'n' THEN 'SET NULL' ELSE con.confdeltype::text END AS on_delete
FROM pg_constraint con
WHERE con.contype = 'f'
  AND con.confrelid IN ('auth.users'::regclass, 'public.orders'::regclass);
