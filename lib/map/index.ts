/**
 * Map Library - Central Export
 *
 * Event Mapper: Converts EventFrame (intelligence) to MapAction (visualization)
 */

export {
  eventFrameToMapAction,
  batchEventFramesToMapActions,
  filterMapActionsByTimeWindow,
  groupMapActionsByProximity,
} from './eventMapper';
