"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'


import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Home, 
  Users, 
  Phone, 
  Calendar,
  Filter,
  ArrowLeft,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  Map as MapIcon,
  Layers,
  Satellite
} from 'lucide-react'
import { apiInstance } from '@/lib/apiInstance'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"]

interface TerritoryMapViewProps {
  territoryId: string
}

interface Property {
  _id: string
  address: string
  houseNumber: number
  coordinates: [number, number]
  status: 'Not Answered' | 'Interested' | 'Visited' | 'Callback' | 'Appointment' | 'Follow-up' | 'Not Interested'
  lastVisited?: string
  notes?: string
  residents?: {
    name: string
    phone?: string
    email?: string
  }[]
}

interface Territory {
  _id: string
  name: string
  description?: string
  boundary: any
  totalResidents: number
  activeResidents: number
  status: string
  assignedTo?: {
    type: 'TEAM' | 'INDIVIDUAL'
    name: string
  }
}

const statusColors = {
  'not-visited': '#EF4444', // red
  'interested': '#F59E0B', // amber  
  'visited': '#10B981', // emerald
  'callback': '#8B5CF6', // violet
  'appointment': '#3B82F6', // blue
  'follow-up': '#EC4899', // pink
  'not-interested': '#6B7280' // gray
}

const statusCounts = {
  'not-visited': 0,
  'interested': 0,
  'visited': 0,
  'callback': 0,
  'appointment': 0,
  'follow-up': 0,
  'not-interested': 0
}

export function TerritoryMapView({ territoryId }: TerritoryMapViewProps) {
  const router = useRouter()
  const [territory, setTerritory] = useState<Territory | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('All Status')
  const [sortBy, setSortBy] = useState<string>('Sequential')
  const [currentPage, setCurrentPage] = useState(1)
  const [mapViewType, setMapViewType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("hybrid")
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })



  // Fetch territory and properties data
  useEffect(() => {
    const fetchTerritoryData = async () => {
      try {
        setLoading(true)
        
        // Fetch territory map view data (zone details + residents)
        const response = await apiInstance.get(`/zones/map-view/${territoryId}`)
        if (response.data.success) {
          const { zone, properties: zoneProperties, statusSummary, statistics } = response.data.data
          
          // Set territory data
          setTerritory(zone)
          
          // Set properties data
          setProperties(zoneProperties)
          setFilteredProperties(zoneProperties)
          
          // Update status counts for legend
          Object.keys(statusSummary).forEach(status => {
            if (statusCounts.hasOwnProperty(status)) {
              statusCounts[status as keyof typeof statusCounts] = statusSummary[status]
            }
          })
        }
        
      } catch (error) {
        console.error('Error fetching territory map view data:', error)
        toast.error('Failed to load territory data')
      } finally {
        setLoading(false)
      }
    }

    if (territoryId) {
      fetchTerritoryData()
    }
  }, [territoryId])

  // Filter and sort properties
  useEffect(() => {
    let filtered = properties

    // Apply status filter
    if (statusFilter && statusFilter !== 'All Status') {
      filtered = filtered.filter(property => property.status === statusFilter)
    }

    // Apply sorting
    if (sortBy === 'Sequential') {
      filtered = filtered.sort((a, b) => a.houseNumber - b.houseNumber)
    } else if (sortBy === 'Odd') {
      filtered = filtered.filter(property => property.houseNumber % 2 === 1)
        .sort((a, b) => a.houseNumber - b.houseNumber)
    } else if (sortBy === 'Even') {
      filtered = filtered.filter(property => property.houseNumber % 2 === 0)
        .sort((a, b) => a.houseNumber - b.houseNumber)
    }

    setFilteredProperties(filtered)
  }, [properties, statusFilter, sortBy])



  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    // Set hybrid view by default
    map.setMapTypeId(google.maps.MapTypeId.HYBRID)
    
    if (territory?.boundary) {
      // Add a small delay to ensure map is fully loaded
      setTimeout(() => {
        const bounds = new window.google.maps.LatLngBounds()
        territory.boundary.coordinates[0].forEach(([lng, lat]: [number, number]) => {
          bounds.extend(new window.google.maps.LatLng(lat, lng))
        })
        map.fitBounds(bounds)
        // Set a reasonable zoom level that's not too zoomed in
        setTimeout(() => {
          const currentZoom = map.getZoom()
          if (currentZoom && currentZoom > 16) {
            map.setZoom(16) // Cap the zoom level
          }
        }, 100)
      }, 200)
    }
  }, [territory])

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
    
    // Center map on selected property
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: property.coordinates[1],
        lng: property.coordinates[0]
      })
      mapRef.current.setZoom(18)
    }
  }

  const handleFocusCurrentZone = () => {
    if (mapRef.current && territory?.boundary) {
      const bounds = new google.maps.LatLngBounds()
      
      // Add boundary coordinates to bounds
      if (territory.boundary.coordinates && territory.boundary.coordinates[0]) {
        territory.boundary.coordinates[0].forEach((coord: [number, number]) => {
          bounds.extend({ lat: coord[1], lng: coord[0] })
        })
      }
      
      // Add property coordinates to bounds
      properties.forEach(property => {
        bounds.extend({ lat: property.coordinates[1], lng: property.coordinates[0] })
      })
      
      mapRef.current.fitBounds(bounds)
      
      // Add some padding to the bounds
      const listener = google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom()
          if (currentZoom && currentZoom > 16) {
            mapRef.current.setZoom(16)
          }
        }
      })
    }
  }

  const handleMapViewChange = (viewType: "roadmap" | "satellite" | "hybrid" | "terrain") => {
    setMapViewType(viewType)
    if (mapRef.current) {
      const mapTypeId = viewType === "roadmap" ? google.maps.MapTypeId.ROADMAP :
                       viewType === "satellite" ? google.maps.MapTypeId.SATELLITE :
                       viewType === "hybrid" ? google.maps.MapTypeId.HYBRID :
                       google.maps.MapTypeId.TERRAIN
      mapRef.current.setMapTypeId(mapTypeId)
    }
  }

  const handleBackToList = () => {
    router.back()
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading Google Maps</div>
      </div>
    )
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading map view...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait while we prepare your territory</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to List</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {territory?.name || 'Territory Map View'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {territory?.description || 'Detailed property view and management'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFocusCurrentZone}
              className="text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Focus Current Zone</span>
              <span className="sm:hidden">Focus</span>
            </Button>
            <Badge 
              variant="secondary"
              style={{ 
                backgroundColor: territory?.status === 'ACTIVE' ? '#10B98120' : 
                               territory?.status === 'SCHEDULED' ? '#F59E0B20' : 
                               territory?.status === 'DRAFT' ? '#6B728020' : 
                               territory?.status === 'COMPLETED' ? '#3B82F620' : '#6B728020',
                color: territory?.status === 'ACTIVE' ? '#10B981' : 
                       territory?.status === 'SCHEDULED' ? '#F59E0B' : 
                       territory?.status === 'DRAFT' ? '#6B7280' : 
                       territory?.status === 'COMPLETED' ? '#3B82F6' : '#6B7280',
                borderColor: territory?.status === 'ACTIVE' ? '#10B981' : 
                            territory?.status === 'SCHEDULED' ? '#F59E0B' : 
                            territory?.status === 'DRAFT' ? '#6B7280' : 
                            territory?.status === 'COMPLETED' ? '#3B82F6' : '#6B7280'
              }}
              className="text-xs sm:text-sm font-medium"
            >
              {territory?.status || 'Loading...'}
            </Badge>
            {territory?.assignedTo && (
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Assigned to: <span className="font-medium">{territory.assignedTo.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        {/* Responsive Left Sidebar */}
        <div className="w-full xl:w-96 bg-white border-b xl:border-b-0 xl:border-r border-gray-200 flex flex-col flex-shrink-0">
                      {/* Fixed Stats Header */}
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base sm:text-lg font-medium text-gray-700">Properties</h2>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-sm sm:text-base font-bold">{territory?.totalResidents || 0}</div>
                    <div className="text-xs">Total Homes</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white">
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-sm sm:text-base font-bold">{territory?.activeResidents || 0}</div>
                    <div className="text-xs">Visited</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white">
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-sm sm:text-base font-bold">{(territory?.totalResidents || 0) - (territory?.activeResidents || 0)}</div>
                    <div className="text-xs">Remaining</div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                <Button 
                  variant={sortBy === 'Sequential' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSortBy('Sequential')}
                  className={`text-xs sm:text-sm ${sortBy === 'Sequential' ? 'bg-blue-600 text-white' : ''}`}
                >
                  <span className="hidden sm:inline">Sequential</span>
                  <span className="sm:hidden">Seq</span>
                </Button>
                <Button 
                  variant={sortBy === 'Odd' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSortBy('Odd')}
                  className={`text-xs sm:text-sm ${sortBy === 'Odd' ? 'bg-blue-600 text-white' : ''}`}
                >
                  Odd
                </Button>
                <Button 
                  variant={sortBy === 'Even' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSortBy('Even')}
                  className={`text-xs sm:text-sm ${sortBy === 'Even' ? 'bg-blue-600 text-white' : ''}`}
                >
                  Even
                </Button>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="not-visited">Not Visited</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="not-interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* Scrollable Property List */}
          <div className="flex-1 overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#D1D5DB #F3F4F6'
          }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #F3F4F6;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #D1D5DB;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #9CA3AF;
              }
            `}</style>
            {filteredProperties.map((property, index) => (
              <div
                key={property._id}
                className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedProperty?._id === property._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base xl:text-base truncate xl:whitespace-normal xl:break-words">{property.address}</h3>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: statusColors[property.status] + '20',
                          color: statusColors[property.status],
                          borderColor: statusColors[property.status]
                        }}
                        className="text-xs flex-shrink-0 ml-2"
                      >
                        {property.status === 'visited' ? '✓ Visited' : 
                         property.status === 'interested' ? '✓ Interested' :
                         property.status === 'callback' ? '📞 Callback' :
                         property.status === 'appointment' ? '📅 Appointment' :
                         property.status === 'follow-up' ? '🔄 Follow-up' :
                         property.status === 'not-interested' ? '❌ Not Interested' :
                         '⏳ Not Visited'}
                      </Badge>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      
                      {property.residents?.map((resident, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate xl:whitespace-normal xl:break-words">{resident.name}</span>
                          {resident.phone && (
                            <>
                              <Phone className="w-3 h-3 ml-2 flex-shrink-0" />
                              <span className="text-xs">{resident.phone}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[property.status] }}
                    />
                    {property.lastVisited && (
                      <div className="text-xs text-gray-400">
                        {new Date(property.lastVisited).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Status Legend */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Status Legend</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {Object.entries(statusColors).map(([status, color]) => {
                const displayName = {
                  'not-visited': '⏳ Not Visited',
                  'interested': '✓ Interested',
                  'visited': '✓ Visited',
                  'callback': '📞 Callback',
                  'appointment': '📅 Appointment',
                  'follow-up': '🔄 Follow-up',
                  'not-interested': '❌ Not Interested'
                }[status] || status;
                
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-600 truncate xl:whitespace-normal xl:break-words">{displayName} ({statusCounts[status as keyof typeof statusCounts]})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Google Map */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) - 1)}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>

          {/* Google Map */}
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={territory?.boundary?.coordinates ? undefined : { lat: 28.6358, lng: 77.2777 }}
            zoom={territory?.boundary?.coordinates ? undefined : 16}
            onLoad={onLoad}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {/* Map View Controls */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                <Button
                  variant={mapViewType === "roadmap" ? "default" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 ${
                    mapViewType === "roadmap"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleMapViewChange("roadmap")}
                  title="Street View"
                >
                  <MapIcon className="h-5 w-5" />
                </Button>
                
                <Button
                  variant={mapViewType === "hybrid" ? "default" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 ${
                    mapViewType === "hybrid"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleMapViewChange("hybrid")}
                  title="Hybrid View (Recommended)"
                >
                  <Layers className="h-5 w-5" />
                </Button>
                
                <Button
                  variant={mapViewType === "satellite" ? "default" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 ${
                    mapViewType === "satellite"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleMapViewChange("satellite")}
                  title="Satellite View"
                >
                  <Satellite className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Territory Boundary */}
            {territory?.boundary && (
              <Polygon
                paths={territory.boundary.coordinates[0].map(([lng, lat]: [number, number]) => ({
                  lat,
                  lng
                }))}
                options={{
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Property Markers */}
            {properties.map((property) => (
              <Marker
                key={property._id}
                position={{
                  lat: property.coordinates[1],
                  lng: property.coordinates[0]
                }}
                onClick={() => handlePropertyClick(property)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: statusColors[property.status],
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#ffffff',
                }}
                title={`${property.address} - ${property.status}`}
              />
            ))}

            {/* Selected Property Info Window */}
            {selectedProperty && (
              <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 min-w-64 z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedProperty.address}</h3>
                    <p className="text-sm text-gray-600">House #{selectedProperty.houseNumber}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: statusColors[selectedProperty.status] + '20',
                      color: statusColors[selectedProperty.status]
                    }}
                  >
                    {selectedProperty.status}
                  </Badge>
                </div>
                
                {selectedProperty.residents?.map((resident, index) => (
                  <div key={index} className="space-y-1 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{resident.name}</span>
                    </div>
                    {resident.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{resident.phone}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {selectedProperty.lastVisited && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Last visited: {new Date(selectedProperty.lastVisited).toLocaleDateString()}</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  )
}

