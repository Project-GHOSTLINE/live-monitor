/**
 * Map Projection Utilities
 *
 * Converts lat/lon to SVG coordinates for theater map
 */

import { THEATER_BOUNDS } from './locations';

/**
 * Project lat/lon to SVG coordinates
 * Simple equirectangular projection
 */
export function project(
  lat: number,
  lon: number,
  width: number,
  height: number
): { x: number; y: number } {
  const { minLat, maxLat, minLon, maxLon } = THEATER_BOUNDS;

  const x = ((lon - minLon) / (maxLon - minLon)) * width;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * height;

  return { x, y };
}

/**
 * Inverse projection: SVG coordinates to lat/lon
 */
export function unproject(
  x: number,
  y: number,
  width: number,
  height: number
): { lat: number; lon: number } {
  const { minLat, maxLat, minLon, maxLon } = THEATER_BOUNDS;

  const lon = minLon + (x / width) * (maxLon - minLon);
  const lat = maxLat - (y / height) * (maxLat - minLat);

  return { lat, lon };
}

/**
 * Calculate distance between two lat/lon points (km)
 * Haversine formula
 */
export function distance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
