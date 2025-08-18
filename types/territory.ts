import type * as google from "google.maps"

export interface Resident {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: ResidentStatus
  lastVisited?: Date
  notes?: string
  phone?: string
  email?: string
}

export type ResidentStatus =
  | "not-visited"
  | "interested"
  | "visited"
  | "callback"
  | "appointment"
  | "follow-up"
  | "not-interested"

export type TerritoryStatus = "draft" | "assigned" | "active" | "inactive"

export interface Territory {
  id: string
  name: string
  polygon: google.maps.LatLngLiteral[]
  description?: string
  status: TerritoryStatus
  assignedTo?: string
  assignedDate?: Date
  residents: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MapSettings {
  center: google.maps.LatLngLiteral
  zoom: number
  mapType: "roadmap" | "satellite" | "hybrid" | "terrain"
}
