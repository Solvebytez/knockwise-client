"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TerritoryEditMap } from "@/components/territory-edit-map"
import { TerritoryEditSidebar } from "@/components/territory-edit-sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

// Types
interface Territory {
  _id: string
  name: string
  description?: string
  status: string
  boundary: any
  currentAssignment?: {
    _id: string
    agentId?: { _id: string; name: string; email: string }
    teamId?: { _id: string; name: string }
    effectiveFrom: string
    effectiveTo?: string
    status: string
  }
}

interface Agent {
  _id: string
  name: string
  email: string
}

interface Team {
  _id: string
  name: string
}

// API functions
const fetchTerritory = async (id: string): Promise<Territory> => {
  try {
    const response = await apiInstance.get(`/zones/get-by-id/${id}`)
    console.log('Territory fetch response:', response.data)
    return response.data.data
  } catch (error) {
    console.error('Error fetching territory:', error)
    throw error
  }
}

const fetchAgents = async (): Promise<Agent[]> => {
  const response = await apiInstance.get('/users/my-created-agents')
  return response.data.data
}

const fetchTeams = async (): Promise<Team[]> => {
  const response = await apiInstance.get('/teams')
  return response.data.data
}

const updateTerritory = async ({ id, data }: { id: string; data: any }) => {
  console.log('Sending update data:', { id, data })
  const response = await apiInstance.put(`/zones/update/${id}`, data)
  console.log('Update response:', response.data)
  return response.data.data // Return the actual zone data
}

function TerritoryEditContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const territoryId = params.territory_id as string
  const [showExistingTerritories, setShowExistingTerritories] = useState(true)
  const [existingTerritoriesCount, setExistingTerritoriesCount] = useState(0)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [isEditingBoundary, setIsEditingBoundary] = useState(false)
  const [isDetectingBuildings, setIsDetectingBuildings] = useState(false)
  const [detectedBuildings, setDetectedBuildings] = useState<any[]>([])
  const [pendingBoundary, setPendingBoundary] = useState<any>(null)
  const [isMapInitiallyLoaded, setIsMapInitiallyLoaded] = useState(false)

  // Queries
  const { data: territory, isLoading: territoryLoading, refetch: refetchTerritory } = useQuery({
    queryKey: ['territory', territoryId],
    queryFn: () => fetchTerritory(territoryId),
    enabled: !!territoryId,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Refetch when component mounts
  })

  // Function to compare boundaries and determine if there are changes
  const hasBoundaryChanges = useCallback(() => {
    if (!pendingBoundary || !territory?.boundary) {
      return false
    }

    const originalCoords = territory.boundary.coordinates[0]
    const newCoords = pendingBoundary.coordinates[0]

    // Check if the number of coordinates is different
    if (originalCoords.length !== newCoords.length) {
      return true
    }

    // Check if any coordinates are different (with some tolerance for floating point precision)
    for (let i = 0; i < originalCoords.length; i++) {
      const originalCoord = originalCoords[i]
      const newCoord = newCoords[i]
      
      // Check if longitude or latitude differs by more than a small threshold
      if (Math.abs(originalCoord[0] - newCoord[0]) > 0.000001 || 
          Math.abs(originalCoord[1] - newCoord[1]) > 0.000001) {
        return true
      }
    }

    return false
  }, [pendingBoundary, territory?.boundary])

  // Function to check if there are any meaningful changes (boundary, name, or description)
  const hasAnyChanges = useCallback(() => {
    // Check for boundary changes
    if (hasBoundaryChanges()) {
      return true
    }

    // Note: Name and description changes will be checked in the sidebar component
    // since those are managed there
    return false
  }, [hasBoundaryChanges])

  // Debug: Log territory data changes
  useEffect(() => {
    console.log('Territory data updated:', territory)
  }, [territory])

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  })

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  // Mutation
  const updateMutation = useMutation({
    mutationFn: updateTerritory,
    onSuccess: (data) => {
      toast.success('Territory updated successfully!')
      console.log('Update successful, new data:', data)
      
      // Update the cache directly with the new data
      queryClient.setQueryData(['territory', territoryId], data)
      
      // Also invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['territory', territoryId] })
      queryClient.invalidateQueries({ queryKey: ['territories'] })
      
      // Refetch territory data to ensure UI is updated
      refetchTerritory()
      
      // Reset states after successful update
      setPendingBoundary(null)
      setDetectedBuildings([])
      setIsEditingBoundary(false)
    },
    onError: (error: any) => {
      console.error('Update error:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to update territory')
    },
  })

  const handleUpdate = (updateData: any) => {
    updateMutation.mutate({ id: territoryId, data: updateData })
  }

  const handleFocusTerritory = () => {
    setFocusTrigger(prev => prev + 1)
  }

  const handleEditBoundary = () => {
    setIsEditingBoundary(true)
    // This will be handled by the map component to enable drawing mode
  }

  // Building detection function (similar to create page)
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

    // Generate sample addresses within the polygon
    const detectedResidents = []
    const geocoder = new window.google.maps.Geocoder()

    // Generate realistic building numbers (even/odd pattern)
    const buildingNumbers = []
    const startNumber = Math.floor(Math.random() * 100) + 100 // Start between 100-199
    for (let i = 0; i < estimatedBuildings; i++) {
      // Alternate between even and odd numbers
      const number = startNumber + (i * 2) + (i % 2)
      buildingNumbers.push(number)
    }

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

  const handleBoundaryUpdate = async (newBoundary: any) => {
    if (newBoundary === null) {
      // Cancel the edit
      setIsEditingBoundary(false)
      setPendingBoundary(null)
      setDetectedBuildings([])
      return
    }
    
    console.log('Starting building detection for new boundary:', newBoundary)
    
    // Store the pending boundary and start building detection
    setPendingBoundary(newBoundary)
    setIsDetectingBuildings(true)
    
    try {
      // Create a temporary polygon for building detection
      const tempPolygon = new window.google.maps.Polygon({
        paths: newBoundary.coordinates[0].map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }))
      })
      
      console.log('Created temporary polygon for building detection')
      
      // Detect buildings in the new boundary
      const detectedResidents = await detectBuildingsInPolygon(tempPolygon)
      setDetectedBuildings(detectedResidents)
      
      console.log(`Successfully detected ${detectedResidents.length} buildings in new boundary`)
      
      // Show success message
      toast.success(`Detected ${detectedResidents.length} buildings in the new boundary`)
      
    } catch (error) {
      console.error('Error detecting buildings:', error)
      toast.error('Failed to detect buildings in the new boundary')
      setDetectedBuildings([])
    } finally {
      setIsDetectingBuildings(false)
    }
  }

  const handleUpdateTerritory = (updateData: any) => {
    console.log('handleUpdateTerritory called with:', updateData)
    console.log('Pending boundary:', pendingBoundary)
    console.log('Detected buildings:', detectedBuildings)
    
    if (pendingBoundary) {
      console.log('Processing update with pending boundary and building data')
      
      // Combine the territory update data with the new boundary and building data
      const fullUpdateData = {
        ...updateData,
        boundary: pendingBoundary,
        buildingData: {
          totalBuildings: detectedBuildings.length,
          residentialHomes: detectedBuildings.length,
          addresses: detectedBuildings.map(building => building.address),
          coordinates: detectedBuildings.map(building => [building.lng, building.lat])
        }
      }
      
      console.log('Sending update with data:', fullUpdateData)
      updateMutation.mutate({ id: territoryId, data: fullUpdateData })
      
      // Reset states after update
      setPendingBoundary(null)
      setDetectedBuildings([])
      setIsEditingBoundary(false) // Exit drawing mode after successful update
    } else {
      console.log('Processing regular update without boundary change')
      // Regular update without boundary change
      updateMutation.mutate({ id: territoryId, data: updateData })
    }
  }

  // Auto-focus on territory when it loads
  useEffect(() => {
    if (territory && territory.boundary?.coordinates) {
      // Small delay to ensure map is loaded
      const timer = setTimeout(() => {
        setFocusTrigger(prev => prev + 1)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [territory])



  if (territoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading territory...</p>
        </div>
      </div>
    )
  }

  if (!territory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Territory not found</p>
          <Button onClick={() => router.push('/territory-map')} className="mt-4">
            Back to Overview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Territory
            </h1>
            <p className="text-gray-600 mt-1">
              Update territory information and assignments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/territory-map')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
                 {/* Map Section */}
         <div className="flex-1">
           <TerritoryEditMap 
             territory={territory} 
             showExistingTerritories={showExistingTerritories}
             onToggleExistingTerritories={setShowExistingTerritories}
             onExistingTerritoriesCountChange={setExistingTerritoriesCount}
             focusTrigger={focusTrigger}
             isEditingBoundary={isEditingBoundary}
             onBoundaryUpdate={handleBoundaryUpdate}
             onApplyDrawnBoundary={() => {}}
           />
         </div>

                                            {/* Right Sidebar */}
                   <TerritoryEditSidebar
            territory={territory}
            agents={agents}
            teams={teams}
            onUpdate={handleUpdate}
            isUpdating={updateMutation.isPending}
            showExistingTerritories={showExistingTerritories}
            onToggleExistingTerritories={setShowExistingTerritories}
            existingTerritoriesCount={existingTerritoriesCount}
            onFocusTerritory={handleFocusTerritory}
            onEditBoundary={handleEditBoundary}
            onBoundaryUpdate={handleBoundaryUpdate}
            isDetectingBuildings={isDetectingBuildings}
            detectedBuildings={detectedBuildings}
            onUpdateTerritory={handleUpdateTerritory}
            hasBoundaryChanges={hasBoundaryChanges()}
            hasAnyChanges={hasAnyChanges()}
          />
      </div>
    </div>
  )
}

export default function TerritoryEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TerritoryEditContent />
    </Suspense>
  )
}
