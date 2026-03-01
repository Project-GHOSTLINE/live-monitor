# CCE Bring-Up Report
**Date**: 2026-03-01
**System**: WW3 Monitor - Conflict Core Engine v2
**Environment**: Production (Vercel + Supabase)

---

## Checklist Status

### ✅ Step 1: Vercel Build
- **Latest Commit**: `f58edcb` - DB schema report
- **UUID Fix Commit**: `dc9f110` - Replaced uuid with crypto.randomUUID
- **Build Status**: ⏳ PENDING VERIFICATION
- **Action Required**: Check https://vercel.com/dashboard for green build

### ⏳ Step 2: Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
CCE_ENABLED=true
CCE_V2_ENABLED=true
NEXT_PUBLIC_CCE_V2_ENABLED=true
```

**Status**: ⏳ MANUAL ACTION REQUIRED

### ⏳ Step 3: Trigger First CCE Update
Run this command after env vars are set and build is deployed:

```bash
curl -X POST https://middleeastlivefeed.com/api/cron/cce-update \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Status**: ⏳ WAITING FOR ENV VARS

### ⏳ Step 4: Verification Queries
Run `scripts/verify-cce-bringup.sql` in Supabase SQL Editor

**Status**: ⏳ WAITING FOR FIRST UPDATE

---

## Expected Results (After First Update)

### Table Population Targets

| Table | Expected Count | Actual Count | Status |
|-------|---------------|--------------|---------|
| `conflict_state_live` | 13 (one per conflict) | - | ⏳ |
| `theatre_state_live` | 4 (ME, EE, IP, Global) | - | ⏳ |
| `front_state_live` | 6 (all fronts) | - | ⏳ |
| `relation_edges` | 20+ (bilateral relations) | - | ⏳ |
| `alliance_pressure_live` | 12 (one per alliance) | - | ⏳ |

### Data Quality Checks

#### Top Theatres by Momentum
Expected to see:
- MiddleEast (highest momentum due to IL-IR conflict)
- EuropeEast (RU-UA conflict)
- IndoPacific (CN-TW, KP-KR tensions)
- Global (US-RU, US-CN relations)

#### Top Conflicts by Pressure
Expected ranking:
1. IL-IR (85%+ pressure)
2. RU-UA (75%+ pressure)
3. US-RU (70%+ pressure)
4. IL-Gaza (65%+ pressure)
5. CN-TW (60%+ pressure)

#### Active Fronts
Expected to show intensity >0.1:
- Levant Arc (IL/LB/SY)
- Strait of Hormuz (US/IR)
- Others pending event data

---

## Verification Results

### 1. Table Row Counts
```
⏳ Run query and paste results here
```

### 2. Theatre State (Top 5 by Momentum)
```
⏳ Run query and paste results here
```

### 3. Top Conflicts by Pressure
```
⏳ Run query and paste results here
```

### 4. Active Fronts
```
⏳ Run query and paste results here
```

### 5. Alliance Pressure (Top 5)
```
⏳ Run query and paste results here
```

### 6. Recent Event Frames
```
⏳ Run query and paste results here
```

### 7. Data Freshness
```
⏳ Run query and paste results here
```

---

## Troubleshooting

### If `conflict_state_live` count is 0:
**Cause**: CCE update hasn't run or `conflicts_core` is empty
**Fix**:
1. Verify seed data: `SELECT COUNT(*) FROM conflicts_core;` (should be 13)
2. Check cron logs for errors
3. Manually trigger: `curl -X POST .../api/cron/cce-update`

### If `theatre_state_live` count is 0:
**Cause**: Theatre aggregation phase failed or no conflicts have state
**Fix**:
1. Check if `conflict_state_live` has data
2. Verify `CCE_V2_ENABLED=true`
3. Check cron logs for phase 4 errors

### If `front_state_live` count is 0:
**Cause**: Front lines not seeded or front state phase failed
**Fix**:
1. Verify seed data: `SELECT COUNT(*) FROM front_lines;` (should be 6)
2. Check cron logs for phase 6 errors
3. Verify `CCE_V2_ENABLED=true`

### If `relation_edges` count is 0:
**Cause**: Relation derivation phase failed
**Fix**:
1. Check if `conflict_state_live` has data
2. Verify `CCE_ENABLED=true`
3. Check cron logs for phase 3 errors

### If all counts are correct but data is stale:
**Cause**: Cron not scheduled or failing
**Fix**:
1. Check Vercel cron configuration
2. Verify `CRON_SECRET` env var is set
3. Check Vercel function logs for `/api/cron/cce-update`

---

## API Endpoint Tests

After verification, test these endpoints:

### 1. Theatres
```bash
curl https://middleeastlivefeed.com/api/cce/theatres
```
**Expected**: JSON with 4 theatres, sorted by tension

### 2. Top Conflicts
```bash
curl https://middleeastlivefeed.com/api/cce/conflicts/top?limit=10
```
**Expected**: JSON with top 10 conflicts by pressure

### 3. Active Fronts
```bash
curl https://middleeastlivefeed.com/api/cce/fronts?min_intensity=0.1
```
**Expected**: JSON with active fronts (intensity >0.1)

### 4. Global State
```bash
curl https://middleeastlivefeed.com/api/state/global
```
**Expected**: JSON including `theatre_state` field

---

## UI Verification

Visit: https://middleeastlivefeed.com/command-center

### Visual Checks
- ✅ **TheatreBar** appears above leader bubbles
  - Shows 4 theatres with tension %
  - Color-coded threat levels
  - Hover tooltips with metrics

- ✅ **FrontLinesPanel** appears after Global Theater Map
  - Shows top 4 active fronts
  - Control bars with actor %
  - Pulse animation on high intensity

- ✅ **Leader Intel Popups** enhanced
  - "Active Conflicts" section replaces "Relations"
  - Shows top 3 conflicts per leader
  - Pressure % badges (red/orange/yellow)
  - Momentum arrows (↗/→/↘)

---

## Success Criteria

### ✅ All Passing Means:
- All table counts match expected values
- Theatre state shows 4 active theatres
- Top conflicts ranked correctly by pressure
- Front state shows active fronts with intensity >0
- All API endpoints return valid JSON
- UI components render without errors
- Data freshness <15 minutes

### 🎯 Production Ready When:
1. All verification queries return expected counts
2. All API endpoints respond successfully
3. UI components display live data
4. No errors in Vercel function logs
5. Data updates every 15 minutes via cron

---

## Next Actions

### If All Checks Pass ✅
1. Enable auto-refresh on Command Center
2. Monitor for 24 hours
3. Set up alerting for stale data
4. Document for team

### If Any Checks Fail ⚠️
1. Identify which step failed (see Troubleshooting section)
2. Fix the issue
3. Re-run verification
4. Update this report with findings

---

**Report Status**: ⏳ AWAITING FIRST UPDATE
**Last Updated**: 2026-03-01 11:15:00 UTC
