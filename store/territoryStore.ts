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

  setMapSettings: (settings: Partial<MapSettings>) => void
  setMapType: (mapType: "roadmap" | "satellite" | "hybrid" | "terrain") => void
  setDrawingMode: (isDrawing: boolean) => void
  setSelectedResidents: (residents: Resident[]) => void
  assignTerritoryToRep: (territoryId: string, repName: string, assignmentDate: Date) => void

  filterResidentsInTerritory: (territoryId: string) => Resident[]
}

export const useTerritoryStore = create<TerritoryState>((set, get) => ({
  territories: [],
  residents: [
    // Sample data
    // Downtown Dallas area
    {
      id: "1",
      name: "John Smith",
      address: "123 Main St, Dallas, TX",
      lat: 32.7767,
      lng: -96.797,
      status: "new",
      phone: "+1 555-0123",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      address: "456 Oak Ave, Dallas, TX",
      lat: 32.7867,
      lng: -96.787,
      status: "interested",
      phone: "+1 555-0124",
    },
    {
      id: "3",
      name: "Mike Wilson",
      address: "789 Pine St, Dallas, TX",
      lat: 32.7667,
      lng: -96.807,
      status: "not-home",
      phone: "+1 555-0125",
    },
    // North Dallas area
    {
      id: "4",
      name: "Emily Davis",
      address: "321 Elm St, Dallas, TX",
      lat: 32.8167,
      lng: -96.797,
      status: "callback",
      phone: "+1 555-0126",
    },
    {
      id: "5",
      name: "Robert Brown",
      address: "654 Cedar Ave, Dallas, TX",
      lat: 32.8267,
      lng: -96.787,
      status: "knocked",
      phone: "+1 555-0127",
    },
    // East Dallas area
    {
      id: "6",
      name: "Lisa Garcia",
      address: "987 Maple Dr, Dallas, TX",
      lat: 32.7767,
      lng: -96.757,
      status: "appointment",
      phone: "+1 555-0128",
    },
    {
      id: "7",
      name: "David Martinez",
      address: "147 Birch Ln, Dallas, TX",
      lat: 32.7867,
      lng: -96.747,
      status: "not-interested",
      phone: "+1 555-0129",
    },
    // West Dallas area
    {
      id: "8",
      name: "Jennifer Lee",
      address: "258 Walnut St, Dallas, TX",
      lat: 32.7767,
      lng: -96.837,
      status: "new",
      phone: "+1 555-0130",
    },
    {
      id: "9",
      name: "Christopher Taylor",
      address: "369 Hickory Ave, Dallas, TX",
      lat: 32.7667,
      lng: -96.847,
      status: "interested",
      phone: "+1 555-0131",
    },
    // South Dallas area
    {
      id: "10",
      name: "Amanda White",
      address: "741 Pecan St, Dallas, TX",
      lat: 32.7467,
      lng: -96.797,
      status: "do-not-knock",
      phone: "+1 555-0132",
    },
    {
      id: "11",
      name: "James Anderson",
      address: "852 Ash Dr, Dallas, TX",
      lat: 32.7367,
      lng: -96.787,
      status: "callback",
      phone: "+1 555-0133",
    },
    // Central Dallas area
    {
      id: "12",
      name: "Michelle Thompson",
      address: "963 Spruce Ln, Dallas, TX",
      lat: 32.7867,
      lng: -96.807,
      status: "knocked",
      phone: "+1 555-0134",
    },
    {
      id: "13",
      name: "Kevin Rodriguez",
      address: "159 Poplar Ave, Dallas, TX",
      lat: 32.7967,
      lng: -96.777,
      status: "not-home",
      phone: "+1 555-0135",
    },
    // Northeast Dallas area
    {
      id: "14",
      name: "Nicole Clark",
      address: "753 Willow St, Dallas, TX",
      lat: 32.8067,
      lng: -96.767,
      status: "appointment",
      phone: "+1 555-0136",
    },
    {
      id: "15",
      name: "Daniel Lewis",
      address: "864 Sycamore Dr, Dallas, TX",
      lat: 32.8167,
      lng: -96.757,
      status: "interested",
      phone: "+1 555-0137",
    },
    // Northwest Dallas area
    {
      id: "16",
      name: "Rachel Walker",
      address: "975 Magnolia Ave, Dallas, TX",
      lat: 32.8067,
      lng: -96.817,
      status: "new",
      phone: "+1 555-0138",
    },
    {
      id: "17",
      name: "Mark Hall",
      address: "186 Dogwood Ln, Dallas, TX",
      lat: 32.8167,
      lng: -96.827,
      status: "not-interested",
      phone: "+1 555-0139",
    },
    // Southeast Dallas area
    {
      id: "18",
      name: "Stephanie Young",
      address: "297 Redwood St, Dallas, TX",
      lat: 32.7467,
      lng: -96.767,
      status: "callback",
      phone: "+1 555-0140",
    },
    {
      id: "19",
      name: "Brian King",
      address: "408 Cypress Ave, Dallas, TX",
      lat: 32.7367,
      lng: -96.757,
      status: "knocked",
      phone: "+1 555-0141",
    },
    // Southwest Dallas area
    {
      id: "20",
      name: "Laura Wright",
      address: "519 Juniper Dr, Dallas, TX",
      lat: 32.7467,
      lng: -96.827,
      status: "do-not-knock",
      phone: "+1 555-0142",
    },
  ],
  selectedTerritory: null,
  mapSettings: {
    center: { lat: 32.7767, lng: -96.797 }, // Dallas, TX
    zoom: 13,
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
      selectedTerritory: null,
      isDrawingMode: false,
    }),

  addResident: (resident) =>
    set((state) => ({
      residents: [...state.residents, resident],
    })),

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
