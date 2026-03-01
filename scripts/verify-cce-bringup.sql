-- =========================
-- CCE Bring-Up Verification Script
-- Run this in Supabase SQL Editor after first CCE update
-- =========================

-- 1. Check conflict state population
SELECT 'conflict_state_live' as table_name, COUNT(*) as row_count
FROM conflict_state_live
UNION ALL
SELECT 'theatre_state_live', COUNT(*)
FROM theatre_state_live
UNION ALL
SELECT 'front_state_live', COUNT(*)
FROM front_state_live
UNION ALL
SELECT 'relation_edges', COUNT(*)
FROM relation_edges
UNION ALL
SELECT 'alliance_pressure_live', COUNT(*)
FROM alliance_pressure_live
ORDER BY table_name;

-- 2. Check theatre state details (top 5 by momentum)
SELECT
  theatre,
  ROUND(tension::numeric, 2) as tension,
  ROUND(momentum::numeric, 2) as momentum,
  ROUND(heat::numeric, 2) as heat,
  ROUND(velocity::numeric, 2) as velocity,
  conflict_count,
  dominant_actors,
  active_fronts,
  to_char(to_timestamp(updated_at), 'YYYY-MM-DD HH24:MI:SS') as last_update
FROM theatre_state_live
ORDER BY momentum DESC
LIMIT 5;

-- 3. Check top conflicts by pressure
SELECT
  cc.actor_a || '-' || cc.actor_b as conflict,
  cc.theatre,
  ROUND(csl.tension::numeric, 2) as tension,
  ROUND(csl.pressure::numeric, 2) as pressure,
  ROUND(csl.momentum::numeric, 2) as momentum,
  ROUND(csl.heat::numeric, 2) as heat,
  to_char(to_timestamp(csl.last_event_at), 'YYYY-MM-DD HH24:MI:SS') as last_event
FROM conflict_state_live csl
JOIN conflicts_core cc ON cc.id = csl.conflict_id
ORDER BY csl.pressure DESC
LIMIT 5;

-- 4. Check active fronts
SELECT
  fl.id,
  fl.name,
  fl.theatre,
  ROUND(fsl.intensity::numeric, 2) as intensity,
  fsl.control,
  to_char(to_timestamp(fsl.last_event_at), 'YYYY-MM-DD HH24:MI:SS') as last_event
FROM front_state_live fsl
JOIN front_lines fl ON fl.id = fsl.front_id
WHERE fsl.intensity > 0.1
ORDER BY fsl.intensity DESC;

-- 5. Check alliance pressure (top 5)
SELECT
  a.name as alliance,
  ROUND(apl.pressure::numeric, 2) as pressure,
  apl.top_conflicts,
  apl.affected_members,
  to_char(to_timestamp(apl.updated_at), 'YYYY-MM-DD HH24:MI:SS') as last_update
FROM alliance_pressure_live apl
JOIN alliances a ON a.id = apl.alliance_id
ORDER BY apl.pressure DESC
LIMIT 5;

-- 6. Check event frames (recent 10)
SELECT
  event_type,
  theatre,
  severity,
  ROUND(confidence::numeric, 2) as confidence,
  actors->>'actors' as actors,
  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM event_frames
ORDER BY created_at DESC
LIMIT 10;

-- 7. Data freshness check
SELECT
  'Last conflict update' as metric,
  to_char(to_timestamp(MAX(updated_at)), 'YYYY-MM-DD HH24:MI:SS') as timestamp
FROM conflict_state_live
UNION ALL
SELECT
  'Last theatre update',
  to_char(to_timestamp(MAX(updated_at)), 'YYYY-MM-DD HH24:MI:SS')
FROM theatre_state_live
UNION ALL
SELECT
  'Last event frame',
  to_char(MAX(created_at), 'YYYY-MM-DD HH24:MI:SS')
FROM event_frames;
