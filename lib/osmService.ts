/**
 * OpenStreetMap (OSM) Service for Residential Building Detection
 * 
 * This service provides functions to query OSM data for residential buildings
 * using the Overpass API. It's specifically designed for Toronto's dense
 * residential neighborhoods.
 */

import * as turf from '@turf/turf'

// OSM Building Types for Residential Detection
export const RESIDENTIAL_BUILDING_TYPES = [
  'residential',
  'house', 
  'apartments',
  'detached',
  'semi_detached_house',
  'terrace',
  'bungalow',
  'duplex',
  'townhouse',
  'condo'
] as const

export type ResidentialBuildingType = typeof RESIDENTIAL_BUILDING_TYPES[number]

// OSM Building Interface
export interface OSMBuilding {
  id: number
  type: 'way' | 'relation'
  tags: {
    building?: string
    name?: string
    'addr:housenumber'?: string
    'addr:street'?: string
    'addr:city'?: string
    'addr:postcode'?: string
    'addr:province'?: string
    'building:levels'?: string
    'building:use'?: string
    [key: string]: string | undefined
  }
  geometry?: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][]
  }
  lat?: number
  lon?: number
  center?: {
    lat: number
    lng: number
  }
}

// OSM Query Interface
export interface OSMQuery {
  bbox: {
    south: number
    west: number
    north: number
    east: number
  }
  buildingTypes: ResidentialBuildingType[]
  streetName?: string
  timeout?: number
}

// Building Footprint Interface
export interface BuildingFootprint {
  id: string
  name: string
  address: string
  buildingNumber?: string
  lat: number
  lng: number
  buildingType: string
  levels?: number
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][]
  }
  area?: number // in square meters
}

// OSM Service Class
export class OSMService {
  private readonly OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'
  private readonly DEFAULT_TIMEOUT = 25 // seconds
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000 // milliseconds

  /**
   * Create a tight bounding box around street coordinates
   * @param streetCoords Array of [lng, lat] coordinates
   * @param radius Radius in meters (default: 100m)
   * @returns OSM bounding box format
   */
  createTightBoundingBox(streetCoords: [number, number][], radius: number = 100): OSMQuery['bbox'] {
    if (streetCoords.length === 0) {
      throw new Error('No street coordinates provided')
    }

    // Create a GeoJSON feature collection from street coordinates
    const points = streetCoords.map(([lng, lat]) => turf.point([lng, lat]))
    const featureCollection = turf.featureCollection(points)
    
    // Get the bounding box
    const bbox = turf.bbox(featureCollection)
    
    // Convert to meters and add radius buffer
    const radiusInDegrees = radius / 111000 // Approximate conversion (1 degree ≈ 111km)
    
    return {
      south: bbox[1] - radiusInDegrees,
      west: bbox[0] - radiusInDegrees,
      north: bbox[3] + radiusInDegrees,
      east: bbox[2] + radiusInDegrees
    }
  }

  /**
   * Build Overpass API query for residential buildings
   * @param query OSM query parameters
   * @returns Overpass API query string
   */
  buildResidentialBuildingQuery(query: OSMQuery): string {
    const { bbox, buildingTypes, streetName, timeout = this.DEFAULT_TIMEOUT } = query
    
    // Create building type filter
    const buildingTypeFilter = buildingTypes.map(type => `"${type}"`).join('|')
    
    // Base query for residential buildings
    let overpassQuery = `
[out:json][timeout:${timeout}];
(
  way["building"~"^(${buildingTypeFilter})$"]
     (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  relation["building"~"^(${buildingTypeFilter})$"]
     (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out geom;
`

    // Add street name filter if provided
    if (streetName) {
      const streetNameLower = streetName.toLowerCase()
      overpassQuery = `
[out:json][timeout:${timeout}];
(
  way["building"~"^(${buildingTypeFilter})$"]["addr:street"~"${streetNameLower}",i]
     (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  relation["building"~"^(${buildingTypeFilter})$"]["addr:street"~"${streetNameLower}",i]
     (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out geom;
`
    }

    return overpassQuery.trim()
  }

  /**
   * Fetch buildings from OSM Overpass API
   * @param query Overpass API query string
   * @returns Promise<OSMBuilding[]>
   */
  async fetchOSMBuildings(query: string): Promise<OSMBuilding[]> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🌐 OSM API Request (attempt ${attempt}/${this.MAX_RETRIES})`)
        console.log(`📝 Query: ${query.substring(0, 200)}...`)
        
        const response = await fetch(this.OVERPASS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.elements && Array.isArray(data.elements)) {
          console.log(`✅ OSM API Success: ${data.elements.length} elements returned`)
          return data.elements
        } else {
          throw new Error('Invalid OSM API response format')
        }
        
      } catch (error) {
        lastError = error as Error
        console.error(`❌ OSM API Error (attempt ${attempt}/${this.MAX_RETRIES}):`, error)
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`⏳ Retrying in ${this.RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
        }
      }
    }
    
    throw new Error(`OSM API failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`)
  }

  /**
   * Process OSM building elements into standardized format
   * @param osmElements Raw OSM elements
   * @param streetName Street name for context
   * @returns Processed building footprints
   */
  processOSMBuildings(osmElements: OSMBuilding[], streetName: string): BuildingFootprint[] {
    console.log(`🏗️ Processing ${osmElements.length} OSM building elements for street: ${streetName}`)
    
    const processedBuildings: BuildingFootprint[] = []
    
    for (const element of osmElements) {
      try {
        // Skip elements without building tags
        if (!element.tags?.building) {
          continue
        }
        
        // Calculate building center
        const center = this.calculateBuildingCenter(element)
        if (!center) {
          console.warn(`⚠️ Could not calculate center for building ${element.id}`)
          continue
        }
        
        // Extract address information
        const address = this.extractAddressFromOSM(element.tags, streetName)
        const buildingNumber = this.extractBuildingNumber(element.tags)
        
        // Calculate building area if geometry is available
        let area: number | undefined
        if (element.geometry) {
          area = this.calculateBuildingArea(element.geometry)
        }
        
        const building: BuildingFootprint = {
          id: `osm-building-${element.id}`,
          name: element.tags.name || `Residential Building`,
          address: address,
          buildingNumber: buildingNumber,
          lat: center.lat,
          lng: center.lng,
          buildingType: element.tags.building,
          levels: element.tags['building:levels'] ? parseInt(element.tags['building:levels']) : undefined,
          geometry: element.geometry || {
            type: 'Polygon',
            coordinates: [[[center.lng, center.lat], [center.lng, center.lat], [center.lng, center.lat], [center.lng, center.lat]]]
          },
          area: area
        }
        
        processedBuildings.push(building)
        console.log(`✅ Processed building: ${building.address} (${building.lat.toFixed(6)}, ${building.lng.toFixed(6)})`)
        
      } catch (error) {
        console.error(`❌ Error processing building ${element.id}:`, error)
      }
    }
    
    console.log(`🎯 OSM processing completed: ${processedBuildings.length} buildings processed`)
    return processedBuildings
  }

  /**
   * Calculate the center point of a building
   * @param building OSM building element
   * @returns Center coordinates or null if calculation fails
   */
  private calculateBuildingCenter(building: OSMBuilding): { lat: number; lng: number } | null {
    // If building has lat/lon, use them
    if (building.lat && building.lon) {
      return { lat: building.lat, lng: building.lon }
    }
    
    // If building has geometry, calculate center
    if (building.geometry) {
      try {
        const polygon = turf.polygon(building.geometry.coordinates[0])
        const center = turf.centroid(polygon)
        return {
          lat: center.geometry.coordinates[1],
          lng: center.geometry.coordinates[0]
        }
      } catch (error) {
        console.error(`❌ Error calculating building center:`, error)
        return null
      }
    }
    
    return null
  }

  /**
   * Extract address from OSM tags
   * @param tags OSM building tags
   * @param streetName Street name for context
   * @returns Formatted address string
   */
  private extractAddressFromOSM(tags: OSMBuilding['tags'], streetName: string): string {
    const parts: string[] = []
    
    // Add house number
    if (tags['addr:housenumber']) {
      parts.push(tags['addr:housenumber'])
    }
    
    // Add street name
    if (tags['addr:street']) {
      parts.push(tags['addr:street'])
    } else if (streetName) {
      parts.push(streetName)
    }
    
    // Add city
    if (tags['addr:city']) {
      parts.push(tags['addr:city'])
    }
    
    // Add province
    if (tags['addr:province']) {
      parts.push(tags['addr:province'])
    }
    
    // Add postal code
    if (tags['addr:postcode']) {
      parts.push(tags['addr:postcode'])
    }
    
    return parts.join(' ') || `Building on ${streetName}`
  }

  /**
   * Extract building number from OSM tags
   * @param tags OSM building tags
   * @returns Building number or undefined
   */
  private extractBuildingNumber(tags: OSMBuilding['tags']): string | undefined {
    return tags['addr:housenumber']
  }

  /**
   * Calculate building area from geometry
   * @param geometry Building geometry
   * @returns Area in square meters
   */
  private calculateBuildingArea(geometry: OSMBuilding['geometry']): number | undefined {
    if (!geometry || !geometry.coordinates) {
      return undefined
    }
    
    try {
      const polygon = turf.polygon(geometry.coordinates[0])
      const area = turf.area(polygon) // Returns area in square meters
      return area
    } catch (error) {
      console.error(`❌ Error calculating building area:`, error)
      return undefined
    }
  }
}

// Export singleton instance
export const osmService = new OSMService()
