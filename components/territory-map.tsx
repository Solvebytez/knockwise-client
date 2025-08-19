"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GoogleMap, DrawingManager, Marker, Polygon, useJsApiLoader } from "@react-google-maps/api"
import { useTerritoryStore } from "@/store/territoryStore"
import type { Resident, ResidentStatus } from "@/types/territory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Grid3X3, Circle, Trash2, Calendar, Loader2, Users, User } from "lucide-react"
import { useTerritoryStore as useTerritoryStoreState } from "@/store/territoryStore"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"]

const statusColors: Record<ResidentStatus, string> = {
  "not-visited": "#6B7280", // Gray
  interested: "#10B981", // Green
  visited: "#3B82F6", // Blue
  callback: "#F59E0B", // Yellow
  appointment: "#8B5CF6", // Purple
  "follow-up": "#EF4444", // Red
  "not-interested": "#EC4899", // Pink
}

const statusLabels: Record<ResidentStatus, string> = {
  "not-visited": "Not Visited",
  interested: "Interested",
  visited: "Visited",
  callback: "Callback",
  appointment: "Appointment",
  "follow-up": "Follow-up",
  "not-interested": "Not Interested",
}

export function TerritoryMap() {
  const {
    territories,
    residents,
    mapSettings,
    isDrawingMode,
    selectedTerritory,
    setDrawingMode,
    addTerritory,
    selectTerritory,
    updateResidentStatus,
    setMapType,
    assignTerritoryToRep,
  } = useTerritoryStore()
  const { clearAllTerritories } = useTerritoryStoreState.getState()

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMarkingMode, setIsMarkingMode] = useState(false)
  const [isTiltView, setIsTiltView] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapViewType, setMapViewType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">(
    mapSettings.mapType as "roadmap" | "satellite" | "hybrid" | "terrain",
  )
  const [territorySearch, setTerritorySearch] = useState("")
  const [assignedRep, setAssignedRep] = useState("")
  const [assignedDate, setAssignedDate] = useState("")
  const [mapRef, setMapRef] = useState<any | null>(null)
  const drawingManagerRef = useRef<any | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [placesService, setPlacesService] = useState<any>(null)
  const [territorySearchSuggestions, setTerritorySearchSuggestions] = useState<any[]>([])
  const [showTerritorySuggestions, setShowTerritorySuggestions] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState<any>(null)
  const [residentsInCurrentPolygon, setResidentsInCurrentPolygon] = useState<string[]>([])
  const [workflowStep, setWorkflowStep] = useState<"drawing" | "saving" | "assigning">("drawing")
  const [pendingTerritory, setPendingTerritory] = useState<any>(null)
  const [territoryName, setTerritoryName] = useState("")
  const [territoryDescription, setTerritoryDescription] = useState("")
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [drawingManagerKey, setDrawingManagerKey] = useState(0)
  const [mapKey, setMapKey] = useState(0)
  const [forceRerender, setForceRerender] = useState(0)
  const [isDetectingResidents, setIsDetectingResidents] = useState(false)
  const [isSavingTerritory, setIsSavingTerritory] = useState(false)
  const [isAssigningTerritory, setIsAssigningTerritory] = useState(false)
  const [assignmentType, setAssignmentType] = useState<"team" | "individual">("team")
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("")
  const [assignmentSearchResults, setAssignmentSearchResults] = useState<any[]>([])
  const [isSearchingAssignment, setIsSearchingAssignment] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [territoriesLoaded, setTerritoriesLoaded] = useState(false)
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(false)
  const [showExistingTerritories, setShowExistingTerritories] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  useEffect(() => {
    if (loadError) {
      console.error("[v0] Google Maps load error:", loadError)
    }
    setIsMapLoaded(Boolean(isLoaded && !loadError))
  }, [isLoaded, loadError])



  // Ensure map view type is applied when map loads
  useEffect(() => {
    if (mapRef && isLoaded) {
      mapRef.setMapTypeId(mapViewType)
    }
  }, [mapRef, isLoaded, mapViewType])

  // Sync map view type with store on mount
  useEffect(() => {
    if (mapSettings.mapType !== mapViewType) {
      setMapViewType(mapSettings.mapType as "roadmap" | "satellite" | "hybrid" | "terrain")
    }
  }, [mapSettings.mapType])

  // Reset map to initial state when drawing mode changes
  useEffect(() => {
    if (mapRef && isLoaded) {
      if (isDrawingMode) {
        // Enable drawing mode
        mapRef.setOptions({
          draggableCursor: "crosshair",
          clickableIcons: false,
          disableDoubleClickZoom: true,
          gestureHandling: "none"
        })
      } else {
        // Aggressively reset to initial page load state
        mapRef.setOptions({
          draggableCursor: "grab",
          clickableIcons: true,
          disableDoubleClickZoom: false,
          gestureHandling: "auto"
        })

        // Force drawing manager to stop
        if (drawingManagerRef.current) {
          try {
            drawingManagerRef.current.setDrawingMode(null)
          } catch (error) {
            console.log("Drawing cleanup:", error)
          }
        }

        // Force map refresh to ensure state is reset
        const currentZoom = mapRef.getZoom()
        const currentCenter = mapRef.getCenter()
        mapRef.setZoom(currentZoom)
        mapRef.setCenter(currentCenter)
      }
    }
  }, [isDrawingMode, mapRef, isLoaded])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)

      if (value.length > 2 && placesService && window.google) {
        const request = {
          input: value,
          componentRestrictions: { country: "us" },
        }

        const autocompleteService = new window.google.maps.places.AutocompleteService()
        autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
          } else {
            setSearchSuggestions([])
            setShowSuggestions(false)
          }
        })
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    },
    [placesService],
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      setSearchQuery(suggestion.description)
      setShowSuggestions(false)

      if (placesService && window.google) {
        const request = {
          placeId: suggestion.place_id,
          fields: ["geometry", "name", "formatted_address"],
        }

        placesService.getDetails(request, (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const location = place.geometry.location
            mapRef?.panTo(location)
            mapRef?.setZoom(17)
          }
        })
      }
    },
    [placesService, mapRef],
  )

  const handleTerritorySearchChange = useCallback(
    (value: string) => {
      setTerritorySearch(value)

      if (value.length > 2 && placesService && window.google) {
        const request = {
          input: value,
          componentRestrictions: { country: "us" },
        }

        const autocompleteService = new window.google.maps.places.AutocompleteService()
        autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setTerritorySearchSuggestions(predictions.slice(0, 5))
            setShowTerritorySuggestions(true)
          } else {
            setTerritorySearchSuggestions([])
            setShowTerritorySuggestions(false)
          }
        })
      } else {
        setTerritorySearchSuggestions([])
        setShowTerritorySuggestions(false)
      }
    },
    [placesService],
  )

  const handleTerritorySuggestionSelect = useCallback(
    (suggestion: any) => {
      setTerritorySearch(suggestion.description)
      setShowTerritorySuggestions(false)

      if (placesService && window.google) {
        const request = {
          placeId: suggestion.place_id,
          fields: ["geometry", "name", "formatted_address"],
        }

        placesService.getDetails(request, (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const location = place.geometry.location
            mapRef?.panTo(location)
            mapRef?.setZoom(17)
          }
        })
      }
    },
    [placesService, mapRef],
  )

  const forceMapRerender = useCallback(() => {
    console.log("Force map re-render triggered")
    setMapKey(prev => prev + 1)
    setDrawingManagerKey(prev => prev + 1)
    setForceRerender(prev => prev + 1)
    setMapRef(null)
    setDrawingMode(false)
    // Reset only drawing-related state, preserve territories
    setPendingTerritory(null)
    setCurrentPolygon(null)
    setResidentsInCurrentPolygon([])
    setWorkflowStep("drawing")
    // Force a complete component re-render
    setTimeout(() => {
      console.log("Map re-render completed")
    }, 50)
  }, [])

  const fitToTerritories = useCallback(() => {
    if (!mapRef || territories.length === 0) {
      toast.error("No territories to fit to")
      return
    }

    try {
      const bounds = new window.google.maps.LatLngBounds()
      
      territories.forEach(territory => {
        territory.polygon.forEach((coord: any) => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng))
        })
      })

      // Add some padding to the bounds
      mapRef.fitBounds(bounds)
      
      // Set a minimum zoom level to prevent too much zoom out
      const listener = mapRef.addListener('bounds_changed', () => {
        if (mapRef.getZoom() < 12) {
          mapRef.setZoom(12)
        }
        window.google.maps.event.removeListener(listener)
      })

      toast.success(`Fitted map to show ${territories.length} territory(ies)`)
    } catch (error) {
      console.error('Error fitting to territories:', error)
      toast.error('Failed to fit to territories')
    }
  }, [mapRef, territories])

  const resetMapView = useCallback(() => {
    if (!mapRef) return

    try {
      // Reset to default center and zoom
      mapRef.setCenter(mapSettings.center)
      mapRef.setZoom(mapSettings.zoom)
      toast.success("Map view reset to default")
    } catch (error) {
      console.error('Error resetting map view:', error)
      toast.error('Failed to reset map view')
    }
  }, [mapRef, mapSettings.center, mapSettings.zoom])

  const detectResidentsInPolygon = useCallback(
    (polygon: any) => {
      if (!polygon || !window.google?.maps?.geometry?.poly) {
        setResidentsInCurrentPolygon([])
        return
      }

      const residentsInside = residents.filter((resident) => {
        const point = new window.google.maps.LatLng(resident.lat, resident.lng)
        return window.google.maps.geometry.poly.containsLocation(point, polygon)
      })

      setResidentsInCurrentPolygon(residentsInside.map((r) => r.id))

      // Show real-time feedback
      console.log(`Real-time detection: ${residentsInside.length} residents in current polygon`)
    },
    [residents],
  )

  const detectBuildingsInPolygon = useCallback(async (polygon: any) => {
    if (!polygon || !window.google?.maps?.geometry?.poly) {
      return []
    }

    const path = polygon.getPath().getArray()
    const bounds = new window.google.maps.LatLngBounds()
    path.forEach((latLng: any) => bounds.extend(latLng))

    // Calculate polygon area
    const area = window.google.maps.geometry.spherical.computeArea(path)
    console.log(`Polygon area: ${area} square meters`)

    // Estimate buildings based on area (rough calculation)
    const estimatedBuildings = Math.max(1, Math.floor(area / 500)) // Assume ~500 sq meters per building
    console.log(`Estimated buildings: ${estimatedBuildings}`)

    // Generate realistic building numbers (even/odd pattern)
    const buildingNumbers = []
    const startNumber = Math.floor(Math.random() * 100) + 100 // Start between 100-199
    for (let i = 0; i < estimatedBuildings; i++) {
      // Alternate between even and odd numbers
      const number = startNumber + (i * 2) + (i % 2)
      buildingNumbers.push(number)
    }

    // Generate sample addresses within the polygon
    const detectedResidents = []
    const geocoder = new window.google.maps.Geocoder()

    for (let i = 0; i < estimatedBuildings; i++) {
      // Generate random point within polygon bounds
      const randomLat = bounds.getSouthWest().lat() + Math.random() * (bounds.getNorthEast().lat() - bounds.getSouthWest().lat())
      const randomLng = bounds.getSouthWest().lng() + Math.random() * (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())
      
      const randomPoint = new window.google.maps.LatLng(randomLat, randomLng)
      
      // Check if point is inside polygon
      if (window.google.maps.geometry.poly.containsLocation(randomPoint, polygon)) {
        try {
          // Reverse geocode to get address
          const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: randomPoint }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0])
              } else {
                reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          })

          const geocodedAddress = (result as any).formatted_address
          const buildingNumber = buildingNumbers[i]
          
          // Create a realistic address with building number
          let address = geocodedAddress
          if (geocodedAddress && !geocodedAddress.match(/^\d+/)) {
            // If the geocoded address doesn't start with a number, add our building number
            const addressParts = geocodedAddress.split(',')
            if (addressParts.length > 0) {
              // Insert building number at the beginning
              addressParts[0] = `${buildingNumber} ${addressParts[0].trim()}`
              address = addressParts.join(', ')
            }
          } else if (geocodedAddress) {
            // Replace existing number with our building number
            address = geocodedAddress.replace(/^\d+/, buildingNumber.toString())
          }

          const resident = {
            id: `resident-${Date.now()}-${i}`,
            name: `Resident ${i + 1}`,
            address: address,
            buildingNumber: buildingNumber,
            lat: randomLat,
            lng: randomLng,
            status: 'not-visited' as const,
            phone: '',
            email: '',
            lastVisited: null,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          detectedResidents.push(resident)
          console.log(`Detected resident: ${resident.name} at ${resident.address} (Building #${buildingNumber})`)
        } catch (error) {
          console.log(`Geocoding error for point ${i}:`, error)
          // Add resident with coordinates and building number if geocoding fails
          const buildingNumber = buildingNumbers[i]
          const resident = {
            id: `resident-${Date.now()}-${i}`,
            name: `Resident ${i + 1}`,
            address: `${buildingNumber} Building, ${randomLat.toFixed(6)}, ${randomLng.toFixed(6)}`,
            buildingNumber: buildingNumber,
            lat: randomLat,
            lng: randomLng,
            status: 'not-visited' as const,
            phone: '',
            email: '',
            lastVisited: null,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          detectedResidents.push(resident)
        }
      }
    }

    return detectedResidents
  }, [])

  // Save territory to backend
  const saveTerritoryToBackend = useCallback(async (territoryData: any) => {
    try {
      console.log('Sending territory data to backend:', territoryData)
      
      // Ensure polygon is closed (first and last coordinates must be identical for GeoJSON)
      const polygonCoords = territoryData.polygon.map((coord: any) => [coord.lng, coord.lat]);
      
      // Close the polygon if it's not already closed
      if (polygonCoords.length > 0) {
        const firstCoord = polygonCoords[0];
        const lastCoord = polygonCoords[polygonCoords.length - 1];
        
        if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
          polygonCoords.push([...firstCoord]); // Add first coordinate at the end
        }
      }

      // Send territory data with proper GeoJSON format
      const response = await apiInstance.post('/zones/create-zone', {
        name: territoryData.name,
        description: territoryData.description,
        boundary: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        },
        buildingData: {
          addresses: territoryData.buildingData.addresses,
          coordinates: territoryData.buildingData.coordinates
        }
      })

      if (response.data.success) {
        console.log('Territory saved successfully:', response.data.data)
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to save territory')
      }
    } catch (error) {
      console.error('Error saving territory:', error)
      
      // Enhanced error logging for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Backend response data:', axiosError.response?.data)
        console.error('Backend response status:', axiosError.response?.status)
        
        // If backend provides specific error message, use it
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message)
        }
      }
      
      throw error
    }
  }, [])

  // Load territories from backend
  const loadTerritoriesFromBackend = useCallback(async () => {
    try {
      const response = await apiInstance.get('/zones/list-all?showAll=true')
      if (response.data.success) {
        console.log('Territories loaded from backend:', response.data.data)
        console.log('Total territories found:', response.data.data.length)
        
        // Load resident data for each territory
        const territoriesWithResidents = await Promise.all(
          response.data.data.map(async (zone: any) => {
            try {
              const residentsResponse = await apiInstance.get(`/zones/${zone._id}/residents`)
              if (residentsResponse.data.success) {
                return {
                  ...zone,
                  residents: residentsResponse.data.data.residents || []
                }
              }
            } catch (error) {
              console.error(`Error loading residents for zone ${zone._id}:`, error)
            }
            return {
              ...zone,
              residents: []
            }
          })
        )
        
        return territoriesWithResidents
      } else {
        throw new Error(response.data.message || 'Failed to load territories')
      }
    } catch (error) {
      console.error('Error loading territories:', error)
      throw error
    }
  }, [])

  const searchAssignment = useCallback(async (query: string, type: "team" | "individual") => {
    if (!query.trim()) {
      setAssignmentSearchResults([])
      return
    }

    console.log(`Searching for ${type} with query: "${query}"`)
    setIsSearchingAssignment(true)
    try {
      if (type === "team") {
        const response = await apiInstance.get(`/teams?search=${encodeURIComponent(query)}`)
        console.log('Team search response:', response.data)
        if (response.data.success) {
          setAssignmentSearchResults(response.data.data || [])
        } else {
          setAssignmentSearchResults([])
        }
      } else {
        const response = await apiInstance.get(`/users/list-all?role=AGENT&search=${encodeURIComponent(query)}`)
        console.log('User search response:', response.data)
        if (response.data.success) {
          setAssignmentSearchResults(response.data.data || [])
        } else {
          setAssignmentSearchResults([])
        }
      }
    } catch (error) {
      console.error('Error searching for assignment:', error)
      
      // Enhanced error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Search response data:', axiosError.response?.data)
        console.error('Search response status:', axiosError.response?.status)
      }
      
      setAssignmentSearchResults([])
    } finally {
      setIsSearchingAssignment(false)
    }
  }, [])

  // Check if drawn polygon overlaps with existing territories
  const checkTerritoryOverlap = useCallback((newPolygon: any) => {
    if (!window.google || !window.google.maps.geometry) {
      console.warn('Google Maps Geometry library not loaded')
      return false
    }

    return territories.some(territory => {
      try {
        // Create Google Maps polygon for existing territory
        const existingPolygon = new window.google.maps.Polygon({
          paths: territory.polygon.map((coord: any) => ({
            lat: coord.lat,
            lng: coord.lng
          }))
        })

        // Check if any point from new polygon is inside existing polygon
        const newPolygonPath = newPolygon.getPath()
        for (let i = 0; i < newPolygonPath.getLength(); i++) {
          const point = newPolygonPath.getAt(i)
          if (window.google.maps.geometry.poly.containsLocation(point, existingPolygon)) {
            return true
          }
        }

        // Check if any point from existing polygon is inside new polygon
        const existingPolygonPath = existingPolygon.getPath()
        for (let i = 0; i < existingPolygonPath.getLength(); i++) {
          const point = existingPolygonPath.getAt(i)
          if (window.google.maps.geometry.poly.containsLocation(point, newPolygon)) {
            return true
          }
        }

        return false
      } catch (error) {
        console.error('Error checking polygon intersection:', error)
        return false
      }
    })
  }, [territories])

  // Check for duplicate buildings in existing territories
  const checkDuplicateBuildings = useCallback((newBuildings: any[]) => {
    const existingBuildingAddresses = territories.flatMap(territory => 
      territory.residents.map((residentId: string) => {
        const resident = residents.find(r => r.id === residentId)
        return resident?.address || ''
      }).filter(Boolean)
    )

    return newBuildings.filter(building => 
      existingBuildingAddresses.includes(building.address)
    )
  }, [territories, residents])

  // Check overlap with backend
  const checkBackendOverlap = useCallback(async (polygon: any, detectedBuildings: any[]) => {
    try {
      const polygonCoords = polygon.getPath().getArray().map((latLng: any) => [latLng.lng(), latLng.lat()])
      
      // Ensure polygon is closed
      if (polygonCoords.length > 0) {
        const firstCoord = polygonCoords[0]
        const lastCoord = polygonCoords[polygonCoords.length - 1]
        if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
          polygonCoords.push([...firstCoord])
        }
      }

      const response = await apiInstance.post('/zones/check-overlap', {
        boundary: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        },
        buildingData: {
          addresses: detectedBuildings.map((building: any) => building.address)
        }
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to check overlap')
      }
    } catch (error) {
      console.error('Error checking backend overlap:', error)
      // Fallback to frontend validation
      return null
    }
  }, [])

  // Validate territory before saving
  const validateTerritory = useCallback(async (polygon: any, detectedBuildings: any[]) => {
    const errors: string[] = []
    const warnings: string[] = []

    // First try backend validation
    const backendValidation = await checkBackendOverlap(polygon, detectedBuildings)
    
    if (backendValidation) {
      if (backendValidation.hasOverlap) {
        const zoneNames = backendValidation.overlappingZones.map((zone: any) => zone.name).join(', ')
        errors.push(`This area overlaps with existing territory(ies): ${zoneNames}`)
      }
      
      if (backendValidation.duplicateBuildings && backendValidation.duplicateBuildings.length > 0) {
        warnings.push(`${backendValidation.duplicateBuildings.length} buildings are already assigned to other territories`)
      }
      
      return { 
        errors, 
        warnings, 
        duplicateBuildings: backendValidation.duplicateBuildings || [],
        backendValidation 
      }
    }

    // Fallback to frontend validation
    if (checkTerritoryOverlap(polygon)) {
      errors.push("This area overlaps with an existing territory")
    }

    const duplicateBuildings = checkDuplicateBuildings(detectedBuildings)
    if (duplicateBuildings.length > 0) {
      warnings.push(`${duplicateBuildings.length} buildings are already in other territories`)
    }

    return { errors, warnings, duplicateBuildings }
  }, [checkTerritoryOverlap, checkDuplicateBuildings, checkBackendOverlap])

  const onPolygonComplete = useCallback(
    async (polygon: any) => {
      const path = polygon
        .getPath()
        .getArray()
        .map((latLng: any) => ({
          lat: latLng.lat(),
          lng: latLng.lng(),
        }))

      // Create a proper Google Maps polygon for containment checking
      const tempPolygon = new window.google.maps.Polygon({
        paths: path,
      })

      // Validate territory before proceeding
      const validation = await validateTerritory(tempPolygon, [])
      
      if (validation.errors.length > 0) {
        // Show error and remove polygon
        toast.error(validation.errors.join(", "))
        polygon.setMap(null)
        setDrawingMode(false)
        
        // Reset map state
        if (mapRef) {
          mapRef.setOptions({
            draggableCursor: "grab",
            clickableIcons: true,
            disableDoubleClickZoom: false,
            gestureHandling: "auto"
          })
        }
        return
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast.warning(validation.warnings.join(", "))
      }

      // Show loading state
      setIsDetectingResidents(true)
      console.log("Detecting buildings in polygon...")

      try {
        const detectedResidents = await detectBuildingsInPolygon(tempPolygon)
        console.log(`Detected ${detectedResidents.length} residential buildings`)

        // Validate again with detected buildings
        const finalValidation = await validateTerritory(tempPolygon, detectedResidents)
        
        if (finalValidation.errors.length > 0) {
          toast.error(finalValidation.errors.join(", "))
          polygon.setMap(null)
          setDrawingMode(false)
          return
        }

        if (finalValidation.warnings.length > 0) {
          toast.warning(finalValidation.warnings.join(", "))
        }

        const territoryData = {
          polygon: path,
          residents: detectedResidents.map((r) => r.id),
          residentsData: detectedResidents,
        }

        setPendingTerritory(territoryData)
        setDrawingMode(false)
        setWorkflowStep("saving")
        polygon.setMap(null)

        setCurrentPolygon(null)
        setResidentsInCurrentPolygon([])

        // Aggressively reset map to initial state
        if (mapRef) {
          mapRef.setOptions({
            draggableCursor: "grab",
            clickableIcons: true,
            disableDoubleClickZoom: false,
            gestureHandling: "auto"
          })
        }

        // Force drawing manager to stop
        if (drawingManagerRef.current) {
          try {
            drawingManagerRef.current.setDrawingMode(null)
          } catch (error) {
            console.log("Drawing cleanup:", error)
          }
        }

        // Enhanced logging
        console.log(`Territory drawn with ${detectedResidents.length} residents inside:`)
        detectedResidents.forEach((r) => console.log(`- ${r.name} at ${r.address}`))
      } catch (error) {
        console.error("Error detecting residents:", error)
        // Handle error - show some default residents
        const defaultResidents = [{
          id: `resident-${Date.now()}`,
          name: "Resident 1",
          address: "100 Address detection failed",
          buildingNumber: 100,
          lat: path[0].lat,
          lng: path[0].lng,
          status: 'not-visited' as const,
          phone: '',
          email: '',
          lastVisited: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }]

        const territoryData = {
          polygon: path,
          residents: defaultResidents.map((r) => r.id),
          residentsData: defaultResidents,
        }

        setPendingTerritory(territoryData)
        setDrawingMode(false)
        setWorkflowStep("saving")
        polygon.setMap(null)
      } finally {
        setIsDetectingResidents(false)
      }
    },
    [detectBuildingsInPolygon, setDrawingMode, validateTerritory, mapRef],
  )

  const handleSaveTerritory = async () => {
    if (!pendingTerritory || !territoryName.trim()) {
      toast.error("Please enter a territory name")
      return
    }

    // Validate description length
    if (territoryDescription.trim().length > 500) {
      toast.error("Description must be less than 500 characters")
      return
    }

    // Set loading state
    setIsSavingTerritory(true)

    try {
      // Prepare building data for backend
      const buildingData = {
        addresses: pendingTerritory.residentsData.map((resident: any) => resident.address),
        coordinates: pendingTerritory.residentsData.map((resident: any) => [resident.lng, resident.lat])
      }

      // Save to backend
      const savedTerritory = await saveTerritoryToBackend({
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        polygon: pendingTerritory.polygon,
        buildingData
      })

      // Add to local store
      const newTerritory = {
        id: savedTerritory._id || Date.now().toString(),
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        polygon: pendingTerritory.polygon,
        residents: pendingTerritory.residents,
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addTerritory(newTerritory)
      selectTerritory(newTerritory)

      // Reset territory save form
      setTerritoryName("")
      setTerritoryDescription("")
      setPendingTerritory(null)
      setWorkflowStep("assigning")

      // Show success message with house number stats
      const houseNumberStats = savedTerritory.houseNumberStats
      let statsMessage = `Residents: ${newTerritory.residents.length}`
      
      if (houseNumberStats) {
        statsMessage += ` • House Numbers: ${houseNumberStats.total} total (Odd: ${houseNumberStats.oddCount}, Even: ${houseNumberStats.evenCount})`
      }

      toast.success(`"${newTerritory.name}" has been saved as draft. ${statsMessage}`)

      console.log("Territory saved to backend:", savedTerritory)
    } catch (error) {
      console.error("Error saving territory:", error)
      
      // Enhanced error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error("Response data:", axiosError.response?.data)
        console.error("Response status:", axiosError.response?.status)
        
        // Show specific validation errors if available
        if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
          const errorMessages = axiosError.response.data.errors.map((err: any) => err.msg).join(', ')
          toast.error(`Validation error: ${errorMessages}`)
          return
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      // Clear loading state
      setIsSavingTerritory(false)
    }
  }

  const handleCancelSave = () => {
    setPendingTerritory(null)
    setTerritoryName("")
    setTerritoryDescription("")
    setWorkflowStep("drawing")
  }

  const handleAssignTerritory = async () => {
    if (selectedTerritory && selectedAssignment && assignedDate) {
      setIsAssigningTerritory(true)
      try {
        console.log('Assigning territory:', {
          territory: selectedTerritory.name,
          assignment: selectedAssignment.name,
          type: assignmentType,
          date: assignedDate
        });

        // Prepare assignment data
        const assignmentData = {
          zoneId: selectedTerritory.id,
          effectiveFrom: new Date(assignedDate).toISOString(),
          status: 'ACTIVE' as const,
          ...(assignmentType === "team" 
            ? { teamId: selectedAssignment._id }
            : { agentId: selectedAssignment._id }
          )
        };

        console.log('Assignment data:', assignmentData);

        // Create assignment using the assignment endpoint
        const assignmentResponse = await apiInstance.post('/assignments/create', assignmentData);

        if (assignmentResponse.data) {
          const isScheduled = assignmentResponse.data.scheduled;
          const assignedToName = selectedAssignment.name;
          
          if (isScheduled) {
            // Scheduled assignment
            toast.success(`"${selectedTerritory.name}" has been scheduled for assignment to ${assignedToName} on ${new Date(assignedDate).toLocaleDateString()}`);
          } else {
            // Immediate assignment
            assignTerritoryToRep(selectedTerritory.id, assignedToName, new Date(assignedDate));
            toast.success(`"${selectedTerritory.name}" has been assigned to ${assignedToName} (${assignmentType})`);
          }

          // Reset form and workflow
          setSelectedAssignment(null);
          setAssignmentSearchQuery("");
          setAssignmentSearchResults([]);
          setAssignedDate("");
          selectTerritory(null);
          setWorkflowStep("drawing");
        } else {
          throw new Error('Failed to assign territory');
        }
      } catch (error) {
        console.error('Error assigning territory:', error);
        
        // Enhanced error logging
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error('Assignment response data:', axiosError.response?.data);
          console.error('Assignment response status:', axiosError.response?.status);
        }
        
        toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsAssigningTerritory(false)
      }
    } else {
      const missingFields = [];
      if (!selectedTerritory) missingFields.push("No territory selected");
      if (!selectedAssignment) missingFields.push(`${assignmentType === "team" ? "Team" : "Agent"} selection required`);
      if (!assignedDate) missingFields.push("Assignment date required");

      toast.error(`Cannot assign territory: ${missingFields.join(", ")}`);
    }
  }

  const handleResidentClick = (resident: Resident) => {
    if (isMarkingMode) {
      const currentIndex = Object.keys(statusColors).indexOf(resident.status)
      const nextIndex = (currentIndex + 1) % Object.keys(statusColors).length
      const nextStatus = Object.keys(statusColors)[nextIndex] as ResidentStatus
      updateResidentStatus(resident.id, nextStatus)
    } else {
      setSelectedResident(resident)
    }
  }

  const handleClearAreas = useCallback(() => {
    // Only clear current drawing and workflow state, preserve existing territories
    setTerritorySearch("")
    setPendingTerritory(null)
    setWorkflowStep("drawing")
    setTerritoryName("")
    setTerritoryDescription("")
    setSelectedAssignment(null)
    setAssignmentSearchQuery("")
    setAssignmentSearchResults([])
    setAssignedDate("")
    setSelectedResident(null)
    setResidentsInCurrentPolygon([])
    setCurrentPolygon(null)
    setIsMarkingMode(false)
    setDrawingMode(false)
    // Force complete map re-render to reset drawing state
    forceMapRerender()
  }, [forceMapRerender])

  const handleClearAllTerritories = useCallback(() => {
    // This function clears ALL territories and residents - use with caution
    clearAllTerritories()
    setTerritoriesLoaded(false) // Allow re-loading from backend
    setTerritorySearch("")
    setPendingTerritory(null)
    setWorkflowStep("drawing")
    setTerritoryName("")
    setTerritoryDescription("")
    setSelectedAssignment(null)
    setAssignmentSearchQuery("")
    setAssignmentSearchResults([])
    setAssignedDate("")
    setSelectedResident(null)
    setResidentsInCurrentPolygon([])
    setCurrentPolygon(null)
    setIsMarkingMode(false)
    setDrawingMode(false)
    // Force complete map re-render to reset drawing state
    forceMapRerender()
  }, [forceMapRerender])

  // Load territories from backend on component mount
  useEffect(() => {
    if (territoriesLoaded || isLoadingTerritories) return // Prevent multiple loads
    
    const loadTerritories = async () => {
      setIsLoadingTerritories(true)
      try {
        const territoriesData = await loadTerritoriesFromBackend()
        
        // First, collect all unique residents across all territories
        const allResidents = new Map<string, any>()
        
        territoriesData.forEach((zone: any) => {
          if (zone.residents && zone.residents.length > 0) {
            zone.residents.forEach((resident: any) => {
              if (!allResidents.has(resident._id)) {
                allResidents.set(resident._id, resident)
              }
            })
          }
        })
        
        // Clear existing residents and territories first to prevent duplicates
        useTerritoryStore.getState().clearAllResidents()
        useTerritoryStore.getState().clearAllTerritories()
        
        // Add all unique residents to the store
        allResidents.forEach((resident: any) => {
          const residentData = {
            id: resident._id,
            name: `Resident at ${resident.address}`,
            address: resident.address,
            lat: resident.coordinates[1], // [lng, lat] format
            lng: resident.coordinates[0],
            status: resident.status,
            phone: resident.phone || '',
            email: resident.email || '',
            lastVisited: resident.lastVisited ? new Date(resident.lastVisited) : undefined,
            notes: resident.notes || '',
            createdAt: new Date(resident.createdAt),
            updatedAt: new Date(resident.updatedAt),
          }
          // Add to residents store
          useTerritoryStore.getState().addResident(residentData)
        })
        
        console.log('Total unique residents found:', allResidents.size)
        
        // Convert backend data to frontend format
        console.log('Processing territories data:', territoriesData.length, 'zones')
        territoriesData.forEach((zone: any) => {
          // Get resident IDs for this territory
          const residentIds: string[] = []
          if (zone.residents && zone.residents.length > 0) {
            zone.residents.forEach((resident: any) => {
              residentIds.push(resident._id)
            })
          }

          const territory = {
            id: zone._id,
            name: zone.name,
            description: zone.description,
            polygon: zone.boundary.coordinates[0].map((coord: [number, number]) => ({
              lat: coord[1],
              lng: coord[0]
            })),
            residents: residentIds, // Use actual resident IDs
            status: zone.status || "draft" as const,
            createdAt: new Date(zone.createdAt),
            updatedAt: new Date(zone.updatedAt),
          }
          console.log('Adding territory:', territory.id, territory.name)
          addTerritory(territory)
        })
        setTerritoriesLoaded(true)
      } catch (error) {
        console.error('Failed to load territories:', error)
        toast.error('Failed to load existing territories')
      } finally {
        setIsLoadingTerritories(false)
      }
    }

    loadTerritories()
  }, [territoriesLoaded, loadTerritoriesFromBackend, addTerritory])

  const handleTiltView = () => {
    if (mapRef) {
      const newTiltState = !isTiltView
      setIsTiltView(newTiltState)

      if (newTiltState) {
        mapRef.setMapTypeId(mapViewType)
        mapRef.setTilt(45)
      } else {
        mapRef.setMapTypeId(mapViewType)
        mapRef.setTilt(0)
      }
    }
  }

  const handleMapViewChange = (viewType: "roadmap" | "satellite" | "hybrid" | "terrain") => {
    setMapViewType(viewType)
    setMapType(viewType) // Update store
    if (mapRef) {
      mapRef.setMapTypeId(viewType)
    }
  }

  const filteredResidents = residents
    .filter(
      (resident) =>
        resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    // Ensure no duplicate residents by ID
    .filter((resident, index, self) => 
      index === self.findIndex(r => r.id === resident.id)
    )

  const createMarkerIcon = (status: ResidentStatus, residentId: string) => {
    if (!isMapLoaded || !window.google) {
      return undefined
    }

    // Check if resident is in any territory
    const isInTerritory = territories.some((territory) => territory.residents.includes(residentId))

    const isInCurrentPolygon = residentsInCurrentPolygon.includes(residentId)

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: isInTerritory ? 10 : isInCurrentPolygon ? 12 : 8, // Largest for current polygon
      fillColor: statusColors[status],
      fillOpacity: 1,
      strokeColor: isInCurrentPolygon ? "#FF0000" : isInTerritory ? "#FFD700" : "#ffffff", // Red for current polygon
      strokeWeight: isInCurrentPolygon ? 4 : isInTerritory ? 3 : 2, // Thickest for current polygon
    }
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Map Loading Error</h3>
          <p className="text-gray-600 mb-4">Please check that your Google Maps API key is properly configured.</p>
          <p className="text-sm text-gray-500">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full mt-4">
      <div className="flex-1 relative">
        <GoogleMap
          key={`map-${mapKey}-${forceRerender}`}
          center={mapSettings.center}
          zoom={mapSettings.zoom}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          mapTypeId={mapViewType}
          tilt={isTiltView ? 45 : 0}
          onLoad={(map) => {
            setMapRef(map)
            if (window.google) {
              setPlacesService(new window.google.maps.places.PlacesService(map))
            }
          }}
          options={{
            mapTypeControl: true,
            mapTypeControlOptions: {
              position: window.google?.maps?.ControlPosition?.TOP_LEFT,
            },
            zoomControl: true,
            zoomControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
            },
            streetViewControl: true,
            streetViewControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
            },
            fullscreenControl: true,
            fullscreenControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_TOP,
            },
            draggableCursor: isDrawingMode ? "crosshair" : "grab",
            draggable: !isDetectingResidents,
            scrollwheel: !isDetectingResidents,
            disableDoubleClickZoom: isDetectingResidents,
            clickableIcons: !isDetectingResidents,
            gestureHandling: "cooperative",
            minZoom: 10,
            maxZoom: 20,
          }}
        >
          {isDrawingMode && (
            <DrawingManager
              key={`drawing-${drawingManagerKey}`}
              ref={drawingManagerRef}
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: false,
                drawingMode: window.google?.maps?.drawing?.OverlayType?.POLYGON,
                polygonOptions: {
                  fillColor: "#42A5F5",
                  fillOpacity: 0.2,
                  strokeColor: "#42A5F5",
                  strokeWeight: 2,
                  editable: true,
                },
              }}
            />
          )}

          {territories.map((territory) => (
            <Polygon
              key={territory.id}
              path={territory.polygon}
              options={{
                fillColor: selectedTerritory?.id === territory.id ? "#42A5F5" : 
                          showExistingTerritories ? "#FF6B35" : "#10B981",
                fillOpacity: showExistingTerritories ? 0.3 : 0.2,
                strokeColor: selectedTerritory?.id === territory.id ? "#42A5F5" : 
                           showExistingTerritories ? "#FF6B35" : "#10B981",
                strokeWeight: showExistingTerritories ? 3 : 2,
                strokeOpacity: showExistingTerritories ? 1 : 0.8,
              }}
              onClick={() => selectTerritory(territory)}
            />
          ))}

          {/* Show the just-drawn polygon during the Save step */}
          {workflowStep === "saving" && pendingTerritory?.polygon && (
            <Polygon
              path={pendingTerritory.polygon}
              options={{
                fillColor: "#42A5F5",
                fillOpacity: 0.2,
                strokeColor: "#42A5F5",
                strokeWeight: 2,
                strokeOpacity: 0.8,
              }}
            />
          )}

          {filteredResidents.map((resident) => (
            <Marker
              key={resident.id}
              position={{ lat: resident.lat, lng: resident.lng }}
              icon={createMarkerIcon(resident.status, resident.id)}
              onClick={() => handleResidentClick(resident)}
              title={`${resident.name} - ${resident.address} ${
                residentsInCurrentPolygon.includes(resident.id)
                  ? "(In Current Drawing)"
                  : territories.some((t) => t.residents.includes(resident.id))
                    ? "(In Territory)"
                    : ""
              }`}
            />
          ))}
        </GoogleMap>

        <div className="absolute top-16 left-4 z-10">
          {showSearch ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-64">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  placeholder="Search addresses or names..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                    setShowSuggestions(false)
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="mt-2 border-t border-gray-200 pt-2 relative z-30">
                  <div className="max-h-48 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        className="px-2 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="font-medium text-gray-900">
                          {suggestion.structured_formatting?.main_text || suggestion.description}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {suggestion.structured_formatting?.secondary_text || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-600 hover:bg-gray-100"
                onClick={() => setShowSearch(true)}
                title="Search residents"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>

        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <div className="flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
            <Button
              variant={mapViewType === "roadmap" ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                mapViewType === "roadmap"
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMapViewChange("roadmap")}
              title="Street View"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </Button>
            <Button
              variant={mapViewType === "hybrid" ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                mapViewType === "hybrid"
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMapViewChange("hybrid")}
              title="Hybrid View (Recommended for Territory Drawing)"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </Button>
            <Button
              variant={mapViewType === "satellite" ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                mapViewType === "satellite"
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMapViewChange("satellite")}
              title="Satellite View"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </Button>
            <Button
              variant={isMarkingMode ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                isMarkingMode ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMarkingMode(!isMarkingMode)}
              title="Quick Mark Mode"
            >
              <Circle className="h-5 w-5 fill-current" />
            </Button>

            <Button
              variant={isTiltView ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                isTiltView ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={handleTiltView}
              title="Tilt View"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>

            {isLoadingTerritories ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 cursor-not-allowed"
                disabled
                title="Loading territories..."
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            ) : territories.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-600 hover:bg-gray-100"
                onClick={fitToTerritories}
                title="Fit to All Territories"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-gray-600 hover:bg-gray-100"
              onClick={resetMapView}
              title="Reset Map View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-20 left-4 z-10 flex flex-col gap-2">
          <Button
            onClick={() => {
              if (isDrawingMode) {
                // Force complete map re-render to reset drawing state
                forceMapRerender()
                setDrawingMode(false)
              } else {
                // Increment key to force fresh drawing manager
                setDrawingManagerKey(prev => prev + 1)
                setDrawingMode(true)
              }
            }}
            disabled={isDetectingResidents}
            variant="default"
            className={`${
              isDetectingResidents
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : isDrawingMode
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-black"
            } shadow-lg ${isDetectingResidents ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isDetectingResidents ? "Processing..." : isDrawingMode ? "Stop Drawing" : "Draw Area"}
          </Button>



            {(territories.length > 0 || !!pendingTerritory || isDrawingMode || currentPolygon) && (
              <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    className={`bg-white border border-red-300 text-red-700 shadow-lg hover:bg-red-50 ${isDetectingResidents ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isDetectingResidents}
                  >
                    Clear Areas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear current drawing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the current drawing and reset the workflow. Existing territories will be preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAreas}>Clear Drawing</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

        {isDrawingMode && residentsInCurrentPolygon.length > 0 && (
          <div className="absolute top-32 right-4 z-10">
            <div className="bg-red-500 text-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-sm font-medium">Drawing Territory</div>
              <div className="text-xs">{residentsInCurrentPolygon.length} residents detected</div>
            </div>
          </div>
        )}

        {showExistingTerritories && territories.length > 0 && (
          <div className="absolute top-48 right-4 z-10">
            <div className="bg-orange-500 text-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-sm font-medium">Existing Territories</div>
              <div className="text-xs">Highlighted in orange - avoid overlaps</div>
            </div>
          </div>
        )}

        {isMarkingMode && (
          <div className="absolute top-16 right-4 z-10">
            <div className="bg-[#42A5F5] text-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-sm font-medium">Quick Mark Mode Active</div>
              <div className="text-xs">Click markers to change status</div>
            </div>
          </div>
        )}
      </div>

        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
          <div className="p-4 space-y-4 bg-white">
          {workflowStep === "drawing" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-gray-900">Territory Drawing</div>
              </div>
              
              {/* Show existing territories toggle */}
              {isLoadingTerritories ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm mb-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                    <span className="text-sm font-semibold text-gray-800">Loading Existing Territories...</span>
                  </div>
                </div>
              ) : territories.length > 0 ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm mb-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="showExistingTerritories"
                      checked={showExistingTerritories}
                      onChange={(e) => setShowExistingTerritories(e.target.checked)}
                      className="w-5 h-5 text-orange-600 bg-white border-2 border-orange-300 rounded-md focus:ring-orange-500 focus:ring-2 transition-all duration-200"
                    />
                    <label htmlFor="showExistingTerritories" className="text-sm font-semibold text-gray-800">
                      Show Existing Territories
                    </label>
                  </div>
                  {showExistingTerritories && (
                    <div className="flex items-center gap-1 text-xs text-orange-700 font-semibold bg-orange-100 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Active
                    </div>
                  )}
                </div>
              ) : null}
              
              <div className="space-y-8">
                {/* Main Drawing Controls */}
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        if (isDrawingMode) {
                          // Force complete map re-render to reset drawing state
                          forceMapRerender()
                          setDrawingMode(false)
                        } else {
                          // Increment key to force fresh drawing manager
                          setDrawingManagerKey(prev => prev + 1)
                          setDrawingMode(true)
                        }
                      }}
                      disabled={isDetectingResidents}
                      size="lg"
                      className={`flex-1 font-semibold transition-all duration-200 ${
                        isDetectingResidents
                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                          : isDrawingMode
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-lg transform hover:scale-105"
                          : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg transform hover:scale-105"
                      } ${isDetectingResidents ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isDetectingResidents ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </div>
                      ) : isDrawingMode ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Stop Drawing
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          Draw Territory
                        </div>
                      )}
                    </Button>
                    
                    {(territories.length > 0 || isDrawingMode || currentPolygon) && (
                      <Button
                        onClick={handleClearAreas}
                        variant="outline"
                        size="lg"
                        className="px-4 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                        disabled={isDetectingResidents}
                        title="Clear All Territories"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Territory Search Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-800">Territory Search</label>
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Search area to draw territory"
                      value={territorySearch}
                      onChange={(e) => handleTerritorySearchChange(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm transition-all duration-200"
                    />
                    {showTerritorySuggestions && territorySearchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {territorySearchSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                            onClick={() => handleTerritorySuggestionSelect(suggestion)}
                          >
                            <div className="font-semibold text-gray-900">
                              {suggestion.structured_formatting?.main_text || suggestion.description}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {suggestion.structured_formatting?.secondary_text || ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDetectingResidents && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-gray-900">Detecting Residents</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42A5F5] mx-auto mb-4"></div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Analyzing Territory</div>
                    <div className="text-xs text-gray-500">
                      Detecting residential buildings and addresses...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {workflowStep === "saving" && pendingTerritory && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-[#42A5F5]">Save Territory</div>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <div className="text-sm font-medium text-[#42A5F5] mb-1">Territory Drawn Successfully!</div>
                  <div className="text-xs text-gray-600">
                    Found {pendingTerritory.residents.length} residents in the selected area
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Territory Name *</label>
                  <Input
                    placeholder="Enter territory name (e.g., Downtown Dallas)"
                    value={territoryName}
                    onChange={(e) => setTerritoryName(e.target.value)}
                    className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <textarea
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#42A5F5] focus:border-transparent resize-none bg-white ${
                      territoryDescription.length > 450 
                        ? territoryDescription.length > 500 
                          ? 'border-red-300' 
                          : 'border-yellow-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Optional description for this territory"
                    value={territoryDescription}
                    onChange={(e) => setTerritoryDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${
                      territoryDescription.length > 450 
                        ? territoryDescription.length > 500 
                          ? 'text-red-500' 
                          : 'text-yellow-600'
                        : 'text-gray-500'
                    }`}>
                      {territoryDescription.length}/500 characters
                    </span>
                    {territoryDescription.length > 500 && (
                      <span className="text-xs text-red-500">
                        Description too long
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Territory Summary</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Residents Found:</span>
                      <span className="font-semibold text-[#42A5F5]">{pendingTerritory.residents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-semibold text-orange-600">Draft</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTerritory}
                    className="flex-1 bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white font-medium"
                    disabled={!territoryName.trim() || isSavingTerritory}
                  >
                    {isSavingTerritory ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Territory"
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelSave}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                    disabled={isSavingTerritory}
                  >
                    Clear Drawing
                  </Button>
                </div>
              </div>
            </div>
          )}

          {workflowStep === "assigning" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-gray-900">Territory Assignment</div>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-1">Territory Saved as Draft</div>
                  <div className="text-xs text-gray-600">You can assign it now or leave it for later assignment</div>
                </div>

                {/* Assignment Type Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Assignment Type</label>
                  <RadioGroup 
                    value={assignmentType} 
                    onValueChange={(value: "team" | "individual") => {
                      setAssignmentType(value)
                      setSelectedAssignment(null)
                      setAssignmentSearchQuery("")
                      setAssignmentSearchResults([])
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team" />
                      <Label htmlFor="team" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        <span>Team</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Individual</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Search Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search {assignmentType === "team" ? "Team" : "Agent"}
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={`Search for ${assignmentType === "team" ? "team name" : "agent name"}...`}
                      value={assignmentSearchQuery}
                      onChange={(e) => {
                        const query = e.target.value
                        setAssignmentSearchQuery(query)
                        if (query.trim()) {
                          searchAssignment(query, assignmentType)
                        } else {
                          setAssignmentSearchResults([])
                        }
                      }}
                      className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white pr-10"
                    />
                    {isSearchingAssignment && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>

                  {/* Search Results */}
                  {assignmentSearchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                      {assignmentSearchResults.map((result) => (
                        <div
                          key={result._id || result.id}
                          onClick={() => {
                            setSelectedAssignment(result)
                            setAssignmentSearchQuery(assignmentType === "team" ? result.name : `${result.name} (${result.email})`)
                            setAssignmentSearchResults([])
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">
                            {assignmentType === "team" ? result.name : result.name}
                          </div>
                          {assignmentType === "individual" && (
                            <div className="text-xs text-gray-500">{result.email}</div>
                          )}
                          {assignmentType === "team" && result.agentIds && (
                            <div className="text-xs text-gray-500">{result.agentIds.length} agents</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results Message */}
                  {assignmentSearchQuery.trim() && !isSearchingAssignment && assignmentSearchResults.length === 0 && (
                    <div className="mt-2 p-3 text-center text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                      No {assignmentType === "team" ? "teams" : "agents"} found matching "{assignmentSearchQuery}"
                    </div>
                  )}

                  {/* Selected Assignment Display */}
                  {selectedAssignment && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-blue-900">
                            {assignmentType === "team" ? selectedAssignment.name : selectedAssignment.name}
                          </div>
                          {assignmentType === "individual" && (
                            <div className="text-xs text-blue-700">{selectedAssignment.email}</div>
                          )}
                          {assignmentType === "team" && selectedAssignment.agentIds && (
                            <div className="text-xs text-blue-700">{selectedAssignment.agentIds.length} agents</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(null)
                            setAssignmentSearchQuery("")
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Assignment */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Assignment Date</label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={assignedDate}
                      onChange={(e) => setAssignedDate(e.target.value)}
                      className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignTerritory}
                    className="flex-1 bg-[#FFC107] hover:bg-[#FFC107]/90 text-black font-medium"
                    disabled={!selectedAssignment || !assignedDate || isAssigningTerritory}
                  >
                    {isAssigningTerritory ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Territory"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setWorkflowStep("drawing")
                      selectTerritory(null)
                      setSelectedAssignment(null)
                      setAssignmentSearchQuery("")
                      setAssignmentSearchResults([])
                      setAssignedDate("")
                    }}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                    disabled={isAssigningTerritory}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={() => {
                      handleClearAreas()
                      setSelectedAssignment(null)
                      setAssignmentSearchQuery("")
                      setAssignmentSearchResults([])
                      setAssignedDate("")
                      selectTerritory(null)
                      setWorkflowStep("drawing")
                    }}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                    disabled={isAssigningTerritory}
                  >
                    Clear Areas
                  </Button>
                </div>

                {selectedTerritory && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Territory Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{selectedTerritory.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className="text-orange-600 font-semibold">
                          {selectedTerritory.status === "draft" ? "Draft" : "Assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Residents:</span>
                        <span className="font-semibold text-[#42A5F5]">{selectedTerritory.residents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span>{selectedTerritory.createdAt.toLocaleDateString()}</span>
                      </div>
                      {selectedTerritory.description && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="text-gray-600 text-xs mt-1">{selectedTerritory.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Drawing Card */}
          {isDrawingMode && residentsInCurrentPolygon.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-red-600">Current Drawing</div>
              </div>
              <div>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Residents Detected:</span>
                    <span className="font-bold text-red-600">{residentsInCurrentPolygon.length}</span>
                  </div>
                  {residentsInCurrentPolygon.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2 border border-red-100">
                      {residentsInCurrentPolygon.map((residentId) => {
                        const resident = residents.find((r) => r.id === residentId)
                        return resident ? (
                          <div key={residentId} className="text-xs py-1 border-b border-red-200 last:border-b-0">
                            <div className="font-medium">{resident.name}</div>
                            <div className="text-gray-600">{resident.address}</div>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">Complete the polygon to create territory</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
