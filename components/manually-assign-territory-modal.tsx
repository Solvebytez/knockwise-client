"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, MapPin, Users, User, Building, CheckCircle, AlertCircle, Map, Calendar } from "lucide-react"
import * as turf from '@turf/turf'
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"
import { 
  getCityNeighbourhoodsDynamic, 
  getStreetsInNeighbourhood, 
  getStreetsInNeighbourhoodByName,
  getStreetsInNeighbourhoodGoogle
} from '@/utils/osm'
import { osmService, RESIDENTIAL_BUILDING_TYPES, type BuildingFootprint, type OSMBuilding } from '@/lib/osmService'
import { overpassService, type OverpassStreet } from '@/lib/overpassService'
import type { ResidentialBuildingType } from '@/types/osm'
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api'

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"]

// Extend Window interface for areaSearchTimeout
declare global {
  interface Window {
    areaSearchTimeout?: NodeJS.Timeout
  }
}

interface PlaceSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface DetectedResident {
  id: string
  name: string
  address: string
  buildingNumber?: number
  lat: number
  lng: number
  status: string
  phone?: string
  email?: string
  notes?: string
  lastVisited?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

interface ManuallyAssignTerritoryModalProps {
  isOpen: boolean
  onClose: () => void
  onTerritorySaved: (territoryData: any) => void
}

export function ManuallyAssignTerritoryModal({ 
  isOpen, 
  onClose, 
  onTerritorySaved 
}: ManuallyAssignTerritoryModalProps) {
  
  const { isLoaded: isGoogleMapsApiLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  })
  // Form state
  const [formStep, setFormStep] = useState(1)
  const [territoryName, setTerritoryName] = useState("")

  const [selectedStreets, setSelectedStreets] = useState<string[]>([])
  const [territoryDescription, setTerritoryDescription] = useState("")
  const [streetInputValue, setStreetInputValue] = useState("")
  const [assignedRep, setAssignedRep] = useState("")
  const [assignedDate, setAssignedDate] = useState("")

  // Google Places state
  const [streetSuggestions, setStreetSuggestions] = useState<PlaceSuggestion[]>([])
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false)
  const [showResultsPanel, setShowResultsPanel] = useState(false)
  const [activeSearchField, setActiveSearchField] = useState<string>("")

  // Processing state
  const [isDetectingResidents, setIsDetectingResidents] = useState(false)
  const [isSavingTerritory, setIsSavingTerritory] = useState(false)
  const [isAssigningTerritory, setIsAssigningTerritory] = useState(false)
  const [isLoadingStreets, setIsLoadingStreets] = useState(false)
  const [noStreetsFound, setNoStreetsFound] = useState(false)
  const [detectedResidents, setDetectedResidents] = useState<DetectedResident[]>([])
  const [generatedPolygon, setGeneratedPolygon] = useState<any>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [territoryArea, setTerritoryArea] = useState<number>(0)
  const [buildingDensity, setBuildingDensity] = useState<number>(0)
  const [detectionProgress, setDetectionProgress] = useState<string>('')
  const [apiCallCount, setApiCallCount] = useState<number>(0)

  // Google Places services
  const [autocompleteService, setAutocompleteService] = useState<any>(null)
  const [placesService, setPlacesService] = useState<any>(null)
  const [geocoder, setGeocoder] = useState<any>(null)

  // Enhanced detection settings state variables
  const [searchRadius, setSearchRadius] = useState<number>(300)
  const [maxDistanceFromStreet, setMaxDistanceFromStreet] = useState<number>(1.0)
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>("residential")
  const [addressValidationLevel, setAddressValidationLevel] = useState<string>("strict")
  const [coordinatePrecision, setCoordinatePrecision] = useState<string>("medium")

  // Geographic hierarchy state variables
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("")
  const [selectedCommunity, setSelectedCommunity] = useState<string>("")
  const [areaInputValue, setAreaInputValue] = useState<string>("")
  const [municipalityInputValue, setMunicipalityInputValue] = useState<string>("")
  const [communityInputValue, setCommunityInputValue] = useState<string>("")
  const [areaSuggestions, setAreaSuggestions] = useState<any[]>([])
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<any[]>([])
  const [communitySuggestions, setCommunitySuggestions] = useState<any[]>([])
  const [isSettingAreaProgrammatically, setIsSettingAreaProgrammatically] = useState(false)
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(false)
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState<boolean>(false)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState<boolean>(false)
  const [cachedMunicipalities, setCachedMunicipalities] = useState<any[]>([]) // Cache for auto-loaded municipalities
  const [cachedCommunities, setCachedCommunities] = useState<any[]>([]) // Cache for auto-loaded communities
  const [cachedStreets, setCachedStreets] = useState<any[]>([]) // Cache for auto-loaded streets

  // Refs for click-outside detection
  const areaDropdownRef = useRef<HTMLDivElement>(null)
  const municipalityDropdownRef = useRef<HTMLDivElement>(null)
  const communityDropdownRef = useRef<HTMLDivElement>(null)

  // Click-outside handler for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(target)) {
        setAreaSuggestions([])
      }
      if (municipalityDropdownRef.current && !municipalityDropdownRef.current.contains(target)) {
        setMunicipalitySuggestions([])
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(target)) {
        setCommunitySuggestions([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Add new state variables for assignment functionality
  const [assignmentType, setAssignmentType] = useState<"team" | "individual">("team")
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("")
  const [assignmentSearchResults, setAssignmentSearchResults] = useState<any[]>([])
  const [isSearchingAssignment, setIsSearchingAssignment] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [savedTerritoryId, setSavedTerritoryId] = useState<string | null>(null)

  // Initialize Google Places services when Google Maps is available
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true)
        setAutocompleteService(new window.google.maps.places.AutocompleteService())
        setPlacesService(new window.google.maps.places.PlacesService(document.createElement('div')))
      } else {
        // If not loaded yet, check again in 100ms
        setTimeout(checkGoogleMaps, 100)
      }
    }

    checkGoogleMaps()
  }, [])

  // Initialize geocoder service when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsApiLoaded && window.google?.maps) {
      setGeocoder(new window.google.maps.Geocoder())
    }
  }, [isGoogleMapsApiLoaded])

  // Monitor detection settings for safety checks
  useEffect(() => {
    console.log('🔧 Detection Settings Updated:', {
      searchRadius,
      maxDistanceFromStreet,
      buildingTypeFilter,
      addressValidationLevel,
      coordinatePrecision
    })
  }, [searchRadius, maxDistanceFromStreet, buildingTypeFilter, addressValidationLevel, coordinatePrecision])

  // Safety check for NaN values in detection settings
  useEffect(() => {
    if (isNaN(searchRadius)) {
      console.warn('⚠️ searchRadius is NaN, resetting to 300')
      setSearchRadius(300)
    }
    if (isNaN(maxDistanceFromStreet)) {
      console.warn('⚠️ maxDistanceFromStreet is NaN, resetting to 1.0')
      setMaxDistanceFromStreet(1.0)
    }
  }, [searchRadius, maxDistanceFromStreet])

  // Add fetch functions for teams and agents
  const fetchAgents = useCallback(async (): Promise<any[]> => {
    const response = await apiInstance.get('/users/my-created-agents?includeTeamInfo=true')
    return response.data.data || []
  }, [])

  const fetchTeams = useCallback(async (): Promise<any[]> => {
    const response = await apiInstance.get('/teams')
    return response.data.data || []
  }, [])

  // Add search function for assignment
  const searchAssignment = useCallback(async (query: string, type: "team" | "individual") => {
    if (!query.trim()) {
      setAssignmentSearchResults([])
      return
    }

    console.log(`Searching for ${type} with query: "${query}"`)
    setIsSearchingAssignment(true)
    try {
      if (type === "team") {
        // Fetch all teams and filter client-side for better performance
        const allTeams = await fetchTeams()
        const filteredTeams = allTeams.filter(team => 
          team.name.toLowerCase().includes(query.toLowerCase())
        )
        console.log('Team search results:', filteredTeams)
        setAssignmentSearchResults(filteredTeams)
      } else {
        // Fetch all agents and filter client-side for better performance
        const allAgents = await fetchAgents()
        const filteredAgents = allAgents.filter(agent => 
          agent.name.toLowerCase().includes(query.toLowerCase()) ||
          agent.email.toLowerCase().includes(query.toLowerCase())
        )
        console.log('Agent search results:', filteredAgents)
        setAssignmentSearchResults(filteredAgents)
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
  }, [fetchAgents, fetchTeams])

  // Add state to track if search is triggered by selection
  const [isSelectionUpdate, setIsSelectionUpdate] = useState(false)

  // Geographic hierarchy search functions
  const searchAreas = useCallback(async (query: string) => {
    console.log('🔍 searchAreas called with:', query)
    if (query.length < 2) {
      console.log('Query too short, clearing suggestions')
      setAreaSuggestions([])
      return
    }

    setIsLoadingAreas(true)
    console.log('🌐 Making OSM API call for areas...')
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Search timeout reached')
      setIsLoadingAreas(false)
      setAreaSuggestions([])
    }, 10000) // 10 second timeout
    
    try {
      // Clean and validate the query first
      const cleanQuery = query.trim().toLowerCase()
      console.log('Clean query:', cleanQuery)
      
      // Try multiple search strategies for better results
      const searchQueries = [
        `${query}, Canada`,           // Exact with Canada
        `${query}, Ontario, Canada`,  // With Ontario and Canada
        `${query}, ON, Canada`,       // With Ontario abbreviation and Canada
        `${query}`,                   // Just the query
        `${query}, Ontario`,          // With Ontario
        `${query}, ON`                // With Ontario abbreviation
      ]

      let allAreas: any[] = []

      for (const searchQuery of searchQueries) {
        try {
          // Ensure the search query is properly encoded
          const encodedQuery = encodeURIComponent(searchQuery)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=10&countrycodes=ca`
          console.log('OSM API URL:', url)
          
          const response = await fetch(url)
          console.log('OSM API response status:', response.status)
          
          if (!response.ok) {
            console.log(`HTTP error: ${response.status}`)
            continue
          }
          
          const data = await response.json()
          console.log('OSM API data received:', data)
          
          if (!Array.isArray(data)) {
            console.log('Invalid data format received')
            continue
          }
          
          const areas = data
            .filter((item: any) => {
              // Accept more types of geographic areas
              const validTypes = ['region', 'state', 'administrative', 'city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood']
              const validClasses = ['boundary', 'place', 'amenity']
              
              // Also accept items with high importance (major places)
              const hasHighImportance = item.importance && item.importance > 0.3
              
              return validTypes.includes(item.type) || 
                     validClasses.includes(item.class) || 
                     hasHighImportance
            })
            .map((item: any) => ({
              id: `area_${item.place_id}`,
              name: item.display_name.split(',')[0],
              fullName: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              type: item.type,
              class: item.class
            }))
          
          console.log('Filtered areas for query:', searchQuery, areas)
          allAreas = [...allAreas, ...areas]
          
          // If we found results, we can stop searching
          if (areas.length > 0) {
            console.log('Found results, stopping search')
            break
          }
        } catch (error) {
          console.log(`Search query "${searchQuery}" failed:`, error)
          continue
        }
      }

      // Remove duplicates
      const uniqueAreas = allAreas.filter((area, index, self) => 
        index === self.findIndex(a => a.id === area.id)
      )


      
      console.log('Final areas:', uniqueAreas)
      setAreaSuggestions(uniqueAreas.slice(0, 10))
    } catch (error) {
      console.error('Error searching areas:', error)
      setAreaSuggestions([])
    } finally {
      clearTimeout(timeoutId)
      setIsLoadingAreas(false)
    }
  }, [])

  const searchMunicipalities = useCallback(async (query: string) => {
    if (!selectedArea || query.length < 2) {
      setMunicipalitySuggestions([])
      return
    }

    setIsLoadingMunicipalities(true)
    console.log('🔍 Manual search for municipalities:', query, 'in area:', selectedArea)
    
    try {
      // For Toronto, search within the auto-loaded municipalities
      if (selectedArea.toLowerCase().includes('toronto')) {
        // Get the auto-loaded municipalities and filter them
        const searchQueries = [
          `${query}, Toronto, Ontario, Canada`,
          `${query}, ${selectedArea}, Canada`,
          `${query}, Canada`
        ]

        let allMunicipalities: any[] = []

        for (const searchQuery of searchQueries) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5&countrycodes=ca`
            console.log('Municipality search URL:', url)
            
            const response = await fetch(url)
            if (!response.ok) continue
            
            const data = await response.json()
            if (!Array.isArray(data)) continue
            
            const municipalities = data
              .filter((item: any) => {
                const validTypes = ['suburb', 'neighbourhood', 'city', 'town', 'administrative']
                const validClasses = ['place', 'boundary']
                const hasHighImportance = item.importance && item.importance > 0.1
                
                return validTypes.includes(item.type) || 
                       validClasses.includes(item.class) || 
                       hasHighImportance
              })
              .map((item: any) => ({
                id: `municipality_${item.place_id}`,
                name: item.display_name.split(',')[0],
                fullName: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                type: item.type,
                class: item.class
              }))
            
            allMunicipalities = [...allMunicipalities, ...municipalities]
            
            if (municipalities.length > 0) {
              console.log('Found municipalities, stopping search')
              break
            }
          } catch (error) {
            console.log(`Municipality search query "${searchQuery}" failed:`, error)
            continue
          }
        }

        // Remove duplicates and sort by name
        const uniqueMunicipalities = allMunicipalities
          .filter((municipality, index, self) => 
            index === self.findIndex(m => m.id === municipality.id)
          )
          .sort((a, b) => a.name.localeCompare(b.name))

        console.log('Manual search results:', uniqueMunicipalities)
        setMunicipalitySuggestions(uniqueMunicipalities.slice(0, 15))
        return
      }

      // For other areas, use the original search logic
      const areaQuery = `${query}, ${selectedArea}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaQuery)}&addressdetails=1&limit=10&countrycodes=ca`
      )
      const data = await response.json()
      
      const municipalities = data
        .filter((item: any) => item.type === 'city' || item.type === 'town')
        .map((item: any) => ({
          id: `municipality_${item.place_id}`,
          name: item.display_name.split(',')[0],
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type
        }))
      
      setMunicipalitySuggestions(municipalities)
    } catch (error) {
      console.error('Error searching municipalities:', error)
      setMunicipalitySuggestions([])
    } finally {
      setIsLoadingMunicipalities(false)
    }
  }, [selectedArea])

  const searchCommunities = useCallback(async (query: string) => {
    if (!selectedMunicipality || query.length < 2) {
      setCommunitySuggestions([])
      return
    }

    setIsLoadingCommunities(true)
    try {
      // Use OSM Nominatim for community/neighbourhood search within the selected municipality
      const communityQuery = `${query}, ${selectedMunicipality}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(communityQuery)}&addressdetails=1&limit=10&featuretype=suburb`
      )
      const data = await response.json()
      
      const communities = data
        .filter((item: any) => item.type === 'suburb' || item.type === 'neighbourhood')
        .map((item: any) => ({
          id: `community_${item.place_id}`,
          name: item.display_name.split(',')[0],
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type
        }))
      
      setCommunitySuggestions(communities)
    } catch (error) {
      console.error('Error searching communities:', error)
      setCommunitySuggestions([])
    } finally {
      setIsLoadingCommunities(false)
    }
  }, [selectedMunicipality])

  const searchMapArts = useCallback(async (query: string) => {
    if (!selectedCommunity || query.length < 2) {
      setMapArtSuggestions([])
      return
    }

    setIsLoadingMapArts(true)
    try {
      // Use OSM Nominatim for MapArt/neighbourhood subdivision search within the selected community
      const mapArtQuery = `${query}, ${selectedCommunity}, ${selectedMunicipality}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapArtQuery)}&addressdetails=1&limit=10&featuretype=neighbourhood`
      )
      const data = await response.json()
      
      const mapArts = data
        .filter((item: any) => item.type === 'neighbourhood' || item.type === 'suburb')
        .map((item: any) => ({
          id: `mapart_${item.place_id}`,
          name: item.display_name.split(',')[0],
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type
        }))
      
      setMapArtSuggestions(mapArts)
    } catch (error) {
      console.error('Error searching MapArts:', error)
      setMapArtSuggestions([])
    } finally {
      setIsLoadingMapArts(false)
    }
  }, [selectedCommunity, selectedMunicipality])

  // Auto-load municipalities when area is selected
  const loadMunicipalitiesForArea = useCallback(async (areaName: string) => {
    if (!areaName) {
      setMunicipalitySuggestions([])
      return
    }

    setIsLoadingMunicipalities(true)
    console.log('🔄 Auto-loading municipalities for area:', areaName)
    
    try {
      // For Toronto, use specific community searches
      if (areaName.toLowerCase().includes('toronto')) {
        const torontoCommunities = [
          'Downtown Toronto', 'North York', 'Scarborough', 'Etobicoke', 'East York', 'York',
          'Rexdale', 'Malvern', 'Guildwood', 'Downsview', 'Jane and Finch', 'Islington',
          'Centennial Park', 'Royal Ontario Museum', 'Scarborough Bluffs', 'Union',
          'Toronto Zoo', 'East York', 'Weston', 'Parkdale', 'High Park', 'The Beaches',
          'Leslieville', 'Cabbagetown', 'Chinatown', 'Kensington Market', 'Queen West',
          'King West', 'Entertainment District', 'Financial District', 'Harbourfront',
          'Distillery District', 'St. Lawrence Market', 'Old Toronto', 'Midtown',
          'Yonge and Eglinton', 'Davisville', 'Leaside', 'Thornhill', 'Markham',
          'Richmond Hill', 'Vaughan', 'Mississauga', 'Brampton', 'Pickering',
          'Ajax', 'Whitby', 'Oshawa'
        ]

        // Search for each community
        let allMunicipalities: any[] = []
        
        for (const community of torontoCommunities.slice(0, 20)) { // Limit to first 20 for performance
          try {
            const searchQuery = `${community}, Toronto, Ontario, Canada`
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=3&countrycodes=ca`
            
            const response = await fetch(url)
            if (!response.ok) continue
            
            const data = await response.json()
            if (!Array.isArray(data)) continue
            
            const municipalities = data
              .filter((item: any) => {
                const validTypes = ['suburb', 'neighbourhood', 'city', 'town', 'administrative']
                const validClasses = ['place', 'boundary']
                const hasHighImportance = item.importance && item.importance > 0.1
                
                return validTypes.includes(item.type) || 
                       validClasses.includes(item.class) || 
                       hasHighImportance
              })
              .map((item: any) => ({
                id: `municipality_${item.place_id}`,
                name: item.display_name.split(',')[0],
                fullName: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                type: item.type,
                class: item.class
              }))
            
            allMunicipalities = [...allMunicipalities, ...municipalities]
          } catch (error) {
            console.log(`Community search "${community}" failed:`, error)
            continue
          }
        }

        // Remove duplicates and sort by name
        const uniqueMunicipalities = allMunicipalities
          .filter((municipality, index, self) => 
            index === self.findIndex(m => m.id === municipality.id)
          )
          .sort((a, b) => a.name.localeCompare(b.name))

        console.log('Auto-loaded Toronto municipalities:', uniqueMunicipalities)
        const finalMunicipalities = uniqueMunicipalities.slice(0, 25)
        setMunicipalitySuggestions(finalMunicipalities)
        setCachedMunicipalities(finalMunicipalities) // Cache the results
        return
      }

      // For other areas, use the original search logic
      const searchQueries = [
        `municipalities in ${areaName}, Canada`,
        `cities in ${areaName}, Canada`,
        `${areaName}, Canada`,
        `municipalities ${areaName}`,
        `cities ${areaName}`
      ]

      let allMunicipalities: any[] = []

      for (const searchQuery of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=10&countrycodes=ca`
          console.log('Municipality search URL:', url)
          
          const response = await fetch(url)
          if (!response.ok) continue
          
          const data = await response.json()
          if (!Array.isArray(data)) continue
          
          const municipalities = data
            .filter((item: any) => {
              const validTypes = ['city', 'town', 'municipality', 'administrative', 'suburb']
              const validClasses = ['place', 'boundary']
              const hasHighImportance = item.importance && item.importance > 0.2
              
              return validTypes.includes(item.type) || 
                     validClasses.includes(item.class) || 
                     hasHighImportance
            })
            .map((item: any) => ({
              id: `municipality_${item.place_id}`,
              name: item.display_name.split(',')[0],
              fullName: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              type: item.type,
              class: item.class
            }))
          
          allMunicipalities = [...allMunicipalities, ...municipalities]
          
          if (municipalities.length > 0) {
            console.log('Found municipalities, stopping search')
            break
          }
        } catch (error) {
          console.log(`Municipality search query "${searchQuery}" failed:`, error)
          continue
        }
      }

      // Remove duplicates
      const uniqueMunicipalities = allMunicipalities.filter((municipality, index, self) => 
        index === self.findIndex(m => m.id === municipality.id)
      )

      console.log('Auto-loaded municipalities:', uniqueMunicipalities)
      setMunicipalitySuggestions(uniqueMunicipalities.slice(0, 15))
    } catch (error) {
      console.error('Error auto-loading municipalities:', error)
      setMunicipalitySuggestions([])
    } finally {
      setIsLoadingMunicipalities(false)
    }
  }, [])

  // Auto-load communities when municipality is selected
  const loadCommunitiesForMunicipality = useCallback(async (municipalityName: string, areaName: string) => {
    if (!municipalityName || !areaName) {
      setCommunitySuggestions([])
      return
    }

    setIsLoadingCommunities(true)
    console.log('🔄 Auto-loading communities for municipality:', municipalityName, 'in area:', areaName)
    
    try {
      // Search for communities within the selected municipality
      const searchQueries = [
        `communities in ${municipalityName}, ${areaName}, Canada`,
        `neighbourhoods in ${municipalityName}, ${areaName}, Canada`,
        `${municipalityName}, ${areaName}, Canada`,
        `communities ${municipalityName}`,
        `neighbourhoods ${municipalityName}`
      ]

      let allCommunities: any[] = []

      for (const searchQuery of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=10&countrycodes=ca`
          console.log('Community search URL:', url)
          
          const response = await fetch(url)
          if (!response.ok) continue
          
          const data = await response.json()
          if (!Array.isArray(data)) continue
          
          const communities = data
            .filter((item: any) => {
              const validTypes = ['suburb', 'neighbourhood', 'quarter', 'administrative']
              const validClasses = ['place', 'boundary']
              const hasHighImportance = item.importance && item.importance > 0.1
              
              return validTypes.includes(item.type) || 
                     validClasses.includes(item.class) || 
                     hasHighImportance
            })
            .map((item: any) => ({
              id: `community_${item.place_id}`,
              name: item.display_name.split(',')[0],
              fullName: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              type: item.type,
              class: item.class
            }))
          
          allCommunities = [...allCommunities, ...communities]
          
          if (communities.length > 0) {
            console.log('Found communities, stopping search')
            break
          }
        } catch (error) {
          console.log(`Community search query "${searchQuery}" failed:`, error)
          continue
        }
      }

      // Remove duplicates and sort by name
      const uniqueCommunities = allCommunities
        .filter((community, index, self) => 
          index === self.findIndex(c => c.id === community.id)
        )
        .sort((a, b) => a.name.localeCompare(b.name))

      console.log('Auto-loaded communities:', uniqueCommunities)
      const finalCommunities = uniqueCommunities.slice(0, 20)
      setCommunitySuggestions(finalCommunities)
      setCachedCommunities(finalCommunities) // Cache the results
    } catch (error) {
      console.error('Error auto-loading communities:', error)
      setCommunitySuggestions([])
    } finally {
      setIsLoadingCommunities(false)
    }
  }, [])







  // Auto-load residential streets at Community level using Overpass API
  const loadStreetsForCommunity = useCallback(async (communityName: string, municipalityName: string, areaName: string) => {
    if (!communityName || !municipalityName || !areaName) {
      setStreetSuggestions([])
      return
    }

    setIsLoadingStreets(true)
    console.log('🔄 Overpass API: Auto-loading residential streets for community:', communityName, 'in municipality:', municipalityName, 'area:', areaName)
    
    try {
      // Primary: Use Overpass API to get residential streets
      const overpassStreets = await overpassService.fetchResidentialStreets(communityName, municipalityName, areaName)
      
      if (overpassStreets.length > 0) {
        // Convert OverpassStreet format to Google Places format for consistency
        const formattedStreets = overpassStreets.map(street => ({
          place_id: `overpass_${street.id}`,
          description: `${street.name}, ${communityName}, ${municipalityName}, ${areaName}, Canada`,
          structured_formatting: {
            main_text: street.name,
            secondary_text: `${communityName}, ${municipalityName}`
          },
          lat: street.lat,
          lng: street.lng,
          type: street.type
        }))
        
        console.log(`✅ Overpass API found ${formattedStreets.length} residential streets`)
        setStreetSuggestions(formattedStreets)
        setCachedStreets(formattedStreets)
        setShowStreetSuggestions(true) // Show the suggestions dropdown
        return
      }

      // Fallback 1: Google Places API if Overpass fails
      if (autocompleteService) {
        console.log('🔄 Overpass API failed, trying Google Places API...')
        
        try {
          const googleRequest = {
            input: `residential streets in ${communityName} ${municipalityName}`,
            types: ['route'],
            componentRestrictions: { country: 'ca' },
            location: new google.maps.LatLng(43.7266659, -79.4820065), // Downsview center
            radius: 5000 // 5km radius
          }
          
          const googleResults = await new Promise<any[]>((resolve, reject) => {
            autocompleteService.getPlacePredictions(googleRequest, (predictions: any[], status: any) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions)
              } else {
                resolve([])
              }
            })
          })
          
          const googleStreets = googleResults
            .filter(prediction => prediction.description.toLowerCase().includes('toronto'))
            .slice(0, 20)
          
          if (googleStreets.length > 0) {
            setStreetSuggestions(googleStreets)
            setCachedStreets(googleStreets)
            setShowStreetSuggestions(true) // Show the suggestions dropdown
            console.log(`✅ Google Places fallback found ${googleStreets.length} streets`)
            return
          }
        } catch (error) {
          console.error('Google Places fallback failed:', error)
        }
      }

      // Fallback 2: Known Streets for Downsview area
      console.log('🔄 All APIs failed, using known streets fallback...')
      const knownDownsviewStreets = [
        'Wilson Avenue', 'Keele Street', 'Jane Street', 'Bathurst Street',
        'Allen Road', 'Dufferin Street', 'Carl Hall Road', 'Sheppard Avenue West',
        'Wilson Heights Boulevard', 'Vitti Street', 'Billy Bishop Way'
      ].map(street => ({
        place_id: `fallback_${street.replace(/\s+/g, '_').toLowerCase()}`,
        description: `${street}, ${communityName}, ${municipalityName}, ${areaName}, Canada`,
        structured_formatting: {
          main_text: street,
          secondary_text: `${communityName}, ${municipalityName}`
        }
      }))
      
      setStreetSuggestions(knownDownsviewStreets)
      setCachedStreets(knownDownsviewStreets)
      setShowStreetSuggestions(true) // Show the suggestions dropdown
      console.log(`✅ Known streets fallback found ${knownDownsviewStreets.length} streets`)
      
    } catch (error) {
      console.error('Error auto-loading residential streets at community level:', error)
      setStreetSuggestions([])
    } finally {
      setIsLoadingStreets(false)
    }
  }, [])

  // Function to get community bounding box dynamically from OSM
  const getCommunityBoundingBox = useCallback(async (communityName: string): Promise<number[]> => {
    console.log('🗺️ Fetching dynamic bounding box for community:', communityName)
    
    try {
      // Try multiple OSM queries to find the community boundary
      const queries = [
        // Query 1: Try neighbourhood boundary
        `
          [out:json][timeout:15];
          area["name"="${communityName}"]["boundary"="neighbourhood"]->.searchArea;
          way(area.searchArea);
          out geom;
        `,
        // Query 2: Try suburb boundary
        `
          [out:json][timeout:15];
          area["name"="${communityName}"]["place"="suburb"]->.searchArea;
          way(area.searchArea);
          out geom;
        `,
        // Query 3: Try administrative boundary
        `
          [out:json][timeout:15];
          area["name"="${communityName}"]["admin_level"="10"]->.searchArea;
          way(area.searchArea);
          out geom;
        `,
        // Query 4: Try any area with the name
        `
          [out:json][timeout:15];
          area["name"="${communityName}"]->.searchArea;
          way(area.searchArea);
          out geom;
        `
      ]
      
      for (let i = 0; i < queries.length; i++) {
        try {
          console.log(`🔍 Trying OSM query ${i + 1} for ${communityName}`)
          
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(queries[i])}`,
            signal: AbortSignal.timeout(20000)
          })
          
          if (response.ok) {
            const data = await response.json()
            
            if (data.elements && data.elements.length > 0) {
              // Calculate bounding box from community geometry
              const allPoints: any[] = []
              data.elements.forEach((element: any) => {
                if (element.geometry) {
                  element.geometry.forEach((point: any) => {
                    allPoints.push([point.lat, point.lon])
                  })
                }
              })
              
              if (allPoints.length > 0) {
                const lats = allPoints.map(p => p[0])
                const lons = allPoints.map(p => p[1])
                const bbox = [
                  Math.min(...lats), // south
                  Math.min(...lons), // west
                  Math.max(...lats), // north
                  Math.max(...lons)  // east
                ]
                
                // Add some padding to the bounding box
                const padding = 0.01 // ~1km padding
                bbox[0] -= padding // south
                bbox[1] -= padding // west
                bbox[2] += padding // north
                bbox[3] += padding // east
                
                console.log(`✅ Dynamic bounding box for ${communityName} (query ${i + 1}):`, bbox)
                return bbox
              }
            }
          }
        } catch (error) {
          console.log(`❌ Query ${i + 1} failed for ${communityName}:`, error)
          continue
        }
      }
      
      // If all queries fail, throw an error instead of using static fallbacks
      throw new Error(`Could not find bounding box for community: ${communityName}`)
      
    } catch (error) {
      console.error(`❌ Failed to fetch dynamic bounding box for ${communityName}:`, error)
      throw error // Re-throw to handle in the calling function
    }
  }, [])

  // Overpass API function to get residential buildings along a street with rate limiting
  const getBuildingsAlongStreet = useCallback(async (streetName: string, bufferDistance: number = 100): Promise<any[]> => {
    console.log('🏠 Overpass API: Fetching residential buildings along street:', streetName, 'with buffer:', bufferDistance, 'm')
    
    // Get dynamic bounding box for the selected community
    let communityBbox: number[]
    try {
      communityBbox = await getCommunityBoundingBox(selectedCommunity || 'Centennial Park')
      console.log('🗺️ Using dynamic bounding box for', selectedCommunity, ':', communityBbox)
      console.log('🗺️ Bounding box format: [south, west, north, east]')
    } catch (error) {
      console.error('❌ Failed to get dynamic bounding box, cannot proceed with building detection')
      return []
    }
    
    try {
      // Use the improved Overpass service with rate limiting
      const { overpassService } = await import('@/lib/overpassService')
      
      // Update progress for user feedback
      setDetectionProgress(`Fetching buildings from OpenStreetMap for ${streetName}...`)
      
      const buildings = await overpassService.fetchBuildingsAlongStreet(streetName, communityBbox)
      
      if (buildings.length > 0) {
        console.log(`✅ Found ${buildings.length} residential buildings along ${streetName}`)
        console.log('📍 Sample building coordinates:', buildings.slice(0, 3).map((b: any) => ({ lat: b.lat, lng: b.lng, address: b.street })))
        setDetectionProgress(`Found ${buildings.length} buildings on ${streetName}`)
        return buildings
      } else {
        console.log(`❌ No buildings found for street: ${streetName}`)
        setDetectionProgress(`No buildings found on ${streetName} - trying alternative methods...`)
        return []
      }
    } catch (error) {
      console.error('❌ Overpass API error:', error)
      setDetectionProgress(`OpenStreetMap API failed for ${streetName} - using fallback methods...`)
      
      // Fallback: Return empty array and let other detection methods handle it
      return []
    }
  }, [selectedCommunity, getCommunityBoundingBox, setDetectionProgress])

  // Initialize Overpass service and test endpoints on component mount
  useEffect(() => {
    const initializeOverpassService = async () => {
      try {
        const { overpassService } = await import('@/lib/overpassService')
        console.log('🔧 Initializing Overpass service...')
        
        // Test endpoints and get working ones
        const workingEndpoints = await overpassService.testEndpoints()
        console.log(`✅ Overpass service initialized with ${workingEndpoints.length} working endpoints`)
        
        // Log current configuration
        const config = overpassService.getConfig()
        console.log('🔧 Current Overpass configuration:', config)
        
      } catch (error) {
        console.error('❌ Failed to initialize Overpass service:', error)
      }
    };

    initializeOverpassService();
  }, []);

  // Search streets within community hierarchy
  const searchStreetsInCommunity = useCallback(async (query: string, community: string, municipality: string, area: string) => {
    if (!query || query.length < 1) {
      setStreetSuggestions([])
      return
    }

    setIsLoadingStreets(true)
    console.log('🔍 Searching streets in community hierarchy:', query, 'within Community:', community, 'Municipality:', municipality, 'Area:', area)
    
    try {
      // Search for residential streets within the community
      const searchQueries = [
        `${query} residential streets in ${community}, ${municipality}, ${area}, Canada`,
        `${query} streets in ${community}, ${municipality}, ${area}, Canada`,
        `${query} roads in ${community}, ${municipality}, ${area}, Canada`
      ]

      let allStreets: any[] = []

      for (const searchQuery of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=15&countrycodes=ca`
          console.log('Community street search URL:', url)
          
          const response = await fetch(url)
          if (!response.ok) continue
          
          const data = await response.json()
          if (!Array.isArray(data)) continue
          
          const streets = data
            .filter((item: any) => {
              const validTypes = ['residential', 'road', 'street', 'avenue', 'court', 'crescent', 'drive', 'lane', 'place', 'way']
              const validClasses = ['highway', 'place']
              const hasHighImportance = item.importance && item.importance > 0.05
              const isResidential = item.type === 'residential' || 
                                   (item.address && item.address.road && 
                                    !item.address.road.toLowerCase().includes('highway') &&
                                    !item.address.road.toLowerCase().includes('freeway'))
              
              return (validTypes.includes(item.type) || 
                     validClasses.includes(item.class) || 
                     hasHighImportance) && isResidential
            })
            .map((item: any) => ({
              place_id: item.place_id,
              description: item.display_name,
              structured_formatting: {
                main_text: item.display_name.split(',')[0],
                secondary_text: `${community}, ${municipality}`
              },
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              type: item.type,
              class: item.class
            }))
          
          allStreets = [...allStreets, ...streets]
          
          if (streets.length > 0) {
            console.log('Found streets in community, stopping search')
            break
          }
        } catch (error) {
          console.log(`Community street search query "${searchQuery}" failed:`, error)
          continue
        }
      }

      // Remove duplicates and sort by name
      const uniqueStreets = allStreets
        .filter((street, index, self) => 
          index === self.findIndex(s => s.place_id === street.place_id)
        )
        .sort((a, b) => a.structured_formatting.main_text.localeCompare(b.structured_formatting.main_text))

      console.log('Community street search results:', uniqueStreets)
      setStreetSuggestions(uniqueStreets.slice(0, 20))
    } catch (error) {
      console.error('Error searching streets in community:', error)
      setStreetSuggestions([])
    } finally {
      setIsLoadingStreets(false)
    }
  }, [])

  // Geographic selection handlers
  const handleAreaSelect = useCallback((area: any) => {
    console.log('🎯 Area selected:', area.name)
    
    // Clear any pending search timeout
    if (window.areaSearchTimeout) {
      clearTimeout(window.areaSearchTimeout)
      window.areaSearchTimeout = undefined
    }
    
    // Set flag to prevent onChange from triggering search
    setIsSettingAreaProgrammatically(true)
    
    // Set the selected area and clear suggestions to close dropdown
    setSelectedArea(area.name)
    setAreaInputValue(area.name)
    setAreaSuggestions([]) // This closes the dropdown
    
    // Clear dependent selections
    setSelectedMunicipality("")
    setMunicipalityInputValue("")
    setMunicipalitySuggestions([])
    setCachedMunicipalities([]) // Clear the cache when area changes
    setSelectedCommunity("")
    setCommunityInputValue("")
    setCommunitySuggestions([])
    
    // Auto-load municipalities for the selected area
    console.log('🔄 Auto-loading municipalities for area:', area.name)
    loadMunicipalitiesForArea(area.name)
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsSettingAreaProgrammatically(false)
    }, 100)
  }, [loadMunicipalitiesForArea])

  const handleMunicipalitySelect = useCallback((municipality: any) => {
    console.log('🎯 Municipality selected:', municipality.name)
    console.log('🎯 Municipality details:', municipality)
    
    setSelectedMunicipality(municipality.name)
    setMunicipalityInputValue(municipality.name)
    setMunicipalitySuggestions([])
    
    // Clear dependent selections
    setSelectedCommunity("")
    setCommunityInputValue("")
    setCommunitySuggestions([])
    setCachedCommunities([]) // Clear the community cache when municipality changes
    
    // Auto-load communities for the selected municipality
    console.log('🔄 Auto-loading communities for municipality:', municipality.name, 'in area:', selectedArea)
    loadCommunitiesForMunicipality(municipality.name, selectedArea)
    
    // Force update the geographic hierarchy status
    setTimeout(() => {
      console.log('🗺️ Updated Geographic Hierarchy:')
      console.log('  - Area:', selectedArea)
      console.log('  - Municipality:', municipality.name)
      console.log('  - Community:', selectedCommunity)
    }, 100)
  }, [selectedArea, loadCommunitiesForMunicipality, selectedCommunity])

  const handleCommunitySelect = useCallback((community: any) => {
    console.log('🎯 Community selected:', community.name)
    console.log('🎯 Community details:', community)
    
    setSelectedCommunity(community.name)
    setCommunityInputValue(community.name)
    setCommunitySuggestions([])
    
    // Auto-load streets directly for the selected community
    console.log('🔄 Auto-loading streets for community:', community.name, 'in municipality:', selectedMunicipality, 'area:', selectedArea)
    loadStreetsForCommunity(community.name, selectedMunicipality, selectedArea)
    
    // Force update the geographic hierarchy status
    setTimeout(() => {
      console.log('🗺️ Final Geographic Hierarchy:')
      console.log('  - Area:', selectedArea)
      console.log('  - Municipality:', selectedMunicipality)
      console.log('  - Community:', community.name)
    }, 100)
  }, [selectedMunicipality, selectedArea, loadStreetsForCommunity])



  // Geographic hierarchy validation
  const validateGeographicHierarchy = useCallback(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if required levels are selected
    if (!selectedArea) {
      errors.push('Area/Region is required')
    }
    if (!selectedMunicipality) {
      errors.push('Municipality/City is required')
    }
    if (!selectedCommunity) {
      warnings.push('Community/Neighbourhood is recommended for better accuracy')
    }

    // Since data is selected through cascading hierarchy, trust the user's selection
    // The OSM API calls ensure geographic accuracy at each level
    if (selectedArea && selectedMunicipality) {
      console.log('✅ Geographic hierarchy validation passed - data selected through cascading API calls')
      // No false warnings - if OSM API returned it, it's geographically valid
    }

    return { errors, warnings }
  }, [selectedArea, selectedMunicipality, selectedCommunity])

  // Geographic boundary validation using Google Geocoding API
  const validateGeographicContainment = useCallback(async (lat: number, lng: number, level: string) => {
    if (!geocoder) return true

    try {
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
            resolve(results[0])
              } else {
            reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          })

      const addressComponents = result.address_components
      const formattedAddress = result.formatted_address

      switch (level) {
        case 'area':
          return addressComponents.some((comp: any) => 
            comp.types.includes('administrative_area_level_1') && 
            comp.long_name.toLowerCase().includes(selectedArea.toLowerCase())
          )
        case 'municipality':
          return addressComponents.some((comp: any) => 
            comp.types.includes('locality') && 
            comp.long_name.toLowerCase().includes(selectedMunicipality.toLowerCase())
          )
        case 'community':
          return addressComponents.some((comp: any) => 
            comp.types.includes('sublocality') && 
            comp.long_name.toLowerCase().includes(selectedCommunity.toLowerCase())
          )

        default:
          return true
          }
        } catch (error) {
      console.error('Geographic containment validation failed:', error)
      return true // Allow if validation fails
    }
  }, [geocoder, selectedArea, selectedMunicipality, selectedCommunity])

  // Helper function for geocoding locations
  const geocodeLocation = useCallback(async (query: string) => {
    if (!geocoder) return null

    try {
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: query }, (results: any, status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
            resolve(results[0])
          } else {
            reject(new Error(`Geocoding failed: ${status}`))
          }
        })
      })

      return {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
      return null
    }
  }, [geocoder])





  // Search streets
  const searchStreets = useCallback(async (query: string) => {
    console.log('searchStreets called with:', query)
    console.log('Geographic context:', { selectedArea, selectedMunicipality, selectedCommunity })
    
    if (!query.trim()) {
      console.log('Search conditions not met - query:', query)
      // If we have existing suggestions, show them all
      if (streetSuggestions.length > 0) {
        setShowStreetSuggestions(true)
      } else {
        setStreetSuggestions([])
        setShowStreetSuggestions(false)
      }
      return
    }

    // If we already have streets loaded, filter them
    if (streetSuggestions.length > 0) {
      console.log('Filtering existing streets for query:', query)
      const filtered = streetSuggestions.filter(suggestion => 
        suggestion.structured_formatting.main_text.toLowerCase().includes(query.toLowerCase())
      )
      console.log('Filtered streets:', filtered)
      setStreetSuggestions(filtered)
      setShowStreetSuggestions(filtered.length > 0)
      return
    }

    // If no existing suggestions, make API call
    setIsLoadingStreets(true)
    try {
      if (selectedMunicipality) {
        const municipalityName = selectedMunicipality.split(',')[0].trim()
        const areaContext = selectedArea ? `${selectedArea}, ` : ''
        const communityContext = selectedCommunity ? `${selectedCommunity}, ` : ''
        
        console.log('Geographic context for street search:', { municipalityName, areaContext, communityContext })
        
        // Try to get streets using the municipality name with geographic context
        const searchContext = `${query} ${communityContext}${municipalityName}`
        console.log('Search context:', searchContext)
        
        // Use Google Places API for street search with geographic context
        await searchStreetsGoogle(searchContext)
        } else {
          // Fallback to Google Places API
        console.log('No municipality selected, using Google Places API')
        await searchStreetsGoogle(query)
      }

    } catch (error) {
      console.error('Error searching streets:', error)
      // Fallback to Google Places API
      console.log('Search error, using Google Places API')
      await searchStreetsGoogle(query)
    } finally {
      setIsLoadingStreets(false)
    }
  }, [selectedArea, selectedMunicipality, selectedCommunity, streetSuggestions])

  // Fallback to Google Places API for street search
  const searchStreetsGoogle = useCallback(async (query: string) => {
    console.log('🔍 searchStreetsGoogle called with:', query)
    
    if (!autocompleteService || query.length < 2) {
      console.log('Google search conditions not met - autocompleteService:', !!autocompleteService, 'query length:', query.length)
      setStreetSuggestions([])
      setShowStreetSuggestions(false)
      return
    }

    try {
      // Use a simpler search approach - just search for the street name
      const request = {
        input: query,
        types: ['route'],
        componentRestrictions: { country: 'ca' }
      }
      
      console.log('Making Google request:', request)

      autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
        console.log('Google search response - status:', status, 'predictions:', predictions?.length)
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filter and clean up predictions to ensure we have readable names
          const cleanedPredictions = predictions
            .filter(prediction => {
              // Ensure we have a readable name
              const name = prediction.structured_formatting?.main_text || prediction.description
              return name && name.length > 0 && !name.includes('EiFSAWRIYXUg') // Filter out encoded strings
            })
            .map(prediction => {
              // Ensure we have a proper name
              if (!prediction.structured_formatting?.main_text) {
                // If no structured formatting, try to extract a clean name from description
                const description = prediction.description
                const cleanName = description.split(',')[0] // Take first part before comma
                return {
                  ...prediction,
                  structured_formatting: {
                    main_text: cleanName,
                    secondary_text: prediction.description
                  }
                }
              }
              return prediction
            })
            .slice(0, 30) // Limit to 30 results
          
          setStreetSuggestions(cleanedPredictions)
          setShowStreetSuggestions(true)
          setNoStreetsFound(false)
          console.log('Setting Google street suggestions:', cleanedPredictions)
        } else {
          setStreetSuggestions([])
          setShowStreetSuggestions(false)
          setNoStreetsFound(true)
          console.log('No Google predictions found or error status')
        }
      })
      
    } catch (error) {
      console.error('Error in Google street search:', error)
      setStreetSuggestions([])
      setShowStreetSuggestions(false)
      setNoStreetsFound(true)
    }
  }, [autocompleteService])







  // Auto-load streets when municipality is selected
  const loadStreetsForNeighbourhood = useCallback(async (municipalityName: string) => {
    if (!selectedMunicipality) return

    setIsLoadingStreets(true)
    try {
      console.log('🔄 Auto-loading streets for municipality:', municipalityName)
      
      // Build geographic context for street search
      const areaContext = selectedArea ? `${selectedArea}, ` : ''
      const communityContext = selectedCommunity ? `${selectedCommunity}, ` : ''
      
      console.log('Geographic context for street search:', { areaContext, communityContext })

      // Use Google Places API for street search with geographic context
        if (autocompleteService) {
        const searchQuery = `${communityContext}${municipalityName} streets`
        console.log('Search query:', searchQuery)
        
          const request = {
          input: searchQuery,
            types: ['route'],
            componentRestrictions: { country: 'ca' }
          }
          
          autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const cleanedPredictions = predictions
                .filter(prediction => {
                  const name = prediction.structured_formatting?.main_text || prediction.description
                  return name && name.length > 0 && !name.includes('EiFSAWRIYXUg')
                })
                .map(prediction => {
                  if (!prediction.structured_formatting?.main_text) {
                    const description = prediction.description
                    const cleanName = description.split(',')[0]
                    return {
                      ...prediction,
                      structured_formatting: {
                        main_text: cleanName,
                        secondary_text: prediction.description
                      }
                    }
                  }
                  return prediction
                })
                .slice(0, 30)
              
            console.log('Auto-loaded streets:', cleanedPredictions)
              setStreetSuggestions(cleanedPredictions)
              setShowStreetSuggestions(true)
            } else {
            console.log('Google Places API failed:', status)
              setStreetSuggestions([])
              setShowStreetSuggestions(false)
            }
          })
        } else {
        console.log('No autocomplete service available')
          setStreetSuggestions([])
          setShowStreetSuggestions(false)
      }

    } catch (error) {
      console.error('Error auto-loading streets:', error)
      setStreetSuggestions([])
      setShowStreetSuggestions(false)
    } finally {
      setIsLoadingStreets(false)
    }
  }, [selectedArea, selectedMunicipality, selectedCommunity, autocompleteService])

  // Close all dropdowns and panels
  const closeAllDropdowns = () => {
    setShowStreetSuggestions(false)
    setShowResultsPanel(false)
  }

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if click is outside any dropdown container
      const isOutsideStreetDropdown = !target.closest('[data-dropdown="street"]')
      
      if (isOutsideStreetDropdown) {
        setShowStreetSuggestions(false)
      }
        setShowResultsPanel(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])






  // Handle street selection
  const handleStreetSelect = (street: PlaceSuggestion) => {
    // Replace the current selection with the new street (only one street allowed)
    setSelectedStreets([street.place_id])
    
    // Reset building detection data and polygon when selecting a new street
    // This prevents conflicts with save territory zone overlap validation
    console.log('🔄 Street selected, resetting building detection data...')
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setTerritoryArea(0)
    setBuildingDensity(0)
    setDetectionProgress('')
    setApiCallCount(0)
    
    // Reset form step to 1 if we were on step 2
    if (formStep === 2) {
      setFormStep(1)
    }
    
    // Inform user that data has been reset
    toast.info('🔄 Street selected. Building detection data has been reset. Please run "Detect Residents" again.')
    setShowStreetSuggestions(false)
    setStreetInputValue("") // Clear input after selection
  }

  // Get readable street name from place ID
  const getStreetName = useCallback(async (placeId: string): Promise<string> => {
    if (!placesService) return placeId

    try {
      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address']
      }

      const result = await new Promise<any>((resolve, reject) => {
        placesService.getDetails(request, (result: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result)
          } else {
            reject(new Error(`Place details failed: ${status}`))
          }
        })
      })

      // Return the best available name
      return result.name || result.formatted_address || placeId
    } catch (error) {
      console.error('Error getting street name:', error)
      return placeId
    }
  }, [placesService])

  // Remove street from selection
  const removeStreet = (placeId: string) => {
    setSelectedStreets(prev => prev.filter(id => id !== placeId))
    
    // Reset building detection data and polygon when removing a street
    // This prevents conflicts with save territory zone overlap validation
    console.log('🔄 Street removed, resetting building detection data...')
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setTerritoryArea(0)
    setBuildingDensity(0)
    setDetectionProgress('')
    setApiCallCount(0)
    
    // Reset form step to 1 if we were on step 2
    if (formStep === 2) {
      setFormStep(1)
    }
    
    // Inform user that data has been reset
    toast.info('🔄 Street removed. Building detection data has been reset. Please run "Detect Residents" again.')
  }

  // Turf.js utility functions for accurate geographic calculations
  const calculateTerritoryArea = useCallback((polygon: any): number => {
    if (!polygon || polygon.length < 3) {
      console.warn('⚠️ Invalid polygon for area calculation')
      return 0
    }

    try {
      // Ensure polygon is closed (first and last points are the same)
      const closedPolygon = [...polygon]
      if (closedPolygon[0][0] !== closedPolygon[closedPolygon.length - 1][0] || 
          closedPolygon[0][1] !== closedPolygon[closedPolygon.length - 1][1]) {
        closedPolygon.push(closedPolygon[0])
      }

      // Create GeoJSON polygon with [lng, lat] format
      const geoJsonPolygon = turf.polygon([closedPolygon])
      const area = turf.area(geoJsonPolygon) // Returns area in square meters
      
      console.log(`📊 Turf.js area calculation: ${area} sq meters = ${(area / 10000).toFixed(2)} hectares`)
      return area
    } catch (error) {
      console.error('❌ Error calculating area with Turf.js:', error)
      return 0
    }
  }, [])

  const isResidentialAddress = useCallback((lat: number, lng: number, polygon: any): boolean => {
    if (!polygon || polygon.length < 3) {
      console.warn('⚠️ No valid territory polygon for geospatial validation')
      return true // Allow if no polygon yet
    }

    try {
      // Create point in [lng, lat] format for Turf.js
      const point = turf.point([lng, lat])
      
      // Ensure polygon is closed
      const closedPolygon = [...polygon]
      if (closedPolygon[0][0] !== closedPolygon[closedPolygon.length - 1][0] || 
          closedPolygon[0][1] !== closedPolygon[closedPolygon.length - 1][1]) {
        closedPolygon.push(closedPolygon[0])
      }

      // Create GeoJSON polygon
      const geoJsonPolygon = turf.polygon([closedPolygon])
      
      // Use Turf.js for accurate point-in-polygon test
      const isInside = turf.booleanPointInPolygon(point, geoJsonPolygon)
      
      console.log(`📍 Turf.js geospatial check: (${lat}, ${lng}) inside polygon: ${isInside}`)
      return isInside
    } catch (error) {
      console.error('❌ Error in point-in-polygon check:', error)
      return true // Allow if error
    }
  }, [])

  const generateEnhancedPolygon = useCallback((residents: DetectedResident[]): any => {
    if (residents.length === 0) return null

    try {
      // Create points array for Turf.js
      const points = residents.map(resident => 
        turf.point([resident.lng, resident.lat])
      )

      // Create a feature collection
      const pointsCollection = turf.featureCollection(points)
      
      // Calculate bounding box
      const bbox = turf.bbox(pointsCollection)
      
      // Create a polygon from the bounding box with some padding
      const padding = 0.001 // ~100m padding
      const bufferedBbox = [
        [bbox[0] - padding, bbox[1] - padding], // SW
        [bbox[2] + padding, bbox[1] - padding], // SE
        [bbox[2] + padding, bbox[3] + padding], // NE
        [bbox[0] - padding, bbox[3] + padding], // NW
        [bbox[0] - padding, bbox[1] - padding]  // Close polygon
      ]

      console.log(`🗺️ Generated enhanced polygon with ${bufferedBbox.length} points`)
      return bufferedBbox
    } catch (error) {
      console.error('❌ Error generating enhanced polygon:', error)
      return null
    }
  }, [])

  // Enhanced resident detection with OSM integration and Turf.js
  const detectResidentsFromStreets = useCallback(async () => {
    if (selectedStreets.length === 0) return

    // Validate geographic hierarchy first
    const hierarchyValidation = validateGeographicHierarchy()
    if (hierarchyValidation.errors.length > 0) {
      toast.error(`Geographic validation failed: ${hierarchyValidation.errors.join(', ')}`)
      return
    }

    if (hierarchyValidation.warnings.length > 0) {
      toast.warning(`Geographic warnings: ${hierarchyValidation.warnings.join(', ')}`)
    }

    setIsDetectingResidents(true)
    setDetectedResidents([])
    setApiCallCount(0)
    toast.info('🚀 Starting enhanced OSM-based resident detection with geographic hierarchy...')

    try {
      const allResidents: DetectedResident[] = []
      let totalApiCalls = 0

      console.log('🔍 Starting enhanced detection for', selectedStreets.length, 'streets')
      console.log('🗺️ Geographic Hierarchy:', {
        area: selectedArea,
        municipality: selectedMunicipality,
        community: selectedCommunity
      })
      console.log('🧪 Testing Current Settings:', {
        searchRadius,
        maxDistanceFromStreet,
        buildingTypeFilter,
        addressValidationLevel,
        coordinatePrecision
      })

      // Process each selected street
      for (const streetId of selectedStreets) {
        console.log(`📍 Processing street ID: ${streetId}`)
        
        let streetInfo: any = null
        let streetName = ''
        
        if (streetId.startsWith('overpass_')) {
          // Use Overpass API for Overpass streets - get street name from cached data
          console.log('🗺️ Using Overpass API for street:', streetId)
          const overpassStreet = streetSuggestions.find(street => street.place_id === streetId)
          if (overpassStreet) {
            streetName = overpassStreet.structured_formatting.main_text
            console.log('✅ Overpass street name retrieved:', streetName)
            
            // Get buildings directly from Overpass API
            const buildings = await getBuildingsAlongStreet(streetName, searchRadius)
            if (buildings.length > 0) {
              console.log(`🏠 Found ${buildings.length} buildings along ${streetName}`)
              
                             // Convert buildings to resident format with coordinate validation
               const residents = buildings
                 .filter(building => {
                   // Filter out buildings with invalid coordinates
                   const isValidLat = building.lat && building.lat !== 0 && building.lat > -90 && building.lat < 90;
                   const isValidLng = building.lng && building.lng !== 0 && building.lng > -180 && building.lng < 180;
                   return isValidLat && isValidLng;
                 })
                 .map(building => ({
                   id: `overpass_building_${building.id}`,
                   name: `${building.houseNumber} ${building.street}`,
                   address: `${building.houseNumber} ${building.street}`,
                   lat: building.lat,
                   lng: building.lng,
                   type: 'residential',
                   source: 'overpass',
                   confidence: 0.9,
                   validated: true,
                   status: 'active'
                 }))
              
              allResidents.push(...residents)
              console.log(`✅ Added ${residents.length} residents from Overpass API for ${streetName}`)
            }
            continue // Skip the rest of the processing for Overpass streets
          } else {
            console.error('❌ Overpass street not found in cached data:', streetId)
            continue
          }
        } else if (streetId.startsWith('osm_way_')) {
          // Use OSM API for OSM streets
          console.log('🗺️ Using OSM API for street:', streetId)
          try {
            streetInfo = await getOsmStreetInfo(streetId)
            streetName = streetInfo.name
            console.log('✅ OSM street info retrieved:', streetName)
          } catch (error) {
            console.error('❌ OSM street info failed:', error)
            continue
          }
        } else {
          // Use Google Places API for Google streets
          console.log('🌐 Using Google Places API for street:', streetId)
          try {
            const request = {
              placeId: streetId,
              fields: ['geometry', 'formatted_address', 'name', 'address_components']
            }

            const result = await new Promise<any>((resolve, reject) => {
              placesService.getDetails(request, (result: any, status: any) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                  resolve(result)
                } else {
                  reject(new Error(`Place details failed: ${status}`))
                }
              })
            })

            streetInfo = result
            streetName = result.name || result.formatted_address.split(',')[0]
            console.log('✅ Google Places street info retrieved:', streetName)
            totalApiCalls++
          } catch (error) {
            console.error('❌ Google Places street info failed:', error)
            continue
          }
        }

        // Use OSM service for building detection with geographic context
        try {
          // Create bounding box for the street
          const bbox = osmService.createTightBoundingBox(streetInfo, searchRadius)
          
          // Build query with geographic context
          const query = osmService.buildResidentialBuildingQuery({
            bbox,
            buildingTypes: [buildingTypeFilter as ResidentialBuildingType],
            streetName,
            timeout: 30
          })
          
          const osmBuildings = await osmService.fetchOSMBuildings(query)
          const processedBuildings = osmService.processOSMBuildings(osmBuildings, streetName)

          // Apply geographic hierarchy filtering
          const geographicallyFilteredBuildings = processedBuildings.filter(building => {
            // Basic coordinate validation
            if (!building.lat || !building.lng) return false
            
            // Validate against geographic hierarchy if coordinates are available
            if (selectedArea && selectedMunicipality) {
              // Use Turf.js to check if building is within reasonable distance of the selected area
              const buildingPoint = turf.point([building.lng, building.lat])
              
              // Create a bounding box around the selected area (approximate)
              // This is a simplified approach - in production you'd want more precise boundaries
              const areaBounds: [number, number, number, number] = [
                bbox.west - 0.1,  // minLng
                bbox.south - 0.1, // minLat
                bbox.east + 0.1,  // maxLng
                bbox.north + 0.1  // maxLat
              ]
              const areaPolygon = turf.bboxPolygon(areaBounds)
              
              return turf.booleanPointInPolygon(buildingPoint, areaPolygon)
            }
            
            return true
          })

          console.log(`🏢 OSM found ${processedBuildings.length} buildings, ${geographicallyFilteredBuildings.length} after geographic filtering for ${streetName}`)

          // Convert OSM buildings to DetectedResident format
          const streetResidents: DetectedResident[] = geographicallyFilteredBuildings.map((building, index) => ({
            id: `osm_${building.id}_${index}`,
            name: `Resident ${building.id}`,
            address: building.address || `${building.id} ${streetName}`,
            buildingNumber: building.buildingNumber ? parseInt(building.buildingNumber) : undefined,
            lat: building.lat,
            lng: building.lng,
            status: 'not-contacted',
            phone: '',
            email: '',
            notes: `OSM Building: ${building.buildingType || 'residential'}`
          }))

          allResidents.push(...streetResidents)
          console.log(`✅ Street "${streetName}" processed: ${streetResidents.length} residents found`)
          toast.success(`Found ${streetResidents.length} residents on ${streetName}`)
          } catch (error) {
          console.error(`❌ OSM building detection failed for ${streetName}:`, error)
        }
      }

      // Generate polygon from detected residents
      const enhancedPolygon = generateEnhancedPolygon(allResidents)
      setGeneratedPolygon(enhancedPolygon)

      // Calculate area and density using Turf.js
      const area = calculateTerritoryArea(enhancedPolygon || [])
      const density = allResidents.length / (area / 10000 || 1) // Convert to hectares
      
      setTerritoryArea(area)
      setBuildingDensity(density)
      setDetectedResidents(allResidents)
      setApiCallCount(totalApiCalls)
       
      console.log(`🎉 Enhanced detection completed: ${allResidents.length} residents from ${selectedStreets.length} streets`)
      console.log(`📊 Territory stats: Area: ${(area / 10000).toFixed(2)} ha, Density: ${density.toFixed(1)} buildings/ha`)
      console.log(`📊 Final results: ${allResidents.length} validated residents, ${enhancedPolygon?.length || 0} polygon points`)
      console.log(`📊 API Call Statistics: ${totalApiCalls} total API calls made`)
      console.log(`🗺️ Building-based polygon bounds:`, enhancedPolygon)
       
      // Enhanced success toast with detailed stats
      toast.success(`✅ Enhanced detection complete! Found ${allResidents.length} residents across ${selectedStreets.length} streets. Area: ${(area / 10000).toFixed(2)} ha, Density: ${density.toFixed(1)} buildings/ha`)
      
    } catch (error) {
      console.error('❌ Enhanced detection failed:', error)
      toast.error('Error during enhanced resident detection')
    } finally {
      setIsDetectingResidents(false)
    }
  }, [selectedStreets, placesService, searchRadius, maxDistanceFromStreet, buildingTypeFilter, addressValidationLevel, coordinatePrecision, calculateTerritoryArea, generateEnhancedPolygon])

  // Helper function to extract building number from address
  const extractBuildingNumber = (address: string): number => {
    if (!address) return 0
    
    // Try multiple patterns to extract building number
    const patterns = [
      /^(\d+)/, // Start of string: 123 Main St
      /^(\d+)\s/, // Start with number and space: 123 Main St
      /(\d+)\s+[A-Za-z]/, // Number followed by street name: 123 Main St
      /^(\d+)[A-Za-z]/, // Number followed by letter: 123Main St
      /(\d+)\s*[A-Za-z]+\s+[A-Za-z]+/, // Number street type: 123 Main Street
    ]
    
    for (const pattern of patterns) {
      const match = address.match(pattern)
      if (match) {
        const number = parseInt(match[1], 10)
        // Only return valid building numbers (1-9999)
        if (number > 0 && number < 10000) {
          return number
        }
      }
    }
    
    return 0
  }

  // Helper function to extract building number from address components
  const extractBuildingNumberFromComponents = (components: any[]): number => {
    if (!components || !Array.isArray(components)) return 0
    
    // Look for street_number component (most accurate)
    const streetNumber = components.find(comp => 
      comp.types && comp.types.includes('street_number')
    )
    
    if (streetNumber && streetNumber.long_name) {
      const number = parseInt(streetNumber.long_name, 10)
      if (number > 0 && number < 10000) {
        return number
      }
    }
    
    // Fallback: look for subpremise (unit/apartment numbers)
    const subpremise = components.find(comp => 
      comp.types && comp.types.includes('subpremise')
    )
    
    if (subpremise && subpremise.long_name) {
      const number = parseInt(subpremise.long_name, 10)
      if (number > 0 && number < 10000) {
        return number
      }
    }
    
    // Fallback: extract from formatted address
    const formattedAddress = components
      .map(comp => comp.long_name)
      .join(' ')
    
    return extractBuildingNumber(formattedAddress)
  }

  // Enhanced helper functions for advanced detection

  // Get OSM street information
  const getOsmStreetInfo = async (streetId: string) => {
    console.log('🗺️ Fetching OSM street info for:', streetId)
    setApiCallCount(prev => prev + 1)
    setDetectionProgress('Fetching OSM street data...')
    try {
      const wayId = streetId.replace('osm_way_', '')
      const response = await fetch(`https://nominatim.openstreetmap.org/lookup?osm_ids=W${wayId}&format=json&addressdetails=1`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const street = data[0]
        return {
          name: street.display_name.split(',')[0],
          lat: parseFloat(street.lat),
          lon: parseFloat(street.lon),
          address: street.display_name
        }
      }
      throw new Error('No OSM data found')
    } catch (error) {
      console.error('❌ OSM street info failed:', error)
      throw error
    }
  }

  // Enhanced residential building search
  const searchResidentialBuildings = async (streetInfo: any, streetName: string, territoryPolygon?: any): Promise<DetectedResident[]> => {
    console.log('🏠 Starting enhanced residential building search for:', streetName)
    setDetectionProgress(`Searching residential buildings on ${streetName}...`)
    const residents: DetectedResident[] = []
    
    try {
      const center = streetInfo.geometry?.location || { lat: streetInfo.lat, lng: streetInfo.lon }
      const searchQueries = [
        'residential buildings',
        'houses',
        'apartments',
        'homes',
        'condos',
        'townhouses',
        'residential units'
      ]
      
      for (const query of searchQueries) {
        try {
          const nearbySearchRequest = {
            location: center,
            radius: 500, // Increased from 300m to 500m for better coverage
            type: 'establishment',
            keyword: query
          }

          setApiCallCount(prev => prev + 1)
          const buildings = await new Promise<any[]>((resolve, reject) => {
            const service = new window.google.maps.places.PlacesService(document.createElement('div'))
            service.nearbySearch(nearbySearchRequest, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results)
              } else {
                resolve([])
              }
            })
          })

          // Process buildings with enhanced filtering
          buildings.forEach((building) => {
            const buildingLocation = building.geometry.location
            const buildingNumber = extractBuildingNumber(building.name || building.formatted_address)
            
                         // Enhanced validation with geospatial check
             if (buildingNumber > 0 && isResidentialAddress(
               buildingLocation.lat(), 
               buildingLocation.lng(), 
               territoryPolygon || []
             )) {
              residents.push({
                id: `resident-${Date.now()}-${building.place_id}`,
                name: building.name || `Resident ${buildingNumber}`,
                address: building.formatted_address || `${buildingNumber} ${streetName}`,
                buildingNumber: buildingNumber,
                lat: buildingLocation.lat(),
                lng: buildingLocation.lng(),
                status: 'not-visited',
                phone: building.formatted_phone_number || '',
                email: '',
                notes: '',
                lastVisited: null,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              console.log(`🏠 Found residential building: ${buildingNumber} at ${building.formatted_address}`)
            }
          })

          console.log(`✅ Query "${query}" found ${buildings.length} buildings`)
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200))
          
        } catch (error) {
          console.error(`❌ Query "${query}" failed:`, error)
        }
      }
      
      // Fallback: Try searching for specific house numbers on the street
      if (residents.length === 0) {
        console.log('🔄 No buildings found, trying house number search...')
        const houseNumbers = await searchForHouseNumbers(streetInfo, streetName)
        residents.push(...houseNumbers)
      }
      
      console.log(`🎯 Enhanced search completed: ${residents.length} residential buildings found`)
      return residents
      
    } catch (error) {
      console.error('❌ Enhanced residential search failed:', error)
      return []
    }
  }

  // Reverse geocoding for residential buildings
  const reverseGeocodeResidentialBuildings = async (streetInfo: any, streetName: string, territoryPolygon?: any): Promise<DetectedResident[]> => {
    console.log('🔄 Starting reverse geocoding for:', streetName)
    setDetectionProgress(`Reverse geocoding addresses on ${streetName}...`)
    const residents: DetectedResident[] = []
    
    try {
      const center = streetInfo.geometry?.location || { lat: streetInfo.lat, lng: streetInfo.lon }
      const searchPoints = 8 // Reduced for more focused search
      
      // Generate search points along street path with better spacing
      for (let i = 0; i < searchPoints; i++) {
        try {
          // Create more structured search points along the street
          const angle = (i / searchPoints) * Math.PI * 2
          const radius = 0.0005 // Smaller radius for more precise search
          const point = {
            lat: center.lat + Math.cos(angle) * radius,
            lng: center.lng + Math.sin(angle) * radius
          }
          
          setApiCallCount(prev => prev + 1)
          const geocoder = new window.google.maps.Geocoder()
          
          // Use more specific geocoding request
          const results = await new Promise<any[]>((resolve, reject) => {
            geocoder.geocode({
              location: point
            }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results) {
                resolve(results)
              } else {
                resolve([])
              }
            })
          })

          // Process geocoding results with better filtering
          results.forEach((result) => {
            const address = result.formatted_address
            const types = result.types || []
            
            // Only process if it's a street address or premise
            if (types.includes('street_address') || types.includes('premise') || types.includes('subpremise')) {
              const buildingNumber = extractBuildingNumberFromAddressValidation(result)
              
              if (buildingNumber > 0 && isResidentialAddress(
                result.geometry.location.lat(), 
                result.geometry.location.lng(), 
                territoryPolygon || []
              )) {
                const location = result.geometry.location
                residents.push({
                  id: `resident-geocode-${Date.now()}-${buildingNumber}`,
                  name: `Resident ${buildingNumber}`,
                  address: address,
                  buildingNumber: buildingNumber,
                  lat: location.lat(),
                  lng: location.lng(),
                  status: 'not-visited',
                  phone: '',
                  email: '',
                  notes: '',
                  lastVisited: null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
                console.log(`🔄 Found via geocoding: ${buildingNumber} at ${address}`)
              }
            }
          })
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 150))
          
        } catch (error) {
          console.error(`❌ Geocoding point ${i} failed:`, error)
        }
      }
      
      console.log(`🔄 Reverse geocoding completed: ${residents.length} buildings found`)
      return residents
      
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error)
      return []
    }
  }

  // Deduplicate residents
  const deduplicateResidents = (residents: DetectedResident[]): DetectedResident[] => {
    console.log('🔄 Deduplicating residents...')
    const uniqueResidents = residents.filter((resident, index, self) => 
      index === self.findIndex(r => 
        r.address.toLowerCase() === resident.address.toLowerCase() ||
        (r.lat === resident.lat && r.lng === resident.lng)
      )
    )
    console.log(`🔄 Deduplication: ${residents.length} → ${uniqueResidents.length} residents`)
    return uniqueResidents
  }

  // Sequential house number detection
  const detectSequentialHouseNumbers = async (residents: DetectedResident[], streetName: string): Promise<DetectedResident[]> => {
    console.log('🔢 Starting sequential house number detection for:', streetName)
    
    if (residents.length < 2) {
      console.log('⚠️ Not enough residents for pattern analysis')
      return residents
    }
    
    try {
      // Analyze existing patterns
      const patterns = analyzeHouseNumberPatterns(residents)
      console.log('📊 House number patterns:', patterns)
      
      // Generate missing numbers
      const missingNumbers = generateMissingHouseNumbers(residents, patterns, streetName)
      console.log(`🔢 Generated ${missingNumbers.length} missing house numbers`)
      
      // Create residents for missing numbers
      const generatedResidents = missingNumbers.map(number => 
        estimateBuildingPosition(number, residents, patterns, streetName)
      )
      
      const allResidents = [...residents, ...generatedResidents]
      console.log(`🔢 Sequential detection complete: ${allResidents.length} total residents`)
      
      return allResidents
      
    } catch (error) {
      console.error('❌ Sequential detection failed:', error)
      return residents
    }
  }

  // Analyze house number patterns
  const analyzeHouseNumberPatterns = (residents: DetectedResident[]) => {
    const sortedNumbers = residents
      .map(r => r.buildingNumber)
      .filter((n): n is number => n !== undefined && n > 0)
      .sort((a, b) => a - b)
    
    if (sortedNumbers.length < 2) return null
    
    console.log('🔢 Analyzing house number patterns for:', sortedNumbers)
    
    const differences = []
    for (let i = 1; i < sortedNumbers.length; i++) {
      differences.push(sortedNumbers[i] - sortedNumbers[i - 1])
    }
    
    console.log('🔢 Differences between consecutive numbers:', differences)
    
    // Find the most common difference (mode) instead of average
    const differenceCounts = differences.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const mostCommonDifference = Object.entries(differenceCounts)
      .sort(([,a], [,b]) => b - a)[0][0]
    
    const step = parseInt(mostCommonDifference, 10)
    
    // Check for odd/even patterns
    const oddNumbers = sortedNumbers.filter(n => n % 2 === 1)
    const evenNumbers = sortedNumbers.filter(n => n % 2 === 0)
    const hasOddEven = oddNumbers.length > 0 && evenNumbers.length > 0
    
    // If we have both odd and even, the step might be 2
    const refinedStep = hasOddEven && step > 2 ? 2 : step
    
    console.log('🔢 Pattern analysis results:', {
      differences,
      differenceCounts,
      mostCommonDifference,
      step,
      refinedStep,
      hasOddEven,
      oddNumbers: oddNumbers.length,
      evenNumbers: evenNumbers.length
    })
    
    return {
      min: Math.min(...sortedNumbers),
      max: Math.max(...sortedNumbers),
      step: refinedStep || 2,
      hasOddEven,
      sortedNumbers,
      differences,
      oddNumbers,
      evenNumbers
    }
  }

  // Generate missing house numbers
  const generateMissingHouseNumbers = (residents: DetectedResident[], patterns: any, streetName: string): number[] => {
    if (!patterns) return []
    
    const generated: number[] = []
    const extendRange = 50 // Increased from 20 to 50 numbers in each direction
    const maxGenerated = Math.min(200, Math.floor(residents.length * 3)) // Increased from 100 to 200
    
    console.log('🔢 Generating missing house numbers with patterns:', {
      min: patterns.min,
      max: patterns.max,
      step: patterns.step,
      hasOddEven: patterns.hasOddEven,
      extendRange,
      maxGenerated
    })
    
    // Handle odd/even patterns more intelligently
    if (patterns.hasOddEven && patterns.step === 2) {
      console.log('🔢 Detected odd/even pattern, generating numbers with step 2')
      
      // Generate odd numbers before minimum
      for (let i = patterns.min - extendRange; i < patterns.min; i += 2) {
        if (generated.length >= maxGenerated) break
        if (i > 0 && i % 2 === 1 && !patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
      
      // Generate even numbers before minimum
      for (let i = patterns.min - extendRange + 1; i < patterns.min; i += 2) {
        if (generated.length >= maxGenerated) break
        if (i > 0 && i % 2 === 0 && !patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
      
      // Generate odd numbers after maximum
      for (let i = patterns.max + 2; i <= patterns.max + extendRange; i += 2) {
        if (generated.length >= maxGenerated) break
        if (i % 2 === 1 && !patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
      
      // Generate even numbers after maximum
      for (let i = patterns.max + 1; i <= patterns.max + extendRange; i += 2) {
        if (generated.length >= maxGenerated) break
        if (i % 2 === 0 && !patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
    } else {
      console.log('🔢 Using standard step pattern:', patterns.step)
      
      // Generate missing numbers before the minimum
      for (let i = patterns.min - extendRange; i < patterns.min; i += patterns.step) {
        if (generated.length >= maxGenerated) break
        if (i > 0 && !patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
      
      // Generate missing numbers after the maximum
      for (let i = patterns.max + patterns.step; i <= patterns.max + extendRange; i += patterns.step) {
        if (generated.length >= maxGenerated) break
        if (!patterns.sortedNumbers.includes(i)) {
          generated.push(i)
        }
      }
    }
    
    console.log('🔢 Generated missing house numbers:', generated.length, 'numbers')
    return generated
  }

  // Estimate building position for generated numbers
  const estimateBuildingPosition = (number: number, residents: DetectedResident[], patterns: any, streetName: string): DetectedResident => {
    // Find the closest existing resident to estimate position
    const closestResident = residents.reduce((closest, resident) => {
      const closestDiff = Math.abs((closest.buildingNumber || 0) - number)
      const currentDiff = Math.abs((resident.buildingNumber || 0) - number)
      return currentDiff < closestDiff ? resident : closest
    })
    
    // Estimate position based on number difference
    const numberDiff = number - (closestResident.buildingNumber || 0)
    const estimatedLat = closestResident.lat + (numberDiff * 0.0001)
    const estimatedLng = closestResident.lng + (numberDiff * 0.0001)
    
    return {
      id: `resident-generated-${number}`,
      name: `Resident ${number}`,
      address: `${number} ${streetName}`,
      buildingNumber: number,
      lat: estimatedLat,
      lng: estimatedLng,
      status: 'not-visited',
      phone: '',
      email: '',
      notes: 'Generated from pattern analysis',
      lastVisited: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }







  // Search for specific house numbers on a street
  const searchForHouseNumbers = async (streetInfo: any, streetName: string, territoryPolygon?: any): Promise<DetectedResident[]> => {
    console.log('🔍 Searching for house numbers on:', streetName)
    const residents: DetectedResident[] = []
    
    try {
      const center = streetInfo.geometry?.location || { lat: streetInfo.lat, lng: streetInfo.lon }
      
      // Try systematic house numbers (1-100, both even and odd)
      for (let number = 1; number <= 100; number++) {
        try {
          const addressQuery = `${number} ${streetName}`
          setApiCallCount(prev => prev + 1)
          
          const geocoder = new window.google.maps.Geocoder()
          const results = await new Promise<any[]>((resolve, reject) => {
            geocoder.geocode({
              address: addressQuery
            }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results) {
                resolve(results)
              } else {
                resolve([])
              }
            })
          })
          
          if (results.length > 0) {
            const result = results[0]
            const address = result.formatted_address
            const buildingNumber = extractBuildingNumberFromAddressValidation(result)
            
            if (buildingNumber > 0 && isResidentialAddress(
              result.geometry.location.lat(), 
              result.geometry.location.lng(), 
              territoryPolygon || []
            )) {
              const location = result.geometry.location
              residents.push({
                id: `resident-search-${number}`,
                name: `Resident ${number}`,
                address: address,
                buildingNumber: buildingNumber,
                lat: location.lat(),
                lng: location.lng(),
                status: 'not-visited',
                phone: '',
                email: '',
                notes: '',
                lastVisited: null,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              console.log(`🔍 Found house number ${number} at ${address}`)
            }
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`❌ House number ${number} search failed:`, error)
        }
      }
      
      console.log(`🔍 House number search completed: ${residents.length} residents found`)
      return residents
      
    } catch (error) {
      console.error('❌ House number search failed:', error)
      return []
    }
  }

  // Helper function to extract building number from Address Validation API response
  const extractBuildingNumberFromAddressValidation = (address: any): number => {
    console.log('Extracting building number from address:', address)
    
    if (!address) return 0
    
    // Try to get building number from address components first (Google Geocoding API format)
    if (address.address_components && Array.isArray(address.address_components)) {
      for (const component of address.address_components) {
        if (component.long_name && component.types) {
          const text = component.long_name
          console.log('Checking component:', component.types[0], text)
          
          // Look for street number component
          if (component.types.includes('street_number')) {
            const number = parseInt(text, 10)
            if (number > 0 && number < 10000) {
              console.log('Found street number:', number)
              return number
            }
          }
        }
      }
    }
    
    // Try to get building number from address components (Address Validation API format)
    if (address.addressComponents && Array.isArray(address.addressComponents)) {
      for (const component of address.addressComponents) {
        if (component.componentName && component.componentName.text) {
          const text = component.componentName.text
          console.log('Checking component:', component.componentType, text)
          
          // Look for street number component
          if (component.componentType === 'street_number') {
            const number = parseInt(text, 10)
            if (number > 0 && number < 10000) {
              console.log('Found street number:', number)
              return number
            }
          }
        }
      }
    }
    
    // Fallback: extract from address lines
    if (address.addressLines && address.addressLines.length > 0) {
      const formattedAddress = address.addressLines[0]
      console.log('Checking address line:', formattedAddress)
      
      const patterns = [
        /^(\d+)/, // Start of string: 123 Main St
        /^(\d+)\s/, // Start with number and space: 123 Main St
        /(\d+)\s+[A-Za-z]/, // Number followed by street name: 123 Main St
        /^(\d+)[A-Za-z]/, // Number followed by letter: 123Main St
        /(\d+)\s*[A-Za-z]+\s+[A-Za-z]+/, // Number street type: 123 Main Street
      ]

      for (const pattern of patterns) {
        const match = formattedAddress.match(pattern)
        if (match) {
          const number = parseInt(match[1], 10)
          if (number > 0 && number < 10000) {
            console.log('Found building number from pattern:', number)
            return number
          }
        }
      }
    }
    
    // Final fallback: extract from formatted address
    if (address.formatted_address) {
      console.log('Checking formatted address:', address.formatted_address)
      return extractBuildingNumber(address.formatted_address)
    }
    
    console.log('No building number found')
    return 0
  }

  // Validate territory data before saving
  const validateTerritoryData = useCallback((data: any) => {
    const errors: string[] = []
    
    // Validate name
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Territory name must be at least 2 characters long')
    }
    
    // Validate boundary - check the actual polygon coordinates array
    if (!data.boundary || !data.boundary.coordinates || data.boundary.coordinates.length === 0) {
      errors.push('Territory boundary coordinates are missing')
    } else {
      const polygonCoords = data.boundary.coordinates[0] // Get the actual polygon coordinates array
      if (!polygonCoords || polygonCoords.length < 3) {
        errors.push('Territory boundary must have at least 3 coordinate points')
      }
    }
    
    // Validate building data
    if (!data.buildingData || !data.buildingData.addresses || data.buildingData.addresses.length === 0) {
      errors.push('Territory must have at least one detected building')
    }
    
    // Validate polygon closure
    if (data.boundary && data.boundary.coordinates && data.boundary.coordinates.length > 0) {
      const coords = data.boundary.coordinates[0]
      if (coords.length > 0) {
        const first = coords[0]
        const last = coords[coords.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) {
          errors.push('Territory boundary polygon must be closed (first and last points must be identical)')
        }
      }
    }
    
    return errors
  }, [])

  // Check for zone overlaps before saving
  const checkZoneOverlap = useCallback(async (boundary: any, buildingData: any) => {
    try {
      console.log('🔍 Checking for zone overlaps...')
      
      const response = await apiInstance.post('/zones/check-overlap', {
        boundary,
        buildingData
      })

      if (response.data.success) {
        const { hasOverlap, overlappingZones, duplicateBuildings, isValid } = response.data.data
        
        if (hasOverlap) {
          const zoneNames = overlappingZones.map((zone: any) => zone.name).join(', ')
          toast.error(`❌ Territory overlaps with existing zones: ${zoneNames}`)
          return false
        }
        
        if (duplicateBuildings && duplicateBuildings.length > 0) {
          toast.error(`❌ ${duplicateBuildings.length} buildings are already assigned to other territories`)
          return false
        }
        
        if (!isValid) {
          toast.error('❌ Territory boundary is invalid')
          return false
        }
        
        console.log('✅ Zone overlap check passed')
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Error checking zone overlap:', error)
      // Continue with save even if overlap check fails
      return true
    }
  }, [])

  // Save territory using enhanced API with proper data structure
  const saveTerritory = useCallback(async () => {
    if (!territoryName.trim() || !generatedPolygon || detectedResidents.length === 0) {
      toast.error("Please complete all required fields")
      return
    }

    setIsSavingTerritory(true)

    try {
      console.log('🚀 saveTerritory: Starting territory save...')
      console.log('📝 Territory data:', {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        residentsCount: detectedResidents.length,
        polygonPoints: generatedPolygon.length
      })

      // Ensure polygon is closed (first and last coordinates must be identical for GeoJSON)
      const polygonCoords = generatedPolygon.map((coord: any) => [coord.lng, coord.lat])
      
      // Close the polygon if it's not already closed
      if (polygonCoords.length > 0) {
        const firstCoord = polygonCoords[0]
        const lastCoord = polygonCoords[polygonCoords.length - 1]
        
        if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
          polygonCoords.push([...firstCoord]) // Add first coordinate at the end
          console.log('🔧 Closed polygon by adding first point at end')
        }
      }

      // Prepare building data for backend with enhanced structure
      const buildingData = {
        addresses: detectedResidents.map(resident => resident.address),
        coordinates: detectedResidents.map(resident => [resident.lng, resident.lat]),
        totalBuildings: detectedResidents.length,
        residentialHomes: detectedResidents.filter(r => r.buildingNumber).length
      }

      // Prepare territory data with all required fields
      const territoryData = {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        boundary: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        },
        buildingData,
        zoneType: 'MANUAL', // Valid enum value for manually created zones
        // Optional: Add team assignment if provided
        ...(selectedAssignment && assignmentType === "team" && { teamId: selectedAssignment._id }),
        // Optional: Add agent assignment if provided
        ...(selectedAssignment && assignmentType === "individual" && { agentId: selectedAssignment._id }),
        // Optional: Add effective date if provided
        ...(assignedDate && { effectiveFrom: assignedDate })
      }

      console.log('📤 Sending territory data to backend:', territoryData)

      // Validate territory data before saving
      const validationErrors = validateTerritoryData(territoryData)
      if (validationErrors.length > 0) {
        toast.error(`❌ Validation failed: ${validationErrors.join(', ')}`)
        setIsSavingTerritory(false)
        return
      }

      // Check for overlaps before saving
      const overlapCheckPassed = await checkZoneOverlap(territoryData.boundary, territoryData.buildingData)
      if (!overlapCheckPassed) {
        setIsSavingTerritory(false)
        return
      }

      // Call the zones API with enhanced data structure
      const response = await apiInstance.post('/zones/create-zone', territoryData)

      if (response.data.success) {
        const savedTerritory = response.data.data
        console.log('✅ Territory saved successfully:', savedTerritory)
        
        // Store the saved territory ID for assignment
        setSavedTerritoryId(savedTerritory._id)
        
        // Enhanced success message with territory details
        toast.success(`✅ Territory "${territoryName}" saved as draft! 
          📊 ${detectedResidents.length} residents detected
          📍 Area: ${territoryArea.toFixed(2)} ha
          🏠 Density: ${buildingDensity.toFixed(1)} buildings/ha`)
        
        // Advance to step 2 (assignment step) instead of resetting form
        setFormStep(2)
      } else {
        throw new Error(response.data.message || 'Failed to save territory')
      }
    } catch (error) {
      console.error('❌ Error saving territory:', error)
      
      // Enhanced error handling with specific backend error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Backend response data:', axiosError.response?.data)
        console.error('Backend response status:', axiosError.response?.status)
        
        if (axiosError.response?.data?.message) {
          // Handle specific backend error cases
          const errorMessage = axiosError.response.data.message
          
          if (errorMessage.includes('already exists')) {
            toast.error(`❌ Territory name "${territoryName}" already exists. Please choose a different name.`)
          } else if (errorMessage.includes('overlaps')) {
            toast.error(`❌ Territory overlaps with existing zones. Please adjust the boundaries.`)
          } else if (errorMessage.includes('duplicate buildings')) {
            toast.error(`❌ Some buildings are already assigned to other territories.`)
          } else {
            toast.error(`❌ ${errorMessage}`)
          }
          return
        }
      }
      
      toast.error(error instanceof Error ? error.message : '❌ Unknown error occurred while saving territory')
    } finally {
      setIsSavingTerritory(false)
    }
  }, [territoryName, territoryDescription, generatedPolygon, detectedResidents, selectedAssignment, assignmentType, assignedDate, territoryArea, buildingDensity, onTerritorySaved])

  // Reset form
  const resetForm = useCallback(() => {
    setFormStep(1)
    setTerritoryName("")
    setTerritoryDescription("")

    setSelectedStreets([])
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setTerritoryArea(0)
    setBuildingDensity(0)
    setAssignedRep("")
    setAssignedDate("")
    setAssignmentType("team")
    setAssignmentSearchQuery("")
    setAssignmentSearchResults([])
    setSelectedAssignment(null)
    setSavedTerritoryId(null)
    setIsAssigningTerritory(false)
    setIsSelectionUpdate(false)
  }, [])

  // Handle modal close
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Handle step 1 submit - Save territory and advance to assignment step
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (territoryName.trim() && selectedMunicipality && selectedStreets.length > 0 && detectedResidents.length > 0) {
      // Call saveTerritory function which will handle the API call
      await saveTerritory()
    }
  }

  // Handle step 2 submit - Assign territory (optional)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Assignment is optional - user can skip or assign
    if (selectedAssignment && assignedDate && savedTerritoryId) {
      setIsAssigningTerritory(true)
      try {
        console.log('Assigning territory to:', selectedAssignment, 'on date:', assignedDate)
        
        // Prepare assignment data
        const assignmentData = {
          zoneId: savedTerritoryId, // Use the saved territory ID
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
            toast.success(`Territory "${territoryName}" has been scheduled for assignment to ${assignedToName} on ${new Date(assignedDate).toLocaleDateString()}`);
          } else {
            // Immediate assignment
            toast.success(`Territory "${territoryName}" has been assigned to ${assignedToName} (${assignmentType})`);
          }
        } else {
          throw new Error('Failed to assign territory');
        }
      } catch (error) {
        console.error('❌ Error assigning territory:', error)
        
        // Enhanced error handling with specific backend error messages
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          console.error('Backend response data:', axiosError.response?.data)
          console.error('Backend response status:', axiosError.response?.status)
          
          if (axiosError.response?.data?.message) {
            toast.error(`❌ ${axiosError.response.data.message}`)
            return // Don't close modal on error
          }
        }
        
        toast.error(error instanceof Error ? error.message : '❌ Unknown error occurred while assigning territory')
        return // Don't close modal on error
      } finally {
        setIsAssigningTerritory(false)
      }
    } else {
      // User chose to skip assignment - show info message
      toast.info('Territory saved without assignment. You can assign it later.')
    }
    
    // Only close modal if we reach here (success or skip)
    onTerritorySaved({
      name: territoryName,
      description: territoryDescription,
      residents: detectedResidents,
      area: territoryArea,
      density: buildingDensity
    })
    resetForm()
    onClose()
  }

  // Show loading state if Google Maps is not loaded yet
  if (!isGoogleMapsLoaded) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-900">Loading Google Maps...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Manually Assign Territory
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className={`flex items-center ${formStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-sm ${formStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-gray-50'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Territory Details</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${formStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-sm ${formStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-gray-50'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Assignment</span>
            </div>
          </div>
        </div>

        {/* Step 1: Territory Details */}
        {formStep === 1 && (
          <form onSubmit={handleStep1Submit} className="px-6 py-4 space-y-6">
            {/* Territory Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Territory Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="territoryName" className="text-sm font-medium text-gray-700">
                    Territory Name *
                  </Label>
                  <Input
                    id="territoryName"
                    type="text"
                    value={territoryName}
                    onChange={(e) => setTerritoryName(e.target.value)}
                    placeholder="Enter territory name"
                    className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
                

                </div>
                
                <div className="space-y-2">
                <Label htmlFor="territoryDescription" className="text-sm font-medium text-gray-700">
                  Description
                  </Label>
                <Textarea
                  id="territoryDescription"
                  value={territoryDescription}
                  onChange={(e) => setTerritoryDescription(e.target.value)}
                  placeholder="Optional description for this territory"
                  rows={3}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Geographical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Geographical Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Geographic Hierarchy Fields */}
                <div className="space-y-2">
                  <Label htmlFor="selectedArea" className="text-sm font-medium text-gray-700">
                    Area/Region
                  </Label>
                  <div className="relative" data-dropdown="area" ref={areaDropdownRef}>
                    <Input
                      id="selectedArea"
                      type="text"
                      value={areaInputValue}
                      onChange={(e) => {
                        console.log('🔄 Area input onChange - value:', e.target.value)
                        setAreaInputValue(e.target.value)
                        
                        // Don't search if we're programmatically setting the value
                        if (isSettingAreaProgrammatically) {
                          console.log('🔄 Programmatically setting area, skipping search')
                          return
                        }
                        
                        // Clear suggestions immediately for short queries
                        if (e.target.value.length < 2) {
                          console.log('🗑️ Clearing area suggestions')
                          setAreaSuggestions([])
                          return
                        }
                        
                        // Don't search if the value matches the selected area (prevents dropdown from reopening)
                        if (selectedArea && e.target.value === selectedArea) {
                          console.log('🔄 Value matches selected area, not searching')
                          setAreaSuggestions([])
                          return
                        }
                        
                        // Debounce the search to prevent multiple rapid calls
                        const timeoutId = setTimeout(() => {
                          console.log('📞 Calling searchAreas with:', e.target.value)
                          searchAreas(e.target.value)
                        }, 300) // 300ms delay
                        
                        // Clear previous timeout
                        if (window.areaSearchTimeout) {
                          clearTimeout(window.areaSearchTimeout)
                        }
                        window.areaSearchTimeout = timeoutId
                      }}
                      placeholder="Search for area/region (e.g., Ontario, GTA)"
                      className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    {isLoadingAreas && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {areaSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {areaSuggestions.map((area) => (
                          <button
                            key={area.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleAreaSelect(area)}
                          >
                            <div className="font-medium text-blue-600">{area.name}</div>
                            <div className="text-sm text-gray-500">{area.fullName}</div>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="selectedMunicipality" className="text-sm font-medium text-gray-700">
                    Municipality/City
                </Label>
                  <div className="relative" data-dropdown="municipality" ref={municipalityDropdownRef}>
                    <Input
                      id="selectedMunicipality"
                      type="text"
                      value={municipalityInputValue}
                      onChange={(e) => {
                        setMunicipalityInputValue(e.target.value)
                        if (selectedArea && e.target.value.length >= 2) {
                          searchMunicipalities(e.target.value)
                        } else {
                          setMunicipalitySuggestions([])
                        }
                      }}
                      onFocus={() => {
                        // Re-show cached municipalities when user focuses on the field
                        if (selectedArea && cachedMunicipalities.length > 0) {
                          console.log('🔄 Showing cached municipalities on focus:', cachedMunicipalities.length)
                          setMunicipalitySuggestions(cachedMunicipalities)
                        } else if (selectedArea && municipalitySuggestions.length === 0) {
                          console.log('🔄 No cache found, loading municipalities for area:', selectedArea)
                          loadMunicipalitiesForArea(selectedArea)
                        }
                      }}
                      placeholder={selectedArea ? "Search for municipality/city" : "Select area first"}
                      className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      disabled={!selectedArea}
                    />
                    {isLoadingMunicipalities && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {municipalitySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {municipalitySuggestions.map((municipality) => (
                          <button
                            key={municipality.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleMunicipalitySelect(municipality)}
                          >
                            <div className="font-medium text-blue-600">{municipality.name}</div>
                            <div className="text-sm text-gray-500">{municipality.fullName}</div>
                          </button>
                        ))}
                      </div>
                    )}
              </div>
            </div>

                <div className="space-y-2">
                  <Label htmlFor="selectedCommunity" className="text-sm font-medium text-gray-700">
                    Community/Neighbourhood
                  </Label>
                  <div className="relative" data-dropdown="community" ref={communityDropdownRef}>
                    <Input
                      id="selectedCommunity"
                      type="text"
                      value={communityInputValue}
                      onChange={(e) => {
                        setCommunityInputValue(e.target.value)
                        if (selectedMunicipality && e.target.value.length >= 2) {
                          searchCommunities(e.target.value)
                          } else {
                          setCommunitySuggestions([])
                        }
                      }}
                      onFocus={() => {
                        // Re-show cached communities when user focuses on the field
                        if (selectedMunicipality && cachedCommunities.length > 0) {
                          console.log('🔄 Showing cached communities on focus:', cachedCommunities.length)
                          setCommunitySuggestions(cachedCommunities)
                        } else if (selectedMunicipality && communitySuggestions.length === 0) {
                          console.log('🔄 No cache found, loading communities for municipality:', selectedMunicipality)
                          loadCommunitiesForMunicipality(selectedMunicipality, selectedArea)
                        }
                      }}
                      placeholder={selectedMunicipality ? "Search for community/neighbourhood" : "Select municipality first"}
                      className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      disabled={!selectedMunicipality}
                    />
                    {isLoadingCommunities && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {communitySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {communitySuggestions.map((community) => (
                          <button
                            key={community.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCommunitySelect(community)}
                          >
                            <div className="font-medium text-blue-600">{community.name}</div>
                            <div className="text-sm text-gray-500">{community.fullName}</div>
                          </button>
                        ))}
                      </div>
                    )}
                        </div>
                </div>



              </div>

              <div className="space-y-2">
                <Label htmlFor="selectedStreet" className="text-sm font-medium text-gray-700">
                  Street *
                </Label>
                                   <div className="relative" data-dropdown="street">
                  <Input
                    id="selectedStreet"
                    type="text"
                    value={streetInputValue}
                    onChange={(e) => {
                      console.log('Street input onChange - value:', e.target.value)
                      setStreetInputValue(e.target.value)
                      setNoStreetsFound(false)
                      
                      // Search within selected community
                      if (selectedCommunity && e.target.value.length >= 1) {
                        console.log('Searching streets within community hierarchy:', selectedCommunity)
                        searchStreetsInCommunity(e.target.value, selectedCommunity, selectedMunicipality, selectedArea)
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      } else if (e.target.value.length === 0) {
                        // If user clears the input, show cached streets
                        console.log('Input cleared, showing cached streets')
                        if (cachedStreets.length > 0) {
                          setStreetSuggestions(cachedStreets)
                          setShowStreetSuggestions(true)
                        } else if (streetSuggestions.length > 0) {
                          setShowStreetSuggestions(true)
                        } else {
                          setShowStreetSuggestions(false)
                        }
                        setShowResultsPanel(false)
                      } else {
                        console.log('Not calling street search - conditions not met')
                        setShowStreetSuggestions(false)
                        setShowResultsPanel(false)
                      }
                    }}
                    onFocus={() => {
                      // Show cached streets when focusing on the field
                      if (selectedCommunity && cachedStreets.length > 0) {
                        console.log('🔄 Showing cached streets on focus (Community level):', cachedStreets.length)
                        setStreetSuggestions(cachedStreets)
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      } else if (selectedCommunity && streetInputValue.length >= 1) {
                        searchStreetsInCommunity(streetInputValue, selectedCommunity, selectedMunicipality, selectedArea)
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      } else if (selectedCommunity && streetSuggestions.length > 0) {
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      }
                    }}
                    placeholder={
                      !selectedCommunity 
                        ? "Select a community first" 
                        : isLoadingStreets 
                          ? "Loading streets..." 
                          : streetSuggestions.length > 0 
                            ? "Type to filter residential streets in community" 
                            : noStreetsFound 
                              ? "No residential streets found in community" 
                              : "Search residential streets in community"
                    }
                    className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    disabled={!selectedCommunity || isLoadingStreets}
                  />
                  {isLoadingStreets && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                  {showStreetSuggestions && streetSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                        Suggested Streets (from OpenStreetMap data)
                      </div>
                      {streetSuggestions.map((street) => (
                        <button
                          key={street.place_id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleStreetSelect(street)}
                        >
                          <div className="font-medium text-blue-600">{street.structured_formatting.main_text}</div>
                          <div className="text-sm text-gray-500">{street.structured_formatting.secondary_text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {noStreetsFound && !isLoadingStreets && showStreetSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                        No streets found for {selectedMunicipality}
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-600">
                        Try searching manually or select a different area.
                      </div>
                    </div>
                  )}
                </div>
                

                
                {/* Load Manually Button - positioned below and to the right */}
                {selectedMunicipality && !isLoadingStreets && (
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('🔄 Loading streets manually for municipality:', selectedMunicipality)
                        loadStreetsForNeighbourhood(selectedMunicipality)
                      }}
                      className="text-xs px-3 py-1 h-8 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Load Streets Manually
                    </Button>
                  </div>
                )}
              </div>

              {/* Geographic Hierarchy Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Geographic Hierarchy Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className={`p-2 rounded ${selectedArea ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <div className="font-medium">Area</div>
                    <div className="truncate">{selectedArea || 'Not selected'}</div>
                  </div>
                  <div className={`p-2 rounded ${selectedMunicipality ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <div className="font-medium">Municipality</div>
                    <div className="truncate">{selectedMunicipality || 'Not selected'}</div>
                  </div>
                  <div className={`p-2 rounded ${selectedCommunity ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <div className="font-medium">Community</div>
                    <div className="truncate">{selectedCommunity || 'Not selected'}</div>
                  </div>

                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Validate Hierarchy button clicked!')
                      console.log('📊 Current selections:')
                      console.log('  - Area:', selectedArea)
                      console.log('  - Municipality:', selectedMunicipality)
                      console.log('  - Community:', selectedCommunity)

                      
                      const validation = validateGeographicHierarchy()
                      console.log('✅ Validation result:', validation)
                      
                      if (validation.errors.length > 0) {
                        console.log('❌ Validation errors found:', validation.errors)
                        toast.error(`Validation failed: ${validation.errors.join(', ')}`)
                      } else if (validation.warnings.length > 0) {
                        console.log('⚠️ Validation warnings found:', validation.warnings)
                        toast.warning(`Validation warnings: ${validation.warnings.join(', ')}`)
                      } else {
                        console.log('🎉 All validations passed!')
                        toast.success('Geographic hierarchy is valid!')
                      }
                    }}
                    className="text-xs"
                  >
                    Validate Hierarchy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedArea("")
                      setAreaInputValue("")
                      setSelectedMunicipality("")
                      setMunicipalityInputValue("")
                      setSelectedCommunity("")
                      setCommunityInputValue("")
                      toast.info('Geographic hierarchy cleared')
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Selected Streets */}
              {selectedStreets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Selected Streets ({selectedStreets.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStreets.map((streetId) => {
                      const street = streetSuggestions.find(s => s.place_id === streetId)
                      const streetName = street?.structured_formatting?.main_text || street?.description || streetId
                      return (
                        <Badge key={streetId} className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {streetName}
                          <button
                            type="button"
                            onClick={() => removeStreet(streetId)}
                            className="ml-1 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Detect Residents Button */}
              {selectedStreets.length > 0 && (
                <div className="space-y-2">
                  {/* Warning message when streets are selected but no residents detected */}
                  {selectedStreets.length > 0 && detectedResidents.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          Detection Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        Streets have been selected. Please run "Detect Residents" to generate building data and territory polygon.
                      </p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={detectResidentsFromStreets}
                    disabled={isDetectingResidents}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isDetectingResidents ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Detecting Residents...
                      </>
                    ) : (
                      <>
                        <Building className="w-4 h-4 mr-2" />
                        Detect Residents from Selected Streets
                      </>
                    )}
                  </Button>
                  
                  {/* Progress Display */}
                  {isDetectingResidents && detectionProgress && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm text-blue-800 font-medium">🔄 {detectionProgress}</div>
                      <div className="text-xs text-blue-600 mt-1">API Calls: {apiCallCount}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Detection Settings */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-3">Advanced Detection Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label htmlFor="searchRadius" className="text-xs font-medium text-blue-700">
                      Search Radius (meters)
                    </Label>
                    <Input
                      id="searchRadius"
                      type="number"
                      value={searchRadius}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!isNaN(value) && value > 0) {
                          setSearchRadius(value)
                        }
                      }}
                      min="50"
                      max="1000"
                      step="50"
                      className="h-8 text-xs border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <div className="text-xs text-blue-600">
                      Current: {searchRadius}m
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDistanceFromStreet" className="text-xs font-medium text-blue-700">
                      Max Distance from Street (km)
                    </Label>
                    <Input
                      id="maxDistanceFromStreet"
                      type="number"
                      value={maxDistanceFromStreet}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value > 0) {
                          setMaxDistanceFromStreet(value)
                        }
                      }}
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      className="h-8 text-xs border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <div className="text-xs text-blue-600">
                      Current: {maxDistanceFromStreet}km
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildingTypeFilter" className="text-xs font-medium text-blue-700">
                      Building Type Filter
                    </Label>
                    <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
                      <SelectTrigger className="h-8 text-xs border-blue-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartments">Apartments</SelectItem>
                        <SelectItem value="detached">Detached</SelectItem>
                        <SelectItem value="semi_detached_house">Semi-Detached</SelectItem>
                        <SelectItem value="terrace">Terrace</SelectItem>
                        <SelectItem value="bungalow">Bungalow</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressValidationLevel" className="text-xs font-medium text-blue-700">
                      Address Validation Level
                    </Label>
                    <Select value={addressValidationLevel} onValueChange={setAddressValidationLevel}>
                      <SelectTrigger className="h-8 text-xs border-blue-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="loose">Loose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coordinatePrecision" className="text-xs font-medium text-blue-700">
                      Coordinate Precision
                    </Label>
                    <Select value={coordinatePrecision} onValueChange={setCoordinatePrecision}>
                      <SelectTrigger className="h-8 text-xs border-blue-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High (6+ decimals)</SelectItem>
                        <SelectItem value="medium">Medium (5 decimals)</SelectItem>
                        <SelectItem value="low">Low (4 decimals)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                  <div className="text-xs text-blue-800 font-medium mb-1">Current Settings Summary:</div>
                  <div className="text-xs text-blue-700">
                    🔍 Search Radius: {searchRadius}m | 📏 Max Distance: {maxDistanceFromStreet}km | 🏢 Type: {buildingTypeFilter} | ✅ Validation: {addressValidationLevel} | 📍 Precision: {coordinatePrecision}
                  </div>
                </div>
              </div>

              {/* Detected Residents Summary */}
              {detectedResidents.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Residents Detected</span>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-green-700">Total Residents:</span>
                      <span className="ml-2 font-semibold text-green-800">{detectedResidents.length}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Selected Streets:</span>
                      <span className="ml-2 font-semibold text-green-800">{selectedStreets.length}</span>
                    </div>
                  </div>

                  {/* Detailed Residents List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-green-800 border-b border-green-200 pb-1">
                      Detected Buildings & Residents
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {detectedResidents.map((resident, index) => (
                        <div key={resident.id} className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900">
                                  {resident.name}
                                </span>
                                {resident.buildingNumber && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Building #{resident.buildingNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {resident.address}
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>
                                  <span className="font-medium">Coordinates:</span>
                                  <span className="ml-1">
                                    {resident.lat.toFixed(6)}, {resident.lng.toFixed(6)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>
                                  <span className="ml-1 capitalize text-blue-600">
                                    {resident.status.replace('-', ' ')}
                                  </span>
                                </div>
                                {resident.phone && (
                                  <div>
                                    <span className="font-medium">Phone:</span>
                                    <span className="ml-1">{resident.phone}</span>
                                  </div>
                                )}
                                {resident.email && (
                                  <div>
                                    <span className="font-medium">Email:</span>
                                    <span className="ml-1">{resident.email}</span>
                                  </div>
                                )}
                                {resident.notes && (
                                  <div>
                                    <span className="font-medium">Notes:</span>
                                    <span className="ml-1">{resident.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 ml-2">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Territory Area Info */}
                  {generatedPolygon && (
                    <div className="mt-4 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-700">
                        <div className="flex items-center gap-2 mb-1">
                          <Map className="w-3 h-3" />
                          <span className="font-medium">Territory Area Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span>Estimated Area:</span>
                            <span className="ml-1 font-medium">
                              {territoryArea > 0 ? `${territoryArea.toFixed(2)} ha (${Math.round(territoryArea * 10000)} sq meters)` : 'Calculating...'}
                            </span>
                          </div>
                          <div>
                            <span>Building Density:</span>
                            <span className="ml-1 font-medium">
                              ~{buildingDensity.toFixed(1)} buildings/ha
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Territory Map Visualization */}
                  {generatedPolygon && detectedResidents.length > 0 && isGoogleMapsApiLoaded && (
                    <div className="mt-4 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Map className="w-3 h-3" />
                          <span className="font-medium">Territory Map Visualization</span>
                        </div>
                      </div>
                      
                      <div className="relative h-64 w-full rounded-lg overflow-hidden border border-green-200">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={{
                            lat: detectedResidents[0]?.lat || 43.6532,
                            lng: detectedResidents[0]?.lng || -79.3832
                          }}
                          zoom={15}
                          options={{
                            mapTypeId: 'roadmap',
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                            zoomControl: true,
                            gestureHandling: 'cooperative',
                            styles: [
                              {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }]
                              }
                            ]
                          }}
                        >
                          {/* Territory Polygon */}
                          <Polygon
                            paths={generatedPolygon.map((coord: [number, number]) => ({
                              lat: coord[1],
                              lng: coord[0]
                            }))}
                            options={{
                              fillColor: '#10B981',
                              fillOpacity: 0.2,
                              strokeColor: '#10B981',
                              strokeWeight: 3,
                              strokeOpacity: 0.8,
                            }}
                          />

                          {/* Building Markers */}
                          {detectedResidents.map((resident, index) => (
                            <Marker
                              key={resident.id}
                              position={{
                                lat: resident.lat,
                                lng: resident.lng
                              }}
                              icon={{
                                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                                scale: 8,
                                fillColor: '#3B82F6',
                                fillOpacity: 0.8,
                                strokeWeight: 2,
                                strokeColor: '#FFFFFF',
                              }}
                              title={`${resident.name} - ${resident.address}`}
                              onClick={() => {
                                // Show info window or highlight resident
                                console.log('Selected resident:', resident)
                              }}
                            />
                          ))}
                        </GoogleMap>
                        
                        {/* Map Legend */}
                        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded"></div>
                            <span>Territory Boundary</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Residential Buildings ({detectedResidents.length})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Step 1:</strong> Enter territory information and select the geographical hierarchy. Start with Area/Region, then Municipality/City, then Community/Neighbourhood. Finally, search for streets within the selected area. Residents will be automatically detected from the selected streets.
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                disabled={!territoryName.trim() || !selectedMunicipality || selectedStreets.length === 0 || detectedResidents.length === 0 || isSavingTerritory}
              >
                {isSavingTerritory ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Territory...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Save Territory
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-8 border-gray-300 hover:bg-gray-50 py-2.5"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Assignment */}
        {formStep === 2 && (
          <form onSubmit={handleStep2Submit} className="px-6 py-4 space-y-6">
            {/* Territory Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Territory Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Territory Name:</span>
                  <span className="ml-2 text-gray-900">{territoryName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedArea && `${selectedArea} > `}
                    {selectedMunicipality}
                    {selectedCommunity && ` > ${selectedCommunity}`}
                  
                  </span>
                </div>
                {/* selectedPostalCode && (
                  <div>
                    <span className="font-medium text-gray-700">Postal Code:</span>
                    <span className="ml-2 text-gray-900">{selectedPostalCode}</span>
                  </div>
                ) */}
                <div>
                  <span className="font-medium text-gray-700">Selected Streets:</span>
                  <span className="ml-2 text-gray-900">{selectedStreets.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Detected Residents:</span>
                  <span className="ml-2 text-gray-900">{detectedResidents.length}</span>
                </div>
                {territoryDescription && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Description:</span>
                    <span className="ml-2 text-gray-900">{territoryDescription}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Territory Assignment (Optional)
              </h3>
              
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
                      
                      // Only trigger search if this is not a selection update
                      if (!isSelectionUpdate) {
                        if (query.trim()) {
                          searchAssignment(query, assignmentType)
                        } else {
                          setAssignmentSearchResults([])
                        }
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
                  <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white">
                    {assignmentSearchResults.map((result) => (
                      <div
                        key={result._id || result.id}
                        onClick={() => {
                          setIsSelectionUpdate(true) // Mark this as a selection update
                          setSelectedAssignment(result)
                          setAssignmentSearchQuery(assignmentType === "team" ? result.name : `${result.name} (${result.email})`)
                          setAssignmentSearchResults([])
                          // Reset the flag after a short delay to allow the input update to complete
                          setTimeout(() => setIsSelectionUpdate(false), 100)
                        }}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {assignmentType === "team" ? (
                          // Team Result Display
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{result.name}</p>
                            <p className="text-sm text-gray-500">
                              {result.agentIds?.length || 0} members
                            </p>
                            
                            {/* Assignment Status Badge */}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              result.performance?.zoneCoverage > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {result.performance?.zoneCoverage > 0 ? '✓ Assigned' : '○ Unassigned'}
                            </span>
                            
                            {/* Current Zone Coverage */}
                            {result.performance?.zoneCoverage > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-blue-600">
                                  🗺️ Currently assigned to {result.performance.zoneCoverage} zone(s)
                                </p>
                              </div>
                            )}
                            
                            {/* Team Leader */}
                            {result.leaderId && (
                              <p className="text-xs text-gray-600 mt-1">
                                👑 Leader: {result.leaderId.name}
                              </p>
                            )}
                            
                            {/* Team Status */}
                            {result.status && (
                              <p className="text-xs text-gray-600">
                                Status: {result.status}
                              </p>
                            )}
                          </div>
                        ) : (
                          // Individual Agent Result Display
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{result.name}</p>
                              <p className="text-sm text-gray-500">{result.email}</p>
                              
                              {/* Assignment Status Badge */}
                              {result.assignmentSummary && (
                                <div className="mt-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    result.assignmentSummary.currentAssignmentStatus === 'ASSIGNED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {result.assignmentSummary.currentAssignmentStatus === 'ASSIGNED' ? '✓ Assigned' : '○ Unassigned'}
                                  </span>
                                  
                                  {/* Detailed Assignment Status */}
                                  {result.assignmentSummary.assignmentDetails && (
                                    <div className="mt-1 space-y-1">
                                      {result.assignmentSummary.assignmentDetails.isFullyAssigned && (
                                        <p className="text-xs text-green-600 font-medium">
                                          ✓ Fully assigned ({result.assignmentSummary.assignmentDetails.totalAssignments} total)
                                        </p>
                                      )}
                                      {result.assignmentSummary.assignmentDetails.isPartiallyAssigned && (
                                        <p className="text-xs text-yellow-600 font-medium">
                                          ⚠ Partially assigned ({result.assignmentSummary.assignmentDetails.totalAssignments} total)
                                        </p>
                                      )}
                                      {result.assignmentSummary.assignmentDetails.isOnlyScheduled && (
                                        <p className="text-xs text-purple-600 font-medium">
                                          📅 Scheduled only ({result.assignmentSummary.totalScheduledZones} scheduled)
                                        </p>
                                      )}
                                      
                                      {/* Assignment Breakdown */}
                                      <div className="text-xs text-gray-600">
                                        {result.assignmentSummary.assignmentDetails.hasIndividualAssignments && (
                                          <span className="inline-block mr-2">
                                            👤 {result.assignmentSummary.individualZones.length} individual
                                          </span>
                                        )}
                                        {result.assignmentSummary.assignmentDetails.hasTeamAssignments && (
                                          <span className="inline-block mr-2">
                                            👥 {result.assignmentSummary.teamZones.length} team
                                          </span>
                                        )}
                                        {result.assignmentSummary.assignmentDetails.hasScheduledIndividualAssignments && (
                                          <span className="inline-block mr-2">
                                            📅 {result.assignmentSummary.totalScheduledZones} scheduled
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Team Membership Information */}
                              {result.teamMemberships && result.teamMemberships.length > 0 && (
                                <div className="mt-1">
                                  <div className="flex flex-wrap gap-1">
                                    {result.teamMemberships.map((team: any) => (
                                      <span
                                        key={team.teamId}
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          team.isPrimary
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {team.teamName}
                                        {team.isPrimary && (
                                          <span className="ml-1 text-blue-600">★</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-amber-600 mt-1">
                                    Already in {result.teamMemberships.length} team(s)
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                result.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {result.status}
                              </span>
                            </div>
                          </div>
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
                      <div className="flex-1">
                        <div className="font-medium text-sm text-blue-900">
                          {assignmentType === "team" ? selectedAssignment.name : selectedAssignment.name}
                        </div>
                        {assignmentType === "individual" && (
                          <div className="text-xs text-blue-700">{selectedAssignment.email}</div>
                        )}
                        {assignmentType === "team" && selectedAssignment.agentIds && (
                          <div className="text-xs text-blue-700">{selectedAssignment.agentIds.length} members</div>
                        )}
                        
                        {/* Enhanced Assignment Status for Selected Item */}
                        {assignmentType === "team" && selectedAssignment.performance && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedAssignment.performance.zoneCoverage > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {selectedAssignment.performance.zoneCoverage > 0 ? '✓ Assigned' : '○ Unassigned'}
                            </span>
                            {selectedAssignment.performance.zoneCoverage > 0 && (
                              <span className="text-xs text-blue-700 ml-2">
                                🗺️ {selectedAssignment.performance.zoneCoverage} zone(s)
                              </span>
                            )}
                          </div>
                        )}
                        
                        {assignmentType === "individual" && selectedAssignment.assignmentSummary && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedAssignment.assignmentSummary.currentAssignmentStatus === 'ASSIGNED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {selectedAssignment.assignmentSummary.currentAssignmentStatus === 'ASSIGNED' ? '✓ Assigned' : '○ Unassigned'}
                            </span>
                            {selectedAssignment.assignmentSummary.assignmentDetails && (
                              <span className="text-xs text-blue-700 ml-2">
                                {selectedAssignment.assignmentSummary.assignmentDetails.totalAssignments} assignment(s)
                              </span>
                            )}
                          </div>
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
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Step 2:</strong> Optionally assign the territory to a sales representative. You can skip this step and assign later.
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormStep(1)}
                className="px-8 border-gray-300 hover:bg-gray-50 py-2.5"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
                disabled={!selectedAssignment || !assignedDate || !savedTerritoryId || isAssigningTerritory}
              >
                {isAssigningTerritory ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Assign Territory
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleStep2Submit}
                className="px-8 border-gray-300 hover:bg-gray-50 py-2.5"
                disabled={isAssigningTerritory}
              >
                Skip for Now
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
