/**
 * OpenStreetMap (OSM) Type Definitions
 * 
 * This file contains TypeScript interfaces and types for OSM data structures
 * used in residential building detection.
 */

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

// OSM Building Element Interface
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
    'addr:country'?: string
    'building:levels'?: string
    'building:use'?: string
    'building:material'?: string
    'building:roof'?: string
    'building:year'?: string
    'height'?: string
    'roof:height'?: string
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

// OSM Query Parameters Interface
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
  includeGeometry?: boolean
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
  height?: number // in meters
  year?: number
  material?: string
  roof?: string
}

// OSM API Response Interface
export interface OSMResponse {
  version: number
  generator: string
  osm3s: {
    timestamp_osm_base: string
    copyright: string
  }
  elements: OSMBuilding[]
}

// OSM Error Response Interface
export interface OSMError {
  version: number
  generator: string
  osm3s: {
    timestamp_osm_base: string
    copyright: string
  }
  remark: string
}

// OSM Service Configuration Interface
export interface OSMServiceConfig {
  apiUrl: string
  defaultTimeout: number
  maxRetries: number
  retryDelay: number
  rateLimitDelay: number
}

// OSM Building Search Parameters Interface
export interface OSMBuildingSearchParams {
  streetName: string
  streetCoords: [number, number][]
  radius: number // in meters
  buildingTypes: ResidentialBuildingType[]
  maxDistanceFromStreet: number // in meters
  addressValidationLevel: 'strict' | 'moderate' | 'loose'
  coordinatePrecision: 'high' | 'medium' | 'low'
}

// OSM Building Search Result Interface
export interface OSMBuildingSearchResult {
  buildings: BuildingFootprint[]
  totalFound: number
  filteredCount: number
  searchParams: OSMBuildingSearchParams
  bbox: OSMQuery['bbox']
  queryTime: number // in milliseconds
  apiCalls: number
}

// OSM Building Validation Result Interface
export interface OSMBuildingValidationResult {
  building: BuildingFootprint
  isValid: boolean
  validationErrors: string[]
  distanceFromStreet?: number // in meters
  addressMatch?: boolean
  buildingTypeMatch?: boolean
  geographicContextMatch?: boolean
}

// OSM Geographic Context Interface
export interface OSMGeographicContext {
  area?: string
  municipality?: string
  community?: string
  postalCode?: string
  province?: string
  country?: string
  bbox: OSMQuery['bbox']
}

// OSM Building Statistics Interface
export interface OSMBuildingStatistics {
  totalBuildings: number
  residentialBuildings: number
  averageArea: number // in square meters
  averageHeight: number // in meters
  buildingTypes: Record<string, number>
  addressCoverage: number // percentage with addresses
  geometryCoverage: number // percentage with geometry
}

// OSM Service Error Types
export type OSMServiceError = 
  | 'API_TIMEOUT'
  | 'API_RATE_LIMIT'
  | 'INVALID_QUERY'
  | 'NO_RESULTS'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'

// OSM Service Error Interface
export interface OSMServiceErrorDetails {
  type: OSMServiceError
  message: string
  details?: any
  retryable: boolean
  timestamp: Date
}

// OSM Building Filter Interface
export interface OSMBuildingFilter {
  buildingTypes?: ResidentialBuildingType[]
  minArea?: number // in square meters
  maxArea?: number // in square meters
  minLevels?: number
  maxLevels?: number
  hasAddress?: boolean
  hasGeometry?: boolean
  addressContains?: string
  excludeTypes?: string[]
}

// OSM Building Sort Options Interface
export interface OSMBuildingSortOptions {
  field: 'address' | 'buildingNumber' | 'area' | 'distance' | 'buildingType'
  direction: 'asc' | 'desc'
}

// OSM Building Export Options Interface
export interface OSMBuildingExportOptions {
  format: 'geojson' | 'csv' | 'json'
  includeGeometry: boolean
  includeMetadata: boolean
  filter?: OSMBuildingFilter
  sort?: OSMBuildingSortOptions
}
