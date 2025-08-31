"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, MapPin, Users, User, Building, CheckCircle, AlertCircle, Map, Calendar } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"
import { 
  getCityNeighbourhoodsDynamic, 
  getStreetsInNeighbourhood, 
  getStreetsInNeighbourhoodByName,
  getStreetsInNeighbourhoodGoogle
} from '@/utils/osm'

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
  // Form state
  const [formStep, setFormStep] = useState(1)
  const [territoryName, setTerritoryName] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState("")
  const [selectedStreets, setSelectedStreets] = useState<string[]>([])
  const [territoryDescription, setTerritoryDescription] = useState("")
  const [streetInputValue, setStreetInputValue] = useState("")
  const [assignedRep, setAssignedRep] = useState("")
  const [assignedDate, setAssignedDate] = useState("")

  // Google Places state
  const [citySuggestions, setCitySuggestions] = useState<PlaceSuggestion[]>([])
  const [neighbourhoodSuggestions, setNeighbourhoodSuggestions] = useState<PlaceSuggestion[]>([])
  const [streetSuggestions, setStreetSuggestions] = useState<PlaceSuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showNeighbourhoodSuggestions, setShowNeighbourhoodSuggestions] = useState(false)
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false)
  const [showResultsPanel, setShowResultsPanel] = useState(false)
  const [activeSearchField, setActiveSearchField] = useState<string>("")

  // Processing state
  const [isDetectingResidents, setIsDetectingResidents] = useState(false)
  const [isSavingTerritory, setIsSavingTerritory] = useState(false)
  const [isLoadingNeighbourhoods, setIsLoadingNeighbourhoods] = useState(false)
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

  // Add new state variables for assignment functionality
  const [assignmentType, setAssignmentType] = useState<"team" | "individual">("team")
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("")
  const [assignmentSearchResults, setAssignmentSearchResults] = useState<any[]>([])
  const [isSearchingAssignment, setIsSearchingAssignment] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

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

  // Search cities
  const searchCities = useCallback(async (query: string) => {
    if (!autocompleteService || query.length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    try {
      const request = {
        input: query,
        types: ['(cities)'],
        componentRestrictions: { country: 'ca' } // Canada
      }

      autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setCitySuggestions(predictions.slice(0, 5))
          setShowCitySuggestions(true)
        } else {
          setCitySuggestions([])
          setShowCitySuggestions(false)
        }
      })
    } catch (error) {
      console.error('Error searching cities:', error)
      setCitySuggestions([])
      setShowCitySuggestions(false)
    }
  }, [autocompleteService])

  // Search neighbourhoods using OpenStreetMap (OSM)
  const searchNeighbourhoods = useCallback(async (query: string) => {
    console.log('searchNeighbourhoods called with:', query)
    console.log('selectedCity:', selectedCity)
    
    if (!query.trim()) {
      console.log('Search conditions not met - query:', query)
      // If we have existing suggestions, show them all
      if (neighbourhoodSuggestions.length > 0) {
        setShowNeighbourhoodSuggestions(true)
      } else {
        setNeighbourhoodSuggestions([])
        setShowNeighbourhoodSuggestions(false)
      }
      return
    }

    // If we already have neighbourhoods loaded, filter them
    if (neighbourhoodSuggestions.length > 0) {
      console.log('Filtering existing neighbourhoods for query:', query)
      const filtered = neighbourhoodSuggestions.filter(suggestion => 
        suggestion.structured_formatting.main_text.toLowerCase().includes(query.toLowerCase())
      )
      console.log('Filtered neighbourhoods:', filtered)
      setNeighbourhoodSuggestions(filtered)
      setShowNeighbourhoodSuggestions(filtered.length > 0)
      return
    }

    // If no existing suggestions, make API call
    setIsLoadingNeighbourhoods(true)
    try {
      const cityOnly = selectedCity ? selectedCity.split(',')[0].trim() : ''
      console.log('City context:', cityOnly)
      
      // Use the new dynamic OSM utility
      const neighbourhoods = await getCityNeighbourhoodsDynamic(cityOnly, query)
      console.log('OSM neighbourhoods found:', neighbourhoods)

      if (neighbourhoods.length > 0) {
        // Convert to the format expected by the component
        const formattedNeighbourhoods = neighbourhoods.map((neighbourhood) => ({
          place_id: neighbourhood.id,
          description: `${neighbourhood.name}, ${cityOnly}`,
          structured_formatting: {
            main_text: neighbourhood.name,
            secondary_text: `${cityOnly}, Canada`
          }
        }))

        console.log('Formatted neighbourhoods:', formattedNeighbourhoods)
        setNeighbourhoodSuggestions(formattedNeighbourhoods.slice(0, 10))
        setShowNeighbourhoodSuggestions(true)
      } else {
        // Fallback to Google Places API
        console.log('No OSM results, using Google Places API')
        await searchNeighbourhoodsGoogle(query)
      }

    } catch (error) {
      console.error('Error searching neighbourhoods:', error)
      // Fallback to Google Places API
      console.log('OSM error, using Google Places API')
      await searchNeighbourhoodsGoogle(query)
    } finally {
      setIsLoadingNeighbourhoods(false)
    }
  }, [selectedCity, neighbourhoodSuggestions])

  // Fallback to Google Places API
  const searchNeighbourhoodsGoogle = useCallback(async (query: string) => {
    if (!autocompleteService) {
      setNeighbourhoodSuggestions([])
      setShowNeighbourhoodSuggestions(false)
      return
    }

    try {
      const cityOnly = selectedCity ? selectedCity.split(',')[0].trim() : ''
      
      const searchQueries = [
        `${cityOnly} ${query}`,
        `${query} ${cityOnly}`,
        query
      ]

      let allPredictions: PlaceSuggestion[] = []

      for (const searchQuery of searchQueries) {
        try {
          const request = {
            input: searchQuery,
            types: ['sublocality', 'locality'],
            componentRestrictions: { country: 'ca' }
          }

          const predictions = await new Promise<PlaceSuggestion[]>((resolve, reject) => {
            autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions)
              } else {
                resolve([])
              }
            })
          })

          if (predictions && predictions.length > 0) {
            allPredictions = [...allPredictions, ...predictions]
          }
        } catch (error) {
          console.log(`Google Places API query "${searchQuery}" failed:`, error)
          continue
        }
      }

      if (allPredictions.length > 0) {
        const uniquePredictions = allPredictions.filter((prediction, index, self) => 
          index === self.findIndex(p => p.place_id === prediction.place_id)
        )

        const filteredPredictions = uniquePredictions.filter(prediction => {
          const description = prediction.description.toLowerCase()
          const cityLower = selectedCity.toLowerCase()
          return description !== cityLower
        })
        
        setNeighbourhoodSuggestions(filteredPredictions.slice(0, 10))
        setShowNeighbourhoodSuggestions(true)
      } else {
        setNeighbourhoodSuggestions([])
        setShowNeighbourhoodSuggestions(false)
      }
    } catch (error) {
      console.error('Error with Google Places API fallback:', error)
      setNeighbourhoodSuggestions([])
      setShowNeighbourhoodSuggestions(false)
    }
  }, [autocompleteService, selectedCity])

  // Search streets
  const searchStreets = useCallback(async (query: string) => {
    console.log('searchStreets called with:', query)
    console.log('selectedNeighbourhood:', selectedNeighbourhood)
    
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
      if (selectedNeighbourhood && selectedCity) {
        const cityOnly = selectedCity.split(',')[0].trim()
        console.log('City context for street search:', cityOnly)
        
        // Try to get streets using the neighbourhood name
        const streets = await getStreetsInNeighbourhoodByName(selectedNeighbourhood, cityOnly)
        console.log('OSM streets found:', streets)

        if (streets.length > 0) {
          // Convert to the format expected by the component
          const formattedStreets = streets.map((street) => ({
            place_id: street.id,
            description: `${street.name}, ${selectedNeighbourhood}`,
            structured_formatting: {
              main_text: street.name,
              secondary_text: `${selectedNeighbourhood}, ${cityOnly}`
            }
          }))

          console.log('Formatted streets:', formattedStreets)
          setStreetSuggestions(formattedStreets.slice(0, 100))
          setShowStreetSuggestions(true)
        } else {
          // Fallback to Google Places API
          console.log('No OSM results, using Google Places API')
          await searchStreetsGoogle(query)
        }
      } else {
        // Fallback to Google Places API
        console.log('No neighbourhood selected, using Google Places API')
        await searchStreetsGoogle(query)
      }

    } catch (error) {
      console.error('Error searching streets:', error)
      // Fallback to Google Places API
      console.log('OSM error, using Google Places API')
      await searchStreetsGoogle(query)
    } finally {
      setIsLoadingStreets(false)
    }
  }, [selectedNeighbourhood, selectedCity, streetSuggestions])

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

  // Auto-fetch neighbourhoods when city is selected
  const autoFetchNeighbourhoods = useCallback(async (cityName: string) => {
    if (!autocompleteService) return

    setIsLoadingNeighbourhoods(true)
    try {
      // Extract just the city name without province/country
      const cityOnly = cityName.split(',')[0].trim()
      
      // Try multiple search strategies since Google doesn't provide comprehensive neighbourhood lists
      const searchQueries = [
        `${cityOnly} neighbourhoods`,
        `${cityOnly} communities`,
        `${cityOnly} districts`,
        `${cityOnly} areas`
      ]

      let allPredictions: PlaceSuggestion[] = []

      for (const query of searchQueries) {
        try {
          const request = {
            input: query,
            types: ['sublocality', 'locality'],
            componentRestrictions: { country: 'ca' }
          }

          const predictions = await new Promise<PlaceSuggestion[]>((resolve, reject) => {
            autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions)
              } else {
                resolve([]) // Don't reject, just return empty array
              }
            })
          })

          if (predictions && predictions.length > 0) {
            allPredictions = [...allPredictions, ...predictions]
          }
        } catch (error) {
          console.log(`Search query "${query}" failed:`, error)
          continue
        }
      }

      if (allPredictions.length > 0) {
        // Remove duplicates and filter out city-level results
        const uniquePredictions = allPredictions.filter((prediction, index, self) => 
          index === self.findIndex(p => p.place_id === prediction.place_id)
        )

        const filteredPredictions = uniquePredictions.filter(prediction => {
          const description = prediction.description.toLowerCase()
          const cityLower = cityName.toLowerCase()
          const cityOnlyLower = cityOnly.toLowerCase()
          
          // Exclude the city itself and province/country level results
          return description !== cityLower &&
                 !description.includes('canada') && 
                 !description.includes('province') &&
                 !description.includes(cityOnlyLower + ',') // Exclude "City, Province" format
        })
        
        setNeighbourhoodSuggestions(filteredPredictions.slice(0, 15))
        setShowNeighbourhoodSuggestions(true)
      } else {
        setNeighbourhoodSuggestions([])
        setShowNeighbourhoodSuggestions(false)
      }
    } catch (error) {
      console.error('Error auto-fetching neighbourhoods:', error)
      setNeighbourhoodSuggestions([])
      setShowNeighbourhoodSuggestions(false)
    } finally {
      setIsLoadingNeighbourhoods(false)
    }
  }, [autocompleteService])

  // Auto-fetch streets when neighbourhood is selected
  const autoFetchStreets = useCallback(async (neighbourhoodName: string) => {
    if (!autocompleteService) return

    setIsLoadingStreets(true)
    try {
      const request = {
        input: `${neighbourhoodName}`,
        types: ['route'],
        componentRestrictions: { country: 'ca' }
      }

      const predictions = await new Promise<PlaceSuggestion[]>((resolve, reject) => {
        autocompleteService.getPlacePredictions(request, (predictions: PlaceSuggestion[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions)
          } else {
            reject(new Error(`Status: ${status}`))
          }
        })
      })

      if (predictions && predictions.length > 0) {
        setStreetSuggestions(predictions.slice(0, 30)) // Show more street options
        setShowStreetSuggestions(true)
        setNoStreetsFound(false)
      } else {
        setStreetSuggestions([])
        setNoStreetsFound(true)
      }
    } catch (error) {
      console.error('Error auto-fetching streets:', error)
      setStreetSuggestions([])
      setNoStreetsFound(true)
    } finally {
      setIsLoadingStreets(false)
    }
  }, [autocompleteService])

  // Auto-load neighbourhoods when city is selected
  const loadNeighbourhoodsForCity = useCallback(async (cityName: string) => {
    if (!cityName) {
      setNeighbourhoodSuggestions([])
      setShowNeighbourhoodSuggestions(false)
      return
    }

    console.log('🔄 Auto-loading neighbourhoods for city:', cityName)
    setIsLoadingNeighbourhoods(true)
    
    try {
      const cityOnly = cityName.split(',')[0].trim()
      console.log('City context for auto-load:', cityOnly)
      
      // Get all neighbourhoods for the city (no query filter)
      const neighbourhoods = await getCityNeighbourhoodsDynamic(cityOnly)
      console.log('Auto-loaded neighbourhoods:', neighbourhoods)

      if (neighbourhoods.length > 0) {
        // Convert to the format expected by the component
        const formattedNeighbourhoods = neighbourhoods.map((neighbourhood) => ({
          place_id: neighbourhood.id,
          description: `${neighbourhood.name}, ${cityOnly}`,
          structured_formatting: {
            main_text: neighbourhood.name,
            secondary_text: `${cityOnly}, Canada`
          }
        }))

        console.log('Auto-formatted neighbourhoods:', formattedNeighbourhoods)
        setNeighbourhoodSuggestions(formattedNeighbourhoods.slice(0, 10))
        setShowNeighbourhoodSuggestions(true)
      } else {
        console.log('No neighbourhoods found for city, clearing suggestions')
        setNeighbourhoodSuggestions([])
        setShowNeighbourhoodSuggestions(false)
      }

    } catch (error) {
      console.error('Error auto-loading neighbourhoods:', error)
      setNeighbourhoodSuggestions([])
      setShowNeighbourhoodSuggestions(false)
    } finally {
      setIsLoadingNeighbourhoods(false)
    }
  }, [])

  // Auto-load streets when neighbourhood is selected
  const loadStreetsForNeighbourhood = useCallback(async (neighbourhoodName: string) => {
    if (!selectedCity) return

    setIsLoadingStreets(true)
    try {
      console.log('🔄 Auto-loading streets for neighbourhood:', neighbourhoodName)
      
      // Extract just the city name without province/country
      const cityOnly = selectedCity.split(',')[0].trim()
      console.log('City context for street search:', cityOnly)

      // Try OSM first
      const streets = await getStreetsInNeighbourhoodByName(neighbourhoodName, cityOnly)
      
      if (streets.length > 0) {
        // Convert to the format expected by the component
        const formattedStreets = streets.map((street) => ({
          place_id: street.id,
          description: `${street.name}, ${neighbourhoodName}`,
          structured_formatting: {
            main_text: street.name,
            secondary_text: `${neighbourhoodName}, ${cityOnly}`
          }
        }))

        console.log('Auto-formatted streets:', formattedStreets)
        setStreetSuggestions(formattedStreets.slice(0, 100)) // Show more streets
        setShowStreetSuggestions(true)
      } else {
        console.log('No OSM streets found, trying Google Roads API...')
        
        // Try the comprehensive Google Roads API approach (temporarily disabled due to billing requirements)
        console.log('🔄 Google Roads API temporarily disabled - requires billing setup')
        console.log('📋 To enable: Go to https://console.cloud.google.com/billing and link a billing account')
        
        // Uncomment this section once billing is set up:
        /*
        try {
          const googleStreets = await getStreetsInNeighbourhoodGoogle(neighbourhoodName, cityOnly)
          
          if (googleStreets.length > 0) {
            console.log('✅ Google Roads API found streets:', googleStreets.length)
            
            const formattedGoogleStreets = googleStreets.map(street => ({
              place_id: street.id,
              description: `${street.name}, ${neighbourhoodName}`,
              structured_formatting: {
                main_text: street.name,
                secondary_text: `${neighbourhoodName}, ${cityOnly}`
              }
            }))
            
            console.log('Auto-formatted Google streets:', formattedGoogleStreets)
            setStreetSuggestions(formattedGoogleStreets.slice(0, 100)) // Show more streets
            setShowStreetSuggestions(true)
            return
          }
        } catch (googleError) {
          console.log('💥 Google Roads API failed:', googleError)
          
          // Show user-friendly error message
          if (googleError instanceof Error && googleError.message.includes('403')) {
            toast.error('Google Roads API not enabled. Please contact support to enable this feature.')
          }
        }
        */
        
        // Fallback to Google Places API
        if (autocompleteService) {
          const request = {
            input: `${neighbourhoodName} streets`,
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
              
              setStreetSuggestions(cleanedPredictions)
              setShowStreetSuggestions(true)
              console.log('Google Places fallback streets:', cleanedPredictions)
            } else {
              console.log('No streets found for neighbourhood, clearing suggestions')
              setStreetSuggestions([])
              setShowStreetSuggestions(false)
            }
          })
        } else {
          console.log('No streets found for neighbourhood, clearing suggestions')
          setStreetSuggestions([])
          setShowStreetSuggestions(false)
        }
      }

    } catch (error) {
      console.error('Error auto-loading streets:', error)
      setStreetSuggestions([])
      setShowStreetSuggestions(false)
    } finally {
      setIsLoadingStreets(false)
    }
  }, [selectedCity, autocompleteService])

  // Close all dropdowns and panels
  const closeAllDropdowns = () => {
    setShowCitySuggestions(false)
    setShowNeighbourhoodSuggestions(false)
    setShowStreetSuggestions(false)
    setShowResultsPanel(false)
  }

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if click is outside any dropdown container
      const isOutsideCityDropdown = !target.closest('[data-dropdown="city"]')
      const isOutsideNeighbourhoodDropdown = !target.closest('[data-dropdown="neighbourhood"]')
      const isOutsideStreetDropdown = !target.closest('[data-dropdown="street"]')
      
      if (isOutsideCityDropdown) {
        setShowCitySuggestions(false)
      }
      if (isOutsideNeighbourhoodDropdown) {
        setShowNeighbourhoodSuggestions(false)
      }
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

  // Handle city selection
  const handleCitySelect = (city: PlaceSuggestion) => {
    setSelectedCity(city.description)
    setShowCitySuggestions(false)
    setSelectedNeighbourhood("")
    setSelectedStreets([])
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setNoStreetsFound(false)
    setStreetSuggestions([])
    setNeighbourhoodSuggestions([])
    // Auto-fetch neighbourhoods immediately when city is selected
    autoFetchNeighbourhoods(city.description)
    // Auto-load neighbourhoods for the selected city
    loadNeighbourhoodsForCity(city.description)
  }

  // Handle neighbourhood selection
  const handleNeighbourhoodSelect = (neighbourhood: PlaceSuggestion) => {
    setSelectedNeighbourhood(neighbourhood.description)
    setShowNeighbourhoodSuggestions(false)
    setSelectedStreets([])
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setNoStreetsFound(false)
    setStreetSuggestions([])
    
    // Auto-fetch streets for the selected neighbourhood
    autoFetchStreets(neighbourhood.description)
    // Auto-load streets for the selected neighbourhood
    loadStreetsForNeighbourhood(neighbourhood.description)
  }



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

  // Enhanced resident detection with multi-source approach
  const detectResidentsFromStreets = useCallback(async () => {
    if (selectedStreets.length === 0 || !placesService) return

    setIsDetectingResidents(true)
    setDetectedResidents([])
    toast.info('🚀 Starting enhanced resident detection...')

    try {
      const allResidents: DetectedResident[] = []
      const streetCoordinates: [number, number][] = []

      console.log('🔍 Starting enhanced detection for', selectedStreets.length, 'streets')

             // STEP 1: Collect all street coordinates FIRST
       for (const streetId of selectedStreets) {
         console.log(`📍 Collecting coordinates for street ID: ${streetId}`)
         
         if (streetId.startsWith('osm_way_')) {
           // Use OSM API for OSM streets
           try {
             const streetInfo = await getOsmStreetInfo(streetId)
             streetCoordinates.push([streetInfo.lat, streetInfo.lon])
             console.log('✅ OSM street coordinates collected:', streetInfo.lat, streetInfo.lon)
           } catch (error) {
             console.error('❌ OSM street coordinates failed:', error)
           }
         } else {
           // Use Google Places API for Google streets
           try {
             const request = {
               placeId: streetId,
               fields: ['geometry']
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

             const location = result.geometry.location
             streetCoordinates.push([location.lat(), location.lng()])
             console.log('✅ Google Places street coordinates collected:', location.lat(), location.lng())
           } catch (error) {
             console.error('❌ Google Places street coordinates failed:', error)
           }
         }
       }

       // STEP 2: Generate enhanced polygon from collected coordinates
       let enhancedPolygon: any = null
       if (streetCoordinates.length > 0) {
         enhancedPolygon = generateEnhancedPolygon(streetCoordinates)
         setGeneratedPolygon(enhancedPolygon)
         console.log('🗺️ Enhanced polygon generated for geospatial validation')
       }

       // STEP 3: Now process each selected street with enhanced detection (with polygon available)
       for (const streetId of selectedStreets) {
         console.log(`📍 Processing street ID: ${streetId}`)
         
         // Dual data source support
         let streetInfo: any = null
         let streetName = ''
         
         if (streetId.startsWith('osm_way_')) {
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
           } catch (error) {
             console.error('❌ Google Places street info failed:', error)
             continue
           }
         }

         // Enhanced building detection with multiple approaches (now with geospatial validation)
         const streetResidents = await searchResidentialBuildings(streetInfo, streetName, enhancedPolygon)
         const reverseGeocodeResidents = await reverseGeocodeResidentialBuildings(streetInfo, streetName, enhancedPolygon)
        
        // Combine and deduplicate residents
        const combinedResidents = [...streetResidents, ...reverseGeocodeResidents]
        const uniqueResidents = deduplicateResidents(combinedResidents)
        
        // Apply sequential number detection
        const sequentialResidents = await detectSequentialHouseNumbers(uniqueResidents, streetName)
        
        allResidents.push(...sequentialResidents)
        
        console.log(`✅ Street "${streetName}" processed: ${sequentialResidents.length} residents found`)
        toast.success(`Found ${sequentialResidents.length} residents on ${streetName}`)
      }

      

       // Calculate area and density
       const area = calculateTerritoryArea(enhancedPolygon || [])
       const density = allResidents.length / (area || 1)
       
       setTerritoryArea(area)
       setBuildingDensity(density)
       setDetectedResidents(allResidents)
       
       console.log(`🎉 Enhanced detection completed: ${allResidents.length} residents from ${selectedStreets.length} streets`)
       console.log(`📊 Territory stats: Area: ${area.toFixed(2)} ha, Density: ${density.toFixed(1)} buildings/ha`)
       console.log(`📊 API Call Statistics: ${apiCallCount} total API calls made`)
       
       // Enhanced success toast with detailed stats
       toast.success(`✅ Enhanced detection complete! Found ${allResidents.length} residents across ${selectedStreets.length} streets. Area: ${area.toFixed(2)} ha, Density: ${density.toFixed(1)} buildings/ha`)
       
       // API call statistics
       toast.info(`📊 Detection used ${apiCallCount} API calls across multiple data sources`)
      
    } catch (error) {
      console.error('❌ Enhanced detection failed:', error)
      toast.error('Error during enhanced resident detection')
    } finally {
      setIsDetectingResidents(false)
    }
  }, [selectedStreets, placesService, selectedNeighbourhood, selectedCity])

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
               { lat: buildingLocation.lat(), lng: buildingLocation.lng() }, 
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
                { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() }, 
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

  // Generate enhanced polygon
  const generateEnhancedPolygon = (streetCoordinates: [number, number][]) => {
    if (streetCoordinates.length === 0) {
      console.log('⚠️ No street coordinates provided for polygon generation')
      return []
    }
    
    console.log('🗺️ Generating polygon from', streetCoordinates.length, 'street coordinates')
    
    const bounds = new window.google.maps.LatLngBounds()
    streetCoordinates.forEach(([lat, lng]) => {
      bounds.extend(new window.google.maps.LatLng(lat, lng))
    })

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const padding = 0.005 // Increased padding for better coverage

    const polygon = [
      { lat: ne.lat() + padding, lng: sw.lng() - padding },
      { lat: ne.lat() + padding, lng: ne.lng() + padding },
      { lat: sw.lat() - padding, lng: ne.lng() + padding },
      { lat: sw.lat() - padding, lng: sw.lng() - padding },
    ]
    
    console.log('🗺️ Generated polygon with', polygon.length, 'coordinates:', polygon)
    return polygon
  }

  // Calculate territory area
  const calculateTerritoryArea = (polygonCoords: { lat: number, lng: number }[]): number => {
    if (!polygonCoords || polygonCoords.length < 3) {
      console.log('⚠️ Not enough polygon coordinates for area calculation:', polygonCoords?.length || 0)
      return 0
    }
    
    console.log('📊 Calculating area for polygon with', polygonCoords.length, 'coordinates')
    console.log('📊 Polygon coordinates:', polygonCoords)
    
    try {
      // Check if Google Maps Geometry Library is available
      if (window.google?.maps?.geometry?.spherical?.computeArea) {
        console.log('✅ Using Google Maps Geometry Library for area calculation')
        
        // Ensure polygon is closed (first and last points should be the same)
        let closedCoords = [...polygonCoords]
        if (closedCoords.length > 0) {
          const first = closedCoords[0]
          const last = closedCoords[closedCoords.length - 1]
          if (first.lat !== last.lat || first.lng !== last.lng) {
            closedCoords.push({ lat: first.lat, lng: first.lng })
            console.log('🔧 Closed polygon by adding first point at end')
          }
        }
        
        const latLngCoords = closedCoords.map(coord => 
          new window.google.maps.LatLng(coord.lat, coord.lng)
        )
        
        const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(latLngCoords)
        const areaInHectares = areaInSquareMeters / 10000
        console.log('📊 Google Maps area calculation:', areaInSquareMeters, 'sq meters =', areaInHectares, 'hectares')
        console.log('📊 Closed polygon coordinates used:', closedCoords.length, 'points')
        return areaInHectares
      } else {
        console.log('⚠️ Google Maps Geometry Library not available, using fallback calculation')
        
        // Fallback calculation using bounding box
        const lats = polygonCoords.map(p => p.lat)
        const lngs = polygonCoords.map(p => p.lng)
        const latDiff = Math.max(...lats) - Math.min(...lats)
        const lngDiff = Math.max(...lngs) - Math.min(...lngs)
        
        // Convert to meters (1 degree ≈ 111,000 meters)
        const areaInSquareMeters = latDiff * lngDiff * 111000 * 111000
        const areaInHectares = areaInSquareMeters / 10000
        
        console.log('📊 Fallback area calculation:', areaInSquareMeters, 'sq meters =', areaInHectares, 'hectares')
        console.log('📊 Bounding box:', { latDiff, lngDiff, lats, lngs })
        return areaInHectares
      }
      
    } catch (error) {
      console.error('❌ Area calculation failed:', error)
      
      // Emergency fallback: use a simple bounding box calculation
      try {
        const lats = polygonCoords.map(p => p.lat)
        const lngs = polygonCoords.map(p => p.lng)
        const latDiff = Math.max(...lats) - Math.min(...lats)
        const lngDiff = Math.max(...lngs) - Math.min(...lngs)
        const areaInSquareMeters = latDiff * lngDiff * 111000 * 111000
        const areaInHectares = areaInSquareMeters / 10000
        console.log('📊 Emergency fallback area calculation:', areaInHectares, 'hectares')
        return areaInHectares
      } catch (fallbackError) {
        console.error('❌ Emergency fallback also failed:', fallbackError)
        return 0
      }
    }
  }

  // Enhanced residential address validation with geospatial check
  const isResidentialAddress = (
    coords: { lat: number; lng: number }, 
    territoryPolygon: { lat: number; lng: number }[]
  ): boolean => {
    if (!territoryPolygon || territoryPolygon.length < 3) {
      console.log('⚠️ No valid territory polygon for geospatial validation')
      return false
    }
    
    try {
      // Use Google Maps geometry library for point-in-polygon check
      if (window.google?.maps?.geometry?.poly) {
        const point = new window.google.maps.LatLng(coords.lat, coords.lng)
        const polygon = territoryPolygon.map(coord => 
          new window.google.maps.LatLng(coord.lat, coord.lng)
        )
        
        const googlePolygon = new window.google.maps.Polygon({ paths: polygon })
        const isInside = window.google.maps.geometry.poly.containsLocation(point, googlePolygon)
        
        console.log(`📍 Geospatial check: (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}) inside polygon: ${isInside}`)
        return isInside
      }
      
      // Fallback: simple bounding box check
      const bounds = new window.google.maps.LatLngBounds()
      territoryPolygon.forEach(coord => 
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng))
      )
      const isInside = bounds.contains(new window.google.maps.LatLng(coords.lat, coords.lng))
      
      console.log(`📍 Bounding box check: (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}) inside bounds: ${isInside}`)
      return isInside
      
    } catch (error) {
      console.error('❌ Geospatial validation failed:', error)
      return false
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
              { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() }, 
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
    setSelectedCity("")
    setSelectedNeighbourhood("")
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
  }, [])

  // Handle modal close
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Handle step 1 submit - Save territory and advance to assignment step
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (territoryName.trim() && selectedCity && selectedNeighbourhood && selectedStreets.length > 0 && detectedResidents.length > 0) {
      // Call saveTerritory function which will handle the API call
      await saveTerritory()
    }
  }

  // Handle step 2 submit - Assign territory (optional)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Assignment is optional - user can skip or assign
    if (selectedAssignment && assignedDate) {
      // TODO: Implement assignment logic here
      console.log('Assigning territory to:', selectedAssignment, 'on date:', assignedDate)
      toast.success('Territory assigned successfully!')
    }
    
    // Always call onTerritorySaved and close modal after step 2
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
                
                                 <div className="space-y-2">
                   <Label htmlFor="selectedCity" className="text-sm font-medium text-gray-700">
                     City *
                   </Label>
                   <div className="relative" data-dropdown="city">
                    <Input
                      id="selectedCity"
                      type="text"
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value)
                        if (e.target.value.length >= 2) {
                          searchCities(e.target.value)
                          setShowCitySuggestions(true)
                          setShowResultsPanel(false)
                        } else {
                          setShowCitySuggestions(false)
                          setShowResultsPanel(false)
                        }
                      }}
                      onFocus={() => {
                        if (selectedCity.length >= 2) {
                          searchCities(selectedCity)
                          setShowCitySuggestions(true)
                          setShowResultsPanel(false)
                        }
                      }}
                      placeholder="Search for a city"
                      className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {citySuggestions.map((city) => (
                          <button
                            key={city.place_id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCitySelect(city)}
                          >
                            <div className="font-medium text-blue-600">{city.structured_formatting.main_text}</div>
                            <div className="text-sm text-gray-500">{city.structured_formatting.secondary_text}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                                 <div className="space-y-2">
                   <Label htmlFor="selectedNeighbourhood" className="text-sm font-medium text-gray-700">
                     Neighbourhood/Area *
                   </Label>
                   <div className="relative" data-dropdown="neighbourhood">
                    <Input
                      id="selectedNeighbourhood"
                      type="text"
                      value={selectedNeighbourhood}
                      onChange={(e) => {
                        console.log('Neighbourhood input onChange - value:', e.target.value)
                        console.log('selectedCity:', selectedCity)
                        console.log('value length:', e.target.value.length)
                        
                        setSelectedNeighbourhood(e.target.value)
                        
                        // If we have a city selected, show suggestions immediately
                        if (selectedCity && e.target.value.length >= 1) {
                          console.log('Calling searchNeighbourhoods with:', e.target.value)
                          searchNeighbourhoods(e.target.value)
                          setShowNeighbourhoodSuggestions(true)
                          setShowResultsPanel(false)
                        } else if (selectedCity && e.target.value.length === 0) {
                          // If user clears the input, show all available neighbourhoods
                          console.log('Input cleared, showing all neighbourhoods')
                          if (neighbourhoodSuggestions.length > 0) {
                            setShowNeighbourhoodSuggestions(true)
                          } else {
                            setShowNeighbourhoodSuggestions(false)
                          }
                          setShowResultsPanel(false)
                        } else {
                          console.log('Not calling searchNeighbourhoods - conditions not met')
                          setShowNeighbourhoodSuggestions(false)
                          setShowResultsPanel(false)
                        }
                      }}
                      onFocus={() => {
                        if (selectedCity && selectedNeighbourhood.length >= 1) {
                          searchNeighbourhoods(selectedNeighbourhood)
                          setShowNeighbourhoodSuggestions(true)
                          setShowResultsPanel(false)
                        } else if (selectedCity && neighbourhoodSuggestions.length > 0) {
                          setShowNeighbourhoodSuggestions(true)
                          setShowResultsPanel(false)
                        }
                      }}
                      placeholder={
                        !selectedCity 
                          ? "Select a city first" 
                          : isLoadingNeighbourhoods 
                            ? "Loading neighbourhoods..." 
                            : neighbourhoodSuggestions.length > 0 
                              ? "Type to filter or select from list" 
                              : "Type to search for areas or enter manually"
                      }
                      className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                      disabled={!selectedCity || isLoadingNeighbourhoods}
                    />
                    {isLoadingNeighbourhoods && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {showNeighbourhoodSuggestions && neighbourhoodSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                          Suggested Areas (you can also type manually)
                        </div>
                        {neighbourhoodSuggestions.map((neighbourhood) => (
                          <button
                            key={neighbourhood.place_id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleNeighbourhoodSelect(neighbourhood)}
                          >
                            <div className="font-medium text-blue-600">{neighbourhood.structured_formatting.main_text}</div>
                            <div className="text-sm text-gray-500">{neighbourhood.structured_formatting.secondary_text}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showNeighbourhoodSuggestions && neighbourhoodSuggestions.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                        <div className="text-sm text-gray-600">
                          No suggestions found. You can type the neighbourhood name manually.
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    🗺️ Using OpenStreetMap data for comprehensive neighbourhood search. Results include official neighbourhoods, suburbs, and administrative areas.
                  </p>
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
                      
                      // If we have a neighbourhood selected, show suggestions immediately
                      if (selectedNeighbourhood && e.target.value.length >= 1) {
                        console.log('Calling searchStreets with:', e.target.value)
                        searchStreets(e.target.value)
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      } else if (selectedNeighbourhood && e.target.value.length === 0) {
                        // If user clears the input, show all available streets
                        console.log('Input cleared, showing all streets')
                        if (streetSuggestions.length > 0) {
                          setShowStreetSuggestions(true)
                        } else {
                          setShowStreetSuggestions(false)
                        }
                        setShowResultsPanel(false)
                      } else {
                        console.log('Not calling searchStreets - conditions not met')
                        setShowStreetSuggestions(false)
                        setShowResultsPanel(false)
                      }
                    }}
                    onFocus={() => {
                      if (selectedNeighbourhood && streetInputValue.length >= 1) {
                        searchStreets(streetInputValue)
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      } else if (selectedNeighbourhood && streetSuggestions.length > 0) {
                        setShowStreetSuggestions(true)
                        setShowResultsPanel(false)
                      }
                    }}
                    placeholder={
                      !selectedNeighbourhood 
                        ? "Select a neighbourhood first" 
                        : isLoadingStreets 
                          ? "Loading streets..." 
                          : streetSuggestions.length > 0 
                            ? "Type to filter or select from list" 
                            : noStreetsFound 
                              ? "No streets found - try manual search" 
                              : "Search for a street"
                    }
                    className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    disabled={!selectedNeighbourhood || isLoadingStreets}
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
                        No streets found for {selectedNeighbourhood}
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-600">
                        Try searching manually or select a different area.
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Load Manually Button - positioned below and to the right */}
                {selectedNeighbourhood && !isLoadingStreets && (
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('🔄 Loading streets manually for neighbourhood:', selectedNeighbourhood)
                        loadStreetsForNeighbourhood(selectedNeighbourhood)
                      }}
                      className="text-xs px-3 py-1 h-8 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Load Streets Manually
                    </Button>
                  </div>
                )}
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
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Step 1:</strong> Enter territory information and select the geographical area. When you select a city, neighbourhoods will be automatically loaded. You can then search for streets within the selected neighbourhood. Residents will be automatically detected from the selected streets.
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                disabled={!territoryName.trim() || !selectedCity || !selectedNeighbourhood || selectedStreets.length === 0 || detectedResidents.length === 0 || isSavingTerritory}
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
                  <span className="ml-2 text-gray-900">{selectedCity} - {selectedNeighbourhood}</span>
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
                  <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white">
                    {assignmentSearchResults.map((result) => (
                      <div
                        key={result._id || result.id}
                        onClick={() => {
                          setSelectedAssignment(result)
                          setAssignmentSearchQuery(assignmentType === "team" ? result.name : `${result.name} (${result.email})`)
                          setAssignmentSearchResults([])
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
                disabled={!selectedAssignment || !assignedDate || isSavingTerritory}
              >
                {isSavingTerritory ? (
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
                disabled={isSavingTerritory}
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
