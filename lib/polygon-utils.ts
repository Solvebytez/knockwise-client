// @ts-ignore
import { google } from "googlemaps"

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Filters residents that are inside a given polygon using Google Maps geometry library
 * @param residents Array of residents with lat/lng coordinates
 * @param polygon Google Maps Polygon object or array of LatLng points
 * @returns Array of residents inside the polygon
 */
export function filterResidentsInsidePolygon(
  residents: Array<{ id: string; lat: number; lng: number; [key: string]: any }>,
  polygon: google.maps.Polygon | LatLng[],
): Array<{ id: string; lat: number; lng: number; [key: string]: any }> {
  if (!window.google?.maps?.geometry) {
    console.warn("Google Maps geometry library not loaded")
    return residents
  }

  return residents.filter((resident) => {
    const point = new google.maps.LatLng(resident.lat, resident.lng)

    if (polygon instanceof google.maps.Polygon) {
      return google.maps.geometry.poly.containsLocation(point, polygon)
    } else {
      // Convert LatLng array to Google Maps Polygon for containment check
      const polygonPath = polygon.map((p: LatLng) => new google.maps.LatLng(p.lat, p.lng))
      const tempPolygon = new google.maps.Polygon({ paths: polygonPath })
      return google.maps.geometry.poly.containsLocation(point, tempPolygon)
    }
  })
}

/**
 * Calculates the area of a polygon in square meters
 * @param polygon Array of LatLng points or Google Maps Polygon
 * @returns Area in square meters
 */
export function calculatePolygonArea(polygon: LatLng[] | google.maps.Polygon): number {
  if (!window.google?.maps?.geometry) {
    console.warn("Google Maps geometry library not loaded")
    return 0
  }

  if (polygon instanceof google.maps.Polygon) {
    return google.maps.geometry.spherical.computeArea(polygon.getPath())
  } else {
    const path = polygon.map((p: LatLng) => new google.maps.LatLng(p.lat, p.lng))
    return google.maps.geometry.spherical.computeArea(path)
  }
}

/**
 * Calculates the center point of a polygon
 * @param polygon Array of LatLng points
 * @returns Center point as LatLng
 */
export function getPolygonCenter(polygon: LatLng[]): LatLng {
  if (polygon.length === 0) {
    return { lat: 0, lng: 0 }
  }

  const bounds = new google.maps.LatLngBounds()
  polygon.forEach((point) => {
    bounds.extend(new google.maps.LatLng(point.lat, point.lng))
  })

  const center = bounds.getCenter()
  return {
    lat: center.lat(),
    lng: center.lng(),
  }
}

/**
 * Validates if a polygon has at least 3 points and forms a valid shape
 * @param polygon Array of LatLng points
 * @returns Boolean indicating if polygon is valid
 */
export function isValidPolygon(polygon: LatLng[]): boolean {
  return polygon.length >= 3
}

/**
 * Converts a Google Maps Polygon to an array of LatLng points
 * @param polygon Google Maps Polygon object
 * @returns Array of LatLng points
 */
export function polygonToLatLngArray(polygon: google.maps.Polygon): LatLng[] {
  const path = polygon.getPath()
  const points: LatLng[] = []

  for (let i = 0; i < path.getLength(); i++) {
    const point = path.getAt(i)
    points.push({
      lat: point.lat(),
      lng: point.lng(),
    })
  }

  return points
}
