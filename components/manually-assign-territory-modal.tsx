"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Users, Building, CheckCircle, AlertCircle, Map } from "lucide-react"
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

  // Google Places services
  const [autocompleteService, setAutocompleteService] = useState<any>(null)
  const [placesService, setPlacesService] = useState<any>(null)

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
      if (!target.closest('.relative')) {
        setShowCitySuggestions(false)
        setShowNeighbourhoodSuggestions(false)
        setShowStreetSuggestions(false)
        setShowResultsPanel(false)
      }
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
    if (!selectedStreets.includes(street.place_id)) {
      setSelectedStreets(prev => [...prev, street.place_id])
    }
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
  }

  // Detect residents when streets are selected
  const detectResidentsFromStreets = useCallback(async () => {
    if (selectedStreets.length === 0 || !placesService) return

    setIsDetectingResidents(true)
    setDetectedResidents([])

    try {
      const allResidents: DetectedResident[] = []
      const streetCoordinates: [number, number][] = []

      // Get coordinates for each selected street
      for (const streetId of selectedStreets) {
        const request = {
          placeId: streetId,
          fields: ['geometry', 'formatted_address', 'name']
        }

        try {
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

          // Get street name
          const streetName = result.name || result.formatted_address.split(',')[0]
          console.log(`Processing street: ${streetName}`)

          // Use nearby search to find actual buildings on this street
          const nearbySearchRequest = {
            location: { lat: location.lat(), lng: location.lng() },
            radius: 500, // 500 meters radius
            type: 'establishment',
            keyword: streetName
          }

          try {
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

            // Process found buildings and extract real building numbers
            buildings.forEach((building, index) => {
              const buildingLocation = building.geometry.location
              const buildingNumber = extractBuildingNumber(building.name || building.formatted_address)
              
              if (buildingNumber > 0) {
                allResidents.push({
                  id: `resident-${streetId}-${building.place_id}`,
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
                console.log(`Found real building: ${buildingNumber} at ${building.formatted_address}`)
              }
            })

            console.log(`Found ${buildings.length} buildings on ${streetName}`)
          } catch (error) {
            console.error('Error searching for buildings:', error)
          }
        } catch (error) {
          console.error('Error getting street details:', error)
        }
      }

      // Generate a polygon around the streets
      if (streetCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        streetCoordinates.forEach(([lat, lng]) => {
          bounds.extend(new window.google.maps.LatLng(lat, lng))
        })

        // Create a rectangular polygon around the streets
        const ne = bounds.getNorthEast()
        const sw = bounds.getSouthWest()
        const padding = 0.001 // Small padding around the streets

        const polygonCoords = [
          { lat: ne.lat() + padding, lng: sw.lng() - padding },
          { lat: ne.lat() + padding, lng: ne.lng() + padding },
          { lat: sw.lat() - padding, lng: ne.lng() + padding },
          { lat: sw.lat() - padding, lng: sw.lng() - padding },
        ]

        setGeneratedPolygon(polygonCoords)
      }

      setDetectedResidents(allResidents)
      console.log(`Detected ${allResidents.length} residents from ${selectedStreets.length} streets`)
    } catch (error) {
      console.error('Error detecting residents:', error)
      toast.error('Error detecting residents')
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

  // Helper function to extract building number from Address Validation API response
  const extractBuildingNumberFromAddressValidation = (address: any): number => {
    console.log('Extracting building number from address:', address)
    
    if (!address) return 0
    
    // Try to get building number from address components first
    if (address.addressComponents) {
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
    if (address.formattedAddress) {
      console.log('Checking formatted address:', address.formattedAddress)
      return extractBuildingNumber(address.formattedAddress)
    }
    
    console.log('No building number found')
    return 0
  }

  // Save territory using existing API
  const saveTerritory = useCallback(async () => {
    if (!territoryName.trim() || !generatedPolygon || detectedResidents.length === 0) {
      toast.error("Please complete all required fields")
      return
    }

    setIsSavingTerritory(true)

    try {
      // Prepare building data for backend (same format as map sidebar)
      const buildingData = {
        addresses: detectedResidents.map(resident => resident.address),
        coordinates: detectedResidents.map(resident => [resident.lng, resident.lat])
      }

      // Call the same API as map sidebar
      const response = await apiInstance.post('/zones/create-zone', {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        boundary: {
          type: 'Polygon',
          coordinates: [generatedPolygon]
        },
        buildingData
      })

      if (response.data.success) {
        const savedTerritory = response.data.data
        
        // Call the callback to notify parent component
        onTerritorySaved(savedTerritory)
        
        // Reset form
        resetForm()
        
        toast.success(`Territory "${territoryName}" saved successfully!`)
      } else {
        throw new Error(response.data.message || 'Failed to save territory')
      }
    } catch (error) {
      console.error('Error saving territory:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message)
          return
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsSavingTerritory(false)
    }
  }, [territoryName, territoryDescription, generatedPolygon, detectedResidents, onTerritorySaved])

  // Reset form
  const resetForm = () => {
    setFormStep(1)
    setTerritoryName("")
    setTerritoryDescription("")
    setSelectedCity("")
    setSelectedNeighbourhood("")
    setSelectedStreets([])
    setStreetInputValue("")
    setAssignedRep("")
    setAssignedDate("")
    setDetectedResidents([])
    setGeneratedPolygon(null)
    setCitySuggestions([])
    setNeighbourhoodSuggestions([])
    setStreetSuggestions([])
    setShowCitySuggestions(false)
    setShowNeighbourhoodSuggestions(false)
    setShowStreetSuggestions(false)
    setShowResultsPanel(false)
    setIsLoadingNeighbourhoods(false)
    setIsLoadingStreets(false)
    setNoStreetsFound(false)
  }

  // Handle modal close
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Handle step 1 submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (territoryName.trim() && selectedCity && selectedNeighbourhood && selectedStreets.length > 0) {
      setFormStep(2)
    }
  }

  // Handle step 2 submit
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (assignedRep && assignedDate) {
      saveTerritory()
    }
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
                  <div className="relative">
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
                  <div className="relative">
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
                <div className="relative">
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
                              {generatedPolygon.length > 0 ? `${Math.round(window.google.maps.geometry.spherical.computeArea(
                                generatedPolygon.map((coord: { lat: number; lng: number }) => new window.google.maps.LatLng(coord.lat, coord.lng))
                              ))} sq meters` : 'Calculating...'}
                            </span>
                          </div>
                          <div>
                            <span>Building Density:</span>
                            <span className="ml-1 font-medium">
                              ~{Math.round(detectedResidents.length / (generatedPolygon.length > 0 ? window.google.maps.geometry.spherical.computeArea(
                                generatedPolygon.map((coord: { lat: number; lng: number }) => new window.google.maps.LatLng(coord.lat, coord.lng))
                              ) / 10000 : 1))} buildings/ha
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
                disabled={!territoryName.trim() || !selectedCity || !selectedNeighbourhood || selectedStreets.length === 0 || detectedResidents.length === 0}
              >
                Next Step
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
                Assignment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedRep" className="text-sm font-medium text-gray-700">
                    Assign to Sales Rep *
                  </Label>
                  <Select value={assignedRep} onValueChange={setAssignedRep} required>
                    <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select sales representative" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-doe">John Doe</SelectItem>
                      <SelectItem value="jane-smith">Jane Smith</SelectItem>
                      <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                      <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assignedDate" className="text-sm font-medium text-gray-700">
                    Assignment Date *
                  </Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Step 2:</strong> Assign the territory to a sales representative and set the assignment date.
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                disabled={!assignedRep || !assignedDate || isSavingTerritory}
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
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
