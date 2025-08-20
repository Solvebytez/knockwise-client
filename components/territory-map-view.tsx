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
  CheckCircle
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
  'Not Answered': '#EF4444', // red
  'Interested': '#F59E0B', // amber  
  'Visited': '#10B981', // emerald
  'Callback': '#8B5CF6', // violet
  'Appointment': '#3B82F6', // blue
  'Follow-up': '#EC4899', // pink
  'Not Interested': '#6B7280' // gray
}

const statusCounts = {
  'Not Answered': 12,
  'Interested': 8,
  'Visited': 6,
  'Callback': 10,
  'Appointment': 7,
  'Follow-up': 4,
  'Not Interested': 3
}

export function TerritoryMapView({ territoryId }: TerritoryMapViewProps) {
  const router = useRouter()
  const [territory, setTerritory] = useState<Territory | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All Status')
  const [sortBy, setSortBy] = useState<string>('Sequential')
  const [currentPage, setCurrentPage] = useState(1)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  // Mock data - replace with actual API call
  const mockProperties: Property[] = [
    {
      _id: '1',
      address: 'Laxmi Nagar Lane 1',
      houseNumber: 1,
      coordinates: [77.2777, 28.6358],
      status: 'Visited',
      lastVisited: '2024-01-15',
      residents: [{ name: 'John Doe', phone: '+91-9876543210' }]
    },
    {
      _id: '2', 
      address: 'Laxmi Nagar Lane 1',
      houseNumber: 2,
      coordinates: [77.2778, 28.6359],
      status: 'Not Answered',
      residents: [{ name: 'Jane Smith' }]
    },
    {
      _id: '3',
      address: 'Laxmi Nagar Lane 1', 
      houseNumber: 3,
      coordinates: [77.2779, 28.6360],
      status: 'Not Answered',
      residents: [{ name: 'Bob Johnson' }]
    },
    {
      _id: '4',
      address: 'Laxmi Nagar Lane 1',
      houseNumber: 4, 
      coordinates: [77.2780, 28.6361],
      status: 'Not Answered',
      residents: [{ name: 'Alice Wilson' }]
    },
    {
      _id: '5',
      address: 'Laxmi Nagar Lane 1',
      houseNumber: 5,
      coordinates: [77.2781, 28.6362],
      status: 'Not Answered', 
      residents: [{ name: 'Charlie Brown' }]
    }
  ]

  // Fetch territory and properties data
  useEffect(() => {
    const fetchTerritoryData = async () => {
      try {
        setLoading(true)
        
        // Fetch territory details
        const territoryResponse = await apiInstance.get(`/zones/${territoryId}`)
        if (territoryResponse.data.success) {
          setTerritory(territoryResponse.data.data)
        }

        // For now, use mock data for properties
        // TODO: Replace with actual API call to fetch residents/properties
        setProperties(mockProperties)
        setFilteredProperties(mockProperties)
        
      } catch (error) {
        console.error('Error fetching territory data:', error)
        toast.error('Failed to load territory data')
      } finally {
        setLoading(false)
      }
    }

    if (territoryId) {
      fetchTerritoryData()
    }
  }, [territoryId])

  // Filter and search properties
  useEffect(() => {
    let filtered = properties

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.houseNumber.toString().includes(searchTerm) ||
        property.residents?.some(resident => 
          resident.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'All Status') {
      filtered = filtered.filter(property => property.status === statusFilter)
    }

    // Apply sorting
    if (sortBy === 'Sequential') {
      filtered = filtered.sort((a, b) => a.houseNumber - b.houseNumber)
    }

    setFilteredProperties(filtered)
  }, [properties, searchTerm, statusFilter, sortBy])

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    if (territory?.boundary) {
      // Fit map to territory boundary
      const bounds = new window.google.maps.LatLngBounds()
      territory.boundary.coordinates[0].forEach(([lng, lat]: [number, number]) => {
        bounds.extend(new window.google.maps.LatLng(lat, lng))
      })
      map.fitBounds(bounds)
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading map view...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {territory?.name || 'Territory Map View'}
              </h1>
              <p className="text-sm text-gray-500">
                {territory?.description || 'Detailed property view and management'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={territory?.status === 'ACTIVE' ? 'default' : 'secondary'}
              className={territory?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
            >
              {territory?.status || 'Active'}
            </Badge>
            {territory?.assignedTo && (
              <div className="text-sm text-gray-600">
                Assigned to: <span className="font-medium">{territory.assignedTo.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Property List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Stats Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">{territory?.name || 'Laxmi Nagar, Jammu'}</h2>
              <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Card className="bg-blue-500 text-white">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">50</div>
                  <div className="text-xs">Total Homes</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">1</div>
                  <div className="text-xs">Visited</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-700 text-white">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">49</div>
                  <div className="text-xs">Remaining</div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                View numbers
              </Button>
              <Button variant="outline" size="sm">Sequential</Button>
              <Button variant="outline" size="sm">Sort</Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Not Answered">Not Answered</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Visited">Visited</SelectItem>
                  <SelectItem value="Callback">Callback</SelectItem>
                  <SelectItem value="Appointment">Appointment</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Property List */}
          <div className="flex-1 overflow-y-auto">
            {filteredProperties.map((property, index) => (
              <div
                key={property._id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedProperty?._id === property._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{property.address}</h3>
                      <Badge 
                        variant={property.status === 'Visited' ? 'default' : 'secondary'}
                        className={
                          property.status === 'Visited' 
                            ? 'bg-green-100 text-green-800 text-xs' 
                            : 'bg-gray-100 text-gray-600 text-xs'
                        }
                      >
                        {property.status === 'Visited' ? 'Knocked' : property.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {property.status === 'Visited' ? (
                        <div className="text-green-600">(visited)</div>
                      ) : (
                        <div className="text-gray-500">(not visited)</div>
                      )}
                      
                      {property.residents?.map((resident, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{resident.name}</span>
                          {resident.phone && (
                            <>
                              <Phone className="w-3 h-3 ml-2" />
                              <span className="text-xs">{resident.phone}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
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

          {/* Status Legend */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status Legend</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-600">{status} ({statusCounts[status as keyof typeof statusCounts]})</span>
                </div>
              ))}
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
            center={{ lat: 28.6358, lng: 77.2777 }}
            zoom={16}
            onLoad={onLoad}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
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
