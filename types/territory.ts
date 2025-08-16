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
  | "new"
  | "knocked"
  | "not-home"
  | "interested"
  | "callback"
  | "not-interested"
  | "do-not-knock"
  | "appointment"

export type TerritoryStatus = "draft" | "assigned"

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
