# API Documentation: /api/map-actions

## Overview

The `/api/map-actions` endpoint transforms real-time feed data into tactical map visualizations. It implements a three-stage pipeline: FeedItem → EventFrame → MapAction, providing structured intelligence suitable for Command & Conquer-style tactical map rendering.

## Endpoint

```
GET /api/map-actions
```

## Query Parameters

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `window` | string | `'1h'` | `'10m'` \| `'1h'` \| `'6h'` \| `'24h'` \| `'7d'` | Time window for filtering events |
| `limit` | number | `200` | `1-500` | Maximum number of actions to return (clamped) |

## Response Format

```typescript
{
  actions: MapAction[];        // Array of tactical map actions
  total: number;               // Number of actions returned
  window: string;              // Time window used
  feed_items_analyzed: number; // Feed items processed
  event_frames_created: number; // EventFrames successfully created
  response_time_ms: number;    // Server processing time
}
```

## MapAction Schema

```typescript
interface MapAction {
  id: string;                   // Unique action ID
  event_frame_id: string;       // Link to source EventFrame
  action_type: MapActionType;   // Visual action type
  color: MapActionColor;        // Color scheme
  duration: AnimationDuration;  // Animation duration

  origin?: {                    // Starting point (for trajectories)
    lat: number;
    lng: number;
  };

  target: {                     // Impact location
    lat: number;
    lng: number;
  };

  animation_config: {
    intensity: number;          // 0.0-1.0 - Animation drama level
    pulse_count?: number;       // For PULSE_STRIKE (1-5)
    trajectory_arc?: number;    // For missiles (0.0-1.0)
    area_radius?: number;       // For AREA_SHELLING (pixels)
    icon_size?: 'small' | 'medium' | 'large';
  };

  popup?: {
    title: string;
    description: string;
    timestamp: number;          // Unix seconds
    severity: EventSeverity;
    details?: {
      casualties?: string;
      weapon_system?: string;
      target_type?: string;
    };
  };

  z_index: number;              // Layer priority
  visible: boolean;
  expires_at?: number;          // Unix seconds
  created_at: number;           // Unix seconds
}
```

## Action Types

| Type | Description | Animation |
|------|-------------|-----------|
| `PULSE_STRIKE` | General strikes/explosions | Pulsing circle |
| `TRAJECTORY_MISSILE` | Ballistic/cruise missiles | High-arc trajectory |
| `TRAJECTORY_DRONE` | UAV/drone strikes | Low-arc path |
| `AREA_SHELLING` | Artillery barrages | Multiple pulses |
| `NAVAL_STRIKE` | Ship-to-shore bombardment | Coastal indicator |
| `GROUND_MOVEMENT` | Troop/armor movement | Directional arrow |
| `AIR_DEFENSE` | SAM/interceptor launch | Upward trajectory |
| `PROTEST_MARKER` | Civil demonstrations | Static marker |
| `CYBER_INDICATOR` | Digital attacks | Digital effect |
| `DIPLOMATIC_ICON` | Diplomatic actions | Static icon |
| `INCIDENT_MARKER` | Generic incidents | Static marker |

## Color Scheme (DEFCON-style)

| Color | Severity | Usage |
|-------|----------|-------|
| `red` | Critical | DEFCON 1 equivalent, mass casualties |
| `orange` | High | DEFCON 2-3, significant actions |
| `yellow` | Medium | DEFCON 4, tactical ops |
| `blue` | Low | DEFCON 5, minor incidents |
| `green` | Minimal | Peacetime, diplomatic |
| `purple` | Special | Cyber/information warfare |

## Event Type Classification

The system automatically infers event types from feed item tags and titles:

### Kinetic Events
- `missile_strike` - Ballistic, cruise, ATACMS
- `drone_strike` - UAV, kamikaze drones
- `airstrike` - Fighter jets, bombers
- `artillery_shelling` - Howitzers, MLRS, mortars
- `naval_strike` - Ship-launched weapons
- `ground_assault` - Infantry/armor operations
- `rocket_attack` - Unguided rockets
- `air_defense` - SAM, interceptors

### Non-Kinetic Events
- `protest` - Demonstrations, civil unrest
- `sanction` - Economic/diplomatic pressure
- `cyberattack` - Digital warfare
- `diplomatic_action` - Negotiations, agreements
- `intelligence_ops` - Espionage, surveillance
- `information_warfare` - Propaganda, disinformation

### Incident Events
- `explosion` - Unclear origin
- `accident` - Military mishaps
- `sabotage` - Covert actions
- `unknown` - Unclassifiable

## Severity Inference

Severity is determined by keyword analysis:

| Severity | Keywords |
|----------|----------|
| **Critical** | nuclear, wmd, chemical, mass casualties, strategic |
| **High** | dozens killed, major attack, military base, headquarters |
| **Medium** | casualties, wounded, damaged, several |
| **Low** | minor, small, limited, isolated, skirmish |
| **Minimal** | diplomatic, protest, statement |

## Geographic Resolution

The system uses an offline geo-resolution pipeline:

1. **Entity Places**: Extracts locations from `entity_places` field
2. **Fuzzy Matching**: Levenshtein distance for typo handling
3. **Strategic Priority**: Prioritizes strategic locations
4. **Fallback**: Country centroids if city unknown
5. **Confidence Scoring**: 0-100 based on match quality

Precision levels:
- `city` - GPS-level accuracy (highest)
- `country` - Country centroid (estimated)
- `unknown` - No location found (filtered out)

## Example Requests

### Get last hour of critical events
```bash
curl "http://localhost:3000/api/map-actions?window=1h&limit=50"
```

### Get last 24 hours for tactical overview
```bash
curl "http://localhost:3000/api/map-actions?window=24h&limit=200"
```

### Get last 7 days for strategic analysis
```bash
curl "http://localhost:3000/api/map-actions?window=7d&limit=500"
```

### Get last 10 minutes for real-time monitoring
```bash
curl "http://localhost:3000/api/map-actions?window=10m&limit=100"
```

## Performance

Benchmarks (on ~196 feed items database):

| Window | Limit | Items | Actions | Time |
|--------|-------|-------|---------|------|
| 10m | 10 | 0 | 0 | ~50ms |
| 1h | 50 | 5 | 4 | ~80ms |
| 24h | 200 | 25 | 20 | ~150ms |
| 7d | 500 | 196 | 156 | ~240ms |

Average conversion rate: 80% (items with valid locations)

## Error Handling

| Error | Status | Response |
|-------|--------|----------|
| Database failure | 500 | `{ error: "Database query failed", message: "..." }` |
| Processing error | 500 | `{ error: "Failed to generate map actions", message: "..." }` |

Invalid parameters fall back to defaults (no 400 errors):
- Invalid `window` → defaults to `'1h'`
- Invalid `limit` → defaults to `200`
- `limit > 500` → clamped to `500`
- `limit < 1` → clamped to `1`

## Database Query Details

**CRITICAL**: Database uses Unix timestamps in **SECONDS**, not milliseconds.

Query structure:
```sql
SELECT * FROM feed_items
WHERE published_at >= [threshold_seconds]
  AND is_duplicate = 0
ORDER BY published_at DESC
LIMIT [limit]
```

Threshold calculation:
```typescript
const thresholdTimestamp = Math.floor(Date.now() / 1000) - window_seconds;
```

## Integration Notes

### Frontend Usage (React Query)
```typescript
const { data } = useQuery({
  queryKey: ['map-actions', window, limit],
  queryFn: async () => {
    const response = await fetch(
      `/api/map-actions?window=${window}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  refetchInterval: 30000, // 30s auto-refresh
});
```

### SSE Real-time Updates
For real-time updates, combine with `/api/stream/events` (SSE endpoint):
1. Initial load: `GET /api/map-actions?window=1h`
2. Subscribe: `EventSource('/api/stream/events')`
3. On new event: Re-fetch or append incrementally

### Map Rendering
```typescript
actions.forEach(action => {
  switch(action.action_type) {
    case 'TRAJECTORY_MISSILE':
      renderTrajectory(action.origin, action.target, action.animation_config);
      break;
    case 'PULSE_STRIKE':
      renderPulse(action.target, action.animation_config);
      break;
    // ... etc
  }
});
```

## Future Enhancements

- [ ] ML-based origin prediction for trajectories
- [ ] Real-time SSE streaming of new actions
- [ ] Action clustering for nearby events
- [ ] Historical replay with timestamp filtering
- [ ] Advanced filtering (by event_type, severity, region)
- [ ] WebSocket support for live updates
- [ ] Caching layer (Redis) for performance

## Related Files

- `/app/api/map-actions/route.ts` - Endpoint implementation
- `/lib/map/eventMapper.ts` - EventFrame → MapAction conversion
- `/lib/geo/resolveLocation.ts` - Geo-resolution system
- `/types/map/EventFrame.ts` - EventFrame type definitions
- `/types/map/MapAction.ts` - MapAction type definitions
- `/lib/db/adapter.ts` - Database abstraction layer

## Author

Backend Architect Agent
Created: 2026-02-28
Version: 1.0.0
