import { create } from "zustand"
import type { Territory, Resident, ResidentStatus, MapSettings } from "@/types/territory"

interface TerritoryState {
  territories: Territory[]
  residents: Resident[]
  selectedTerritory: Territory | null
  mapSettings: MapSettings
  isDrawingMode: boolean
  selectedResidents: Resident[]

  // Actions
  addTerritory: (territory: Territory) => void
  updateTerritory: (id: string, updates: Partial<Territory>) => void
  deleteTerritory: (id: string) => void
  selectTerritory: (territory: Territory | null) => void
  clearAllTerritories: () => void

  addResident: (resident: Resident) => void
  updateResident: (id: string, updates: Partial<Resident>) => void
  updateResidentStatus: (id: string, status: ResidentStatus) => void
  clearAllResidents: () => void

  setMapSettings: (settings: Partial<MapSettings>) => void
  setMapType: (mapType: "roadmap" | "satellite" | "hybrid" | "terrain") => void
  setDrawingMode: (isDrawing: boolean) => void
  setSelectedResidents: (residents: Resident[]) => void
  assignTerritoryToRep: (territoryId: string, repName: string, assignmentDate: Date) => void

  filterResidentsInTerritory: (territoryId: string) => Resident[]
}

export const useTerritoryStore = create<TerritoryState>((set, get) => ({
  territories: [],
  residents: [], // Removed static data - now relies on Google Maps building detection
  selectedTerritory: null,
  mapSettings: {
    center: { lat: 43.6532, lng: -79.3832 }, // Toronto, Ontario, Canada
    zoom: 15,
    mapType: "hybrid",
  },
  isDrawingMode: false,
  selectedResidents: [],

  addTerritory: (territory) =>
    set((state) => ({
      territories: [...state.territories, territory],
    })),

  updateTerritory: (id, updates) =>
    set((state) => ({
      territories: state.territories.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTerritory: (id) =>
    set((state) => ({
      territories: state.territories.filter((t) => t.id !== id),
      selectedTerritory: state.selectedTerritory?.id === id ? null : state.selectedTerritory,
    })),

  selectTerritory: (territory) => set({ selectedTerritory: territory }),

  clearAllTerritories: () =>
    set({
      territories: [],
      residents: [],
      selectedTerritory: null,
      isDrawingMode: false,
    }),

  addResident: (resident) =>
    set((state) => {
      // Check if resident already exists to prevent duplicates
      const existingResident = state.residents.find(r => r.id === resident.id)
      if (existingResident) {
        return state // Return unchanged state if resident already exists
      }
      return {
        residents: [...state.residents, resident],
      }
    }),

  clearAllResidents: () =>
    set({
      residents: [],
    }),

  updateResident: (id, updates) =>
    set((state) => ({
      residents: state.residents.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  updateResidentStatus: (id, status) =>
    set((state) => ({
      residents: state.residents.map((r) => (r.id === id ? { ...r, status, lastVisited: new Date() } : r)),
    })),

  setMapSettings: (settings) =>
    set((state) => ({
      mapSettings: { ...state.mapSettings, ...settings },
    })),

  setMapType: (mapType: "roadmap" | "satellite" | "hybrid" | "terrain") =>
    set((state) => ({
      mapSettings: { ...state.mapSettings, mapType },
    })),

  setDrawingMode: (isDrawing) => set({ isDrawingMode: isDrawing }),

  setSelectedResidents: (residents) => set({ selectedResidents: residents }),

  assignTerritoryToRep: (territoryId, repName, assignmentDate) =>
    set((state) => ({
      territories: state.territories.map((t) =>
        t.id === territoryId ? { ...t, assignedTo: repName, assignedDate: assignmentDate, updatedAt: new Date() } : t,
      ),
    })),

  filterResidentsInTerritory: (territoryId) => {
    const state = get()
    const territory = state.territories.find((t) => t.id === territoryId)
    if (!territory || !window.google) return []

    return state.residents.filter((resident) => {
      const point = new window.google.maps.LatLng(resident.lat, resident.lng)
      const polygon = new window.google.maps.Polygon({
        paths: territory.polygon,
      })

      return window.google.maps.geometry.poly.containsLocation(point, polygon)
    })
  },
}))
