-- ================================================================
-- Performance Test Script: Create 100 Tasks for Testing
-- Usage: Replace 'YOUR-HOUSEHOLD-ID-HERE' with actual household UUID
-- Run in Supabase SQL Editor
-- ================================================================

-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Replace 'YOUR-HOUSEHOLD-ID-HERE' below with your household's UUID
--    (You can find it by running: SELECT id FROM households WHERE name = 'your-household-name';)
-- 3. Run the script
-- 4. Verify in your app that task list renders within 2 seconds (T047)

DO $$
DECLARE
  target_household_id uuid := 'YOUR-HOUSEHOLD-ID-HERE';  -- ⬅️ REPLACE THIS
  task_count int := 0;
BEGIN
  -- Verify household exists
  IF NOT EXISTS (SELECT 1 FROM public.households WHERE id = target_household_id) THEN
    RAISE EXCEPTION 'Household ID % not found. Please check the UUID.', target_household_id;
  END IF;

  -- Insert 100 tasks with varied titles
  INSERT INTO public.tasks (household_id, title, status)
  SELECT
    target_household_id,
    CASE
      -- Mix of realistic task titles
      WHEN i % 10 = 0 THEN 'Buy groceries (milk, eggs, bread)'
      WHEN i % 10 = 1 THEN 'Take out trash and recycling'
      WHEN i % 10 = 2 THEN 'Pay utility bills before due date'
      WHEN i % 10 = 3 THEN 'Schedule dentist appointment'
      WHEN i % 10 = 4 THEN 'Clean bathroom and kitchen'
      WHEN i % 10 = 5 THEN 'Water plants and garden'
      WHEN i % 10 = 6 THEN 'Call mom for her birthday'
      WHEN i % 10 = 7 THEN 'Organize garage and donate old items'
      WHEN i % 10 = 8 THEN 'Review monthly budget and expenses'
      WHEN i % 10 = 9 THEN 'Change air filters in HVAC system'
    END || ' #' || i::text,  -- Add number to make each title unique
    CASE
      -- Mix of complete and incomplete tasks (20% complete, 80% incomplete)
      WHEN i % 5 = 0 THEN 'complete'
      ELSE 'incomplete'
    END
  FROM generate_series(1, 100) AS i;

  -- Get count of tasks created
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE household_id = target_household_id;

  RAISE NOTICE '✅ Successfully created 100 tasks for household %', target_household_id;
  RAISE NOTICE '📊 Total tasks for this household: %', task_count;
  RAISE NOTICE '🧪 Test T047: Verify task list renders in < 2 seconds';
END $$;

-- ================================================================
-- CLEANUP SCRIPT (Optional - run after testing)
-- ================================================================

-- Uncomment and run this to delete the test tasks after performance validation:
/*
DO $$
DECLARE
  target_household_id uuid := 'YOUR-HOUSEHOLD-ID-HERE';  -- ⬅️ SAME UUID AS ABOVE
  deleted_count int;
BEGIN
  DELETE FROM public.tasks
  WHERE household_id = target_household_id
    AND title LIKE '%#%';  -- Only delete numbered test tasks
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '🧹 Deleted % test tasks', deleted_count;
END $$;
*/
