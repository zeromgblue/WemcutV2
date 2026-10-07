-- Credits: a monthly allowance per plan, spent by AI actions.
--
-- Run this once in the Supabase SQL editor. It is safe to run again.
--
-- Design: users can only READ their own credit rows. Every change goes through
-- the SECURITY DEFINER functions below, which decide the amounts themselves,
-- so a user cannot grant themselves credits or change what an action costs.

-- ── What each action costs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_costs (
    action TEXT PRIMARY KEY,
    cost INTEGER NOT NULL CHECK (cost >= 0),
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO credit_costs (action, cost, label, sort_order) VALUES
    ('create_project', 5,  'สร้างโปรเจกต์',       1),
    ('subtitles',      10, 'ซับไตเติลอัตโนมัติ',   2),
    ('remove_silence', 10, 'ลบช่วงเงียบ',         3),
    ('ai_chat',        1,  'สั่งงานผู้กำกับ AI',    4)
ON CONFLICT (action) DO UPDATE
    SET cost = EXCLUDED.cost, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read credit costs" ON credit_costs;
CREATE POLICY "Anyone can read credit costs" ON credit_costs FOR SELECT USING (true);

-- ── Lock down tables that had no row level security ───────────────────────
-- Without RLS these were readable and writable by anyone holding the public key.
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage" ON usage;
CREATE POLICY "Users can view own usage" ON usage
    FOR SELECT USING (auth.uid() = user_id);

-- The plan decides the monthly allowance, so users must not be able to edit it.
-- They keep the ability to edit their profile fields.
REVOKE UPDATE ON users FROM anon, authenticated;
GRANT UPDATE (name, avatar_url) ON users TO authenticated;

-- One allowance per user per month.
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_one_grant_per_period
    ON credit_transactions (user_id, reason) WHERE type = 'grant';
CREATE INDEX IF NOT EXISTS credit_transactions_user_created
    ON credit_transactions (user_id, created_at DESC);

-- ── Functions ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.monthly_credit_allowance(p_plan TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN p_plan = 'pro' THEN 1000 ELSE 100 END;
$$;

-- Start of the current billing period (calendar month, UTC).
CREATE OR REPLACE FUNCTION public.credit_period_start()
RETURNS TIMESTAMPTZ LANGUAGE sql STABLE AS $$
    SELECT date_trunc('month', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
$$;

-- Gives the user this month's allowance if they don't have it yet.
CREATE OR REPLACE FUNCTION public.ensure_monthly_grant(p_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_plan TEXT;
BEGIN
    SELECT plan INTO v_plan FROM users WHERE id = p_user;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- created_at is set explicitly: the column's default writes UTC wall-clock
    -- time, which is only correct when the database session runs in UTC.
    INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
    VALUES (
        p_user,
        monthly_credit_allowance(v_plan),
        'grant',
        'monthly:' || to_char(now() AT TIME ZONE 'utc', 'YYYY-MM'),
        now()
    )
    ON CONFLICT DO NOTHING;
END;
$$;

-- The signed-in user's balance for the current period.
CREATE OR REPLACE FUNCTION public.get_credit_status()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_start TIMESTAMPTZ := credit_period_start();
    v_plan TEXT;
    v_granted INTEGER;
    v_used INTEGER;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;

    PERFORM ensure_monthly_grant(v_user);
    SELECT plan INTO v_plan FROM users WHERE id = v_user;

    SELECT COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0),
           COALESCE(-SUM(amount) FILTER (WHERE amount < 0), 0)
      INTO v_granted, v_used
      FROM credit_transactions
     WHERE user_id = v_user AND created_at >= v_start;

    RETURN json_build_object(
        'plan', COALESCE(v_plan, 'free'),
        'granted', v_granted,
        'used', v_used,
        'remaining', GREATEST(v_granted - v_used, 0),
        'period_start', v_start,
        'period_end', v_start + INTERVAL '1 month'
    );
END;
$$;

-- Charges the signed-in user for one action. Returns ok=false, and charges
-- nothing, when the balance is too low.
CREATE OR REPLACE FUNCTION public.spend_credits(p_action TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_cost INTEGER;
    v_remaining INTEGER;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;

    SELECT cost INTO v_cost FROM credit_costs WHERE action = p_action;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown_credit_action: %', p_action;
    END IF;

    -- One charge at a time per user, so two requests can't both spend the last credits.
    PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
    PERFORM ensure_monthly_grant(v_user);

    SELECT COALESCE(SUM(amount), 0) INTO v_remaining
      FROM credit_transactions
     WHERE user_id = v_user AND created_at >= credit_period_start();

    IF v_remaining < v_cost THEN
        RETURN json_build_object('ok', false, 'cost', v_cost, 'remaining', GREATEST(v_remaining, 0));
    END IF;

    IF v_cost > 0 THEN
        INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
        VALUES (v_user, -v_cost, 'deduct', p_action, now());
    END IF;

    RETURN json_build_object('ok', true, 'cost', v_cost, 'remaining', v_remaining - v_cost);
END;
$$;

-- Only signed-in users may call the two public functions; the grant helper is internal.
REVOKE ALL ON FUNCTION public.ensure_monthly_grant(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_credit_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spend_credits(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_credit_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(TEXT) TO authenticated;
