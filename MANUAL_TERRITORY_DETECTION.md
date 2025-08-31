# Manual Territory Resident Building Detection

## Overview

The Manual Territory Resident Building Detection system in Knockwise allows users to select specific streets and automatically detect all residential buildings along those streets. This system is implemented in the `ManuallyAssignTerritoryModal` component and provides comprehensive residential detection capabilities similar to the polygon-based detection in `TerritoryMap`.

## Key Features

- **Street Selection**: Users can search and select specific streets from a neighborhood
- **Comprehensive Detection**: Detects residential buildings using multiple API approaches
- **Sequential Number Detection**: Identifies missing house numbers using pattern analysis
- **Area Calculation**: Calculates territory area and building density
- **Real-time Validation**: Ensures detected buildings match the selected streets

## Technical Architecture

### 1. Data Sources

The system uses multiple data sources for comprehensive detection:

#### Google Places API
- **Purpose**: Primary source for street information and building detection
- **Usage**: `placesService.getDetails()` for street geometry and `placesService.nearbySearch()` for buildings
- **Limitations**: Requires valid Google Place IDs

#### OpenStreetMap (OSM) API
- **Purpose**: Fallback for streets not available in Google Places
- **Usage**: Nominatim API for street details and Overpass API for building data
- **Format**: Streets with IDs starting with `osm_way_`

#### Google Geocoding API
- **Purpose**: Reverse geocoding for address validation
- **Usage**: `geocoder.geocode()` for coordinate-to-address conversion
- **Validation**: Ensures detected buildings match selected street names

### 2. Core Detection Process

#### Step 1: Street Information Retrieval
```typescript
// Dual data source support
if (streetId.startsWith('osm_way_')) {
  // Use OSM API
  const osmInfo = await getOsmStreetInfo(streetId)
} else {
  // Use Google Places API
  const placeDetails = await getPlaceDetails(streetId)
}
```

#### Step 2: Street Geometry Analysis
- Extracts street path coordinates
- Generates search points along the street length
- Creates perpendicular search lines on both sides

#### Step 3: Building Detection
The system uses three complementary approaches:

##### A. Google Places Nearby Search
```typescript
const searchResidentialBuildings = async (center: LatLng, radius: number = 300) => {
  const searchQueries = [
    'residential buildings',
    'houses',
    'apartments'
  ]
  
  // Search with multiple queries for comprehensive coverage
  for (const query of searchQueries) {
    const results = await placesService.nearbySearch({
      location: center,
      radius: radius,
      type: 'establishment',
      keyword: query
    })
  }
}
```

##### B. Reverse Geocoding
```typescript
const reverseGeocodeResidentialBuildings = async (streetPath: LatLng[]) => {
  const searchPoints = 12 // Increased from 4 for better coverage
  const searchRadius = 200 // Increased from 100m
  
  // Generate search points along street path
  for (let i = 0; i < searchPoints; i++) {
    const point = interpolatePoint(streetPath, i / (searchPoints - 1))
    const results = await geocoder.geocode({
      location: point,
      radius: searchRadius
    })
  }
}
```

##### C. Sequential House Number Detection
```typescript
const detectSequentialHouseNumbers = (existingResidents: DetectedResident[], streetName: string) => {
  // Analyze existing house number patterns
  const patterns = analyzeHouseNumberPatterns(existingResidents)
  
  // Generate missing numbers based on patterns
  const missingNumbers = generateMissingHouseNumbers(existingResidents, patterns, streetName)
  
  // Estimate positions for generated numbers
  const estimatedResidents = missingNumbers.map(number => 
    estimateBuildingPosition(number, existingResidents, patterns)
  )
}
```

### 3. Pattern Analysis

#### House Number Pattern Detection
```typescript
const analyzeHouseNumberPatterns = (residents: DetectedResident[]) => {
  const sortedNumbers = residents
    .map(r => extractHouseNumber(r.address))
    .filter(n => n !== null)
    .sort((a, b) => a - b)
  
  return {
    min: Math.min(...sortedNumbers),
    max: Math.max(...sortedNumbers),
    step: calculateStep(sortedNumbers),
    hasOddEven: detectOddEvenPattern(sortedNumbers)
  }
}
```

#### Sequential Generation
```typescript
const generateMissingHouseNumbers = (residents: DetectedResident[], patterns: any, streetName: string) => {
  const extendRange = 20 // Generate 20 numbers in each direction
  const maxGenerated = Math.min(100, Math.floor(residents.length * 2))
  
  // Generate missing numbers before the minimum
  for (let i = patterns.min - extendRange; i < patterns.min; i += patterns.step) {
    if (generated.length >= maxGenerated) break
    generated.push(i)
  }
  
  // Generate missing numbers after the maximum
  for (let i = patterns.max + patterns.step; i <= patterns.max + extendRange; i += patterns.step) {
    if (generated.length >= maxGenerated) break
    generated.push(i)
  }
}
```

### 4. Area and Density Calculation

#### Territory Area Calculation
```typescript
const calculateTerritoryArea = (polygonCoords: { lat: number, lng: number }[]) => {
  // Use Google Maps Geometry library for accurate area calculation
  if (window.google?.maps?.geometry?.spherical) {
    const latLngCoords = polygonCoords.map(coord => 
      new window.google.maps.LatLng(coord.lat, coord.lng)
    )
    
    const polygon = new window.google.maps.Polygon({
      paths: latLngCoords
    })
    
    const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath())
    return areaInSquareMeters / 10000 // Convert to hectares
  }
  
  // Fallback calculation using bounding box
  return calculateBoundingBoxArea(polygonCoords)
}
```

#### Building Density
```typescript
const buildingDensity = allResidents.length / (areaInHectares || 1)
```

### 5. Validation and Filtering

#### Street Boundary Validation
```typescript
const isResidentialAddress = (address: string, streetName: string) => {
  // Check if address contains the selected street name
  const normalizedAddress = address.toLowerCase()
  const normalizedStreet = streetName.toLowerCase()
  
  return normalizedAddress.includes(normalizedStreet) &&
         !isCommercialEstablishment(address) &&
         hasValidHouseNumber(address)
}
```

#### Address Deduplication
```typescript
const uniqueResidents = allResidents.filter((resident, index, self) => 
  index === self.findIndex(r => 
    r.address.toLowerCase() === resident.address.toLowerCase() ||
    (r.lat === resident.lat && r.lng === resident.lng)
  )
)
```

## User Interface Flow

### 1. Street Selection
1. User enters neighborhood name
2. System fetches available streets using OSM Nominatim API
3. User selects specific streets from dropdown
4. Selected streets are stored in `selectedStreets` state

### 2. Detection Process
1. User clicks "Detect Residential Buildings (Enhanced)" button
2. System processes each selected street:
   - Retrieves street geometry
   - Generates search points
   - Performs building detection
   - Applies sequential number detection
3. Results are displayed in real-time

### 3. Results Display
- **Total Residents**: Count of detected residential buildings
- **Estimated Area**: Calculated territory area in square meters
- **Building Density**: Buildings per hectare
- **Resident List**: Detailed list with addresses and coordinates

## Configuration Parameters

### Search Parameters
- **Google Places Radius**: 300m (increased from 150m)
- **Reverse Geocoding Radius**: 200m (increased from 100m)
- **Search Points**: 12 (increased from 4)
- **Sequential Generation Range**: 20 numbers each direction
- **Maximum Generated Numbers**: 100 or 2x detected residents

### Validation Parameters
- **Street Name Matching**: Case-insensitive partial matching
- **House Number Extraction**: Regex pattern for number detection
- **Commercial Filtering**: Excludes business establishments
- **Coordinate Validation**: Ensures valid latitude/longitude

## Error Handling

### API Rate Limiting
- Implements exponential backoff for failed requests
- Caches successful responses to reduce API calls
- Graceful degradation when APIs are unavailable

### Data Validation
- Validates street IDs before processing
- Handles missing or invalid coordinates
- Provides fallback calculations for area computation

### User Feedback
- Real-time progress indicators
- Detailed error messages
- Console logging for debugging

## Performance Optimizations

### Caching
- Caches street information to avoid repeated API calls
- Stores detection results for reuse
- Implements memoization for expensive calculations

### Batch Processing
- Processes multiple streets concurrently
- Batches API requests where possible
- Implements request queuing to respect rate limits

### Memory Management
- Cleans up unused markers and polygons
- Implements proper state cleanup
- Optimizes large dataset handling

## Integration Points

### TerritoryMap Component
- Shares Google Maps API loading logic
- Uses similar area calculation methods
- Maintains consistent data formats

### Backend API
- Sends detected residents to backend for storage
- Validates territory boundaries
- Integrates with user assignment system

### State Management
- Uses Zustand store for territory data
- Manages UI state independently
- Provides real-time updates

## Future Enhancements

### Planned Improvements
1. **Machine Learning Integration**: Use ML models for better pattern recognition
2. **Historical Data Analysis**: Learn from previous detections
3. **Advanced Filtering**: More sophisticated residential vs commercial detection
4. **Performance Optimization**: Implement virtual scrolling for large datasets
5. **Offline Support**: Cache detection results for offline access

### API Enhancements
1. **Additional Data Sources**: Integrate with more mapping services
2. **Real-time Updates**: Subscribe to building data changes
3. **Batch Processing**: Process multiple territories simultaneously
4. **Advanced Analytics**: Provide detailed territory insights

## Troubleshooting

### Common Issues

#### No Buildings Detected
- Check if street has valid Google Place ID or OSM ID
- Verify API key permissions
- Ensure street name matches exactly

#### Incorrect Area Calculation
- Verify Google Maps Geometry library is loaded
- Check polygon coordinates are valid
- Ensure proper coordinate order (clockwise/counterclockwise)

#### Sequential Generation Issues
- Review house number patterns in detected buildings
- Adjust `extendRange` parameter if needed
- Check for mixed numbering systems

#### Performance Problems
- Reduce search radius if too many results
- Limit number of search points
- Implement pagination for large datasets

### Debug Information
The system provides extensive console logging:
- `🔍` Search process details
- `📍` Search point coordinates
- `🏠` Building detection results
- `📊` Territory analysis statistics
- `⚠️` Warning messages
- `❌` Error details

## Conclusion

The Manual Territory Resident Building Detection system provides a robust, comprehensive solution for automatically detecting residential buildings along selected streets. By combining multiple data sources, implementing intelligent pattern recognition, and providing real-time validation, it ensures accurate and reliable territory analysis for the Knockwise application.
