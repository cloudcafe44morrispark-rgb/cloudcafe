-- ==========================================
-- Fix: King of Coffee points lost when a stamp add crosses 10
-- ==========================================
-- The old trigger only awarded points when NEW.stamps > OLD.stamps. But when a
-- stamp add reaches/crosses 10 the row is reset to the remainder IN THE SAME
-- UPDATE (e.g. 8 -> +5 -> stored as 3, pending_reward = true), so NEW.stamps <
-- OLD.stamps and those earned stamps scored 0 points. Even a single 9 -> 10
-- conversion (stored as 0) was missed.
--
-- Fix: count the stamps actually EARNED this update. A conversion (pending_reward
-- flips false -> true) reset 10 stamps in the same update, so add them back.
-- Redeeming (pending_reward true -> false) still awards +1, unchanged.

CREATE OR REPLACE FUNCTION auto_update_leaderboard_from_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_points_to_add INTEGER := 0;
  v_earned INTEGER := 0;
BEGIN
  -- Stamps earned this update. If a reward was just unlocked (a conversion),
  -- 10 stamps were reset within this same UPDATE — add them back so the earned
  -- count is correct even when NEW.stamps < OLD.stamps.
  v_earned := NEW.stamps - OLD.stamps;
  IF OLD.pending_reward = false AND NEW.pending_reward = true THEN
    v_earned := v_earned + 10;
  END IF;
  IF v_earned > 0 THEN
    v_points_to_add := v_earned;
  END IF;

  -- Redeeming a reward (pending_reward true -> false) = +1 point.
  IF OLD.pending_reward = true AND NEW.pending_reward = false THEN
    v_points_to_add := v_points_to_add + 1;
  END IF;

  IF v_points_to_add > 0 THEN
    PERFORM update_weekly_points(NEW.user_id, v_points_to_add);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition unchanged; recreate defensively so this file is standalone.
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_rewards;
CREATE TRIGGER trigger_update_leaderboard
  AFTER UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_leaderboard_from_rewards();
