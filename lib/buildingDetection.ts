/**
 * Building Detection Utility
 *
 * This utility provides real building detection using OpenStreetMap data
 * and Google Maps Geocoder for address enrichment.
 */

// Types
export interface BuildingData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  buildingNumber: number;
  status: "not-visited";
  phone: string;
  email: string;
  lastVisited: null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  type: "real" | "simulated";
}

export interface BuildingDetectionResult {
  address: string;
  coordinates: [number, number];
}

/**
 * Fetch real buildings from OpenStreetMap using Overpass API
 */
export const fetchBuildingsFromOSM = async (
  bounds: google.maps.LatLngBounds
) => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const query = `
    [out:json];
    (
      way["building"](${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()});
      relation["building"](${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()});
    );
    out center;
  `;

  try {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data?.elements) return [];
    return data.elements
      .filter((el: any) => {
        // Filter out invalid coordinates
        const lat = el.center?.lat;
        const lng = el.center?.lon;
        return (
          lat &&
          lng &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      })
      .map((el: any) => ({
        id: el.id,
        lat: el.center.lat,
        lng: el.center.lon,
      }));
  } catch (error) {
    console.log("OSM API error:", error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to get formatted address
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  // Validate coordinates first
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return `Invalid coordinates: ${lat}, ${lng}`;
  }

  const geocoder = new window.google.maps.Geocoder();
  return new Promise<string>((resolve) => {
    // Add a small delay to avoid hitting rate limits
    setTimeout(() => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          // Check if the address looks valid (not just coordinates)
          if (address && !address.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
            resolve(address);
          } else {
            // If geocoding returned coordinates, try to generate a better fallback
            resolve(`Building at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } else {
          // Generate a more user-friendly fallback
          resolve(`Building at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      });
    }, 100); // 100ms delay between requests
  });
};

/**
 * Generate simulated buildings for gaps in real building data
 */
export const generateSimulatedBuildings = (
  polygon: google.maps.Polygon,
  bounds: google.maps.LatLngBounds,
  targetCount: number,
  existingCount: number
): BuildingData[] => {
  const detectedResidents: BuildingData[] = [];
  const missingCount = Math.max(0, targetCount - existingCount);

  for (let i = 0; i < missingCount; i++) {
    const randomLat =
      bounds.getSouthWest().lat() +
      Math.random() *
        (bounds.getNorthEast().lat() - bounds.getSouthWest().lat());
    const randomLng =
      bounds.getSouthWest().lng() +
      Math.random() *
        (bounds.getNorthEast().lng() - bounds.getSouthWest().lng());
    const randomPoint = new window.google.maps.LatLng(randomLat, randomLng);

    if (
      window.google.maps.geometry.poly.containsLocation(randomPoint, polygon)
    ) {
      detectedResidents.push({
        id: `sim-${Date.now()}-${i}`,
        name: `Simulated Building ${i + 1}`,
        address: `${randomLat.toFixed(6)}, ${randomLng.toFixed(6)}`,
        buildingNumber: 0,
        lat: randomLat,
        lng: randomLng,
        status: "not-visited",
        phone: "",
        email: "",
        lastVisited: null,
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "simulated",
      });
    }
  }

  return detectedResidents;
};

/**
 * Main building detection function
 * Detects real buildings from OSM and fills gaps with simulated data
 */
export const detectBuildingsInPolygon = async (
  polygon: google.maps.Polygon
): Promise<BuildingData[]> => {
  if (!polygon || !window.google?.maps?.geometry?.poly) {
    return [];
  }

  const path = polygon.getPath().getArray();
  const bounds = new window.google.maps.LatLngBounds();
  path.forEach((latLng: any) => bounds.extend(latLng));

  const area = window.google.maps.geometry.spherical.computeArea(path);
  console.log(`Polygon area: ${area} square meters`);

  // Target building count - more realistic for residential areas
  const targetCount = Math.max(3, Math.floor(area / 400)); // ~1 building per 400 m²
  console.log(`Target buildings: ${targetCount}`);

  // 1️⃣ Fetch real buildings from OSM
  console.log("Fetching real buildings from OpenStreetMap...");
  const osmBuildings = await fetchBuildingsFromOSM(bounds);
  console.log(`Found ${osmBuildings.length} buildings in bounds`);

  // Filter buildings that are actually inside the polygon
  const realBuildings = osmBuildings.filter((b: any) =>
    window.google.maps.geometry.poly.containsLocation(
      new window.google.maps.LatLng(b.lat, b.lng),
      polygon
    )
  );
  console.log(`${realBuildings.length} buildings inside polygon`);

  // 2️⃣ Reverse geocode each real building with rate limiting
  console.log("Geocoding real buildings...");
  const enrichedBuildings = [];

  for (let i = 0; i < realBuildings.length; i++) {
    const b = realBuildings[i];
    try {
      const address = await reverseGeocode(b.lat, b.lng);
      // Extract house number from address
      const houseNumberMatch = address.match(/^(\d+)/);
      const buildingNumber = houseNumberMatch
        ? parseInt(houseNumberMatch[1], 10)
        : 0;

      enrichedBuildings.push({
        id: `real-${b.id}`,
        name: `Building ${i + 1}`,
        lat: b.lat,
        lng: b.lng,
        address: address,
        buildingNumber: buildingNumber,
        status: "not-visited" as const,
        phone: "",
        email: "",
        lastVisited: null,
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "real" as const,
      });
    } catch (error) {
      console.warn(`Failed to geocode building ${i + 1}:`, error);
      // Add building with fallback address
      enrichedBuildings.push({
        id: `real-${b.id}`,
        name: `Building ${i + 1}`,
        lat: b.lat,
        lng: b.lng,
        address: `Building at ${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}`,
        buildingNumber: 0,
        status: "not-visited" as const,
        phone: "",
        email: "",
        lastVisited: null,
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "real" as const,
      });
    }
  }

  // 3️⃣ Fill missing with simulated points
  console.log("Generating simulated buildings for gaps...");
  const simulatedBuildings = generateSimulatedBuildings(
    polygon,
    bounds,
    targetCount,
    enrichedBuildings.length
  );

  // 4️⃣ Merge and return
  const allBuildings = [...enrichedBuildings, ...simulatedBuildings];
  console.log(
    `✅ Detected ${allBuildings.length} buildings (${enrichedBuildings.length} real, ${simulatedBuildings.length} simulated)`
  );

  return allBuildings;
};

/**
 * Simplified building detection for territory edit pages
 * Returns data in the format expected by territory edit components
 */
export const detectBuildingsForTerritoryEdit = async (
  boundary: any
): Promise<BuildingDetectionResult[]> => {
  if (!boundary || !window.google?.maps?.geometry?.poly) {
    return [];
  }

  // Convert GeoJSON boundary to Google Maps polygon
  const coordinates = boundary.coordinates[0].map((coord: number[]) => ({
    lat: coord[1],
    lng: coord[0],
  }));

  const polygon = new window.google.maps.Polygon({
    paths: coordinates,
  });

  const path = polygon.getPath().getArray();
  const bounds = new window.google.maps.LatLngBounds();
  path.forEach((latLng: any) => bounds.extend(latLng));

  const area = window.google.maps.geometry.spherical.computeArea(path);
  console.log(`Polygon area: ${area} square meters`);

  // Target building count - more realistic for residential areas
  const targetCount = Math.max(3, Math.floor(area / 400)); // ~1 building per 400 m²
  console.log(`Target buildings: ${targetCount}`);

  // 1️⃣ Fetch real buildings from OSM
  console.log("Fetching real buildings from OpenStreetMap...");
  const osmBuildings = await fetchBuildingsFromOSM(bounds);
  console.log(`Found ${osmBuildings.length} buildings in bounds`);

  // Filter buildings that are actually inside the polygon
  const realBuildings = osmBuildings.filter((b: any) =>
    window.google.maps.geometry.poly.containsLocation(
      new window.google.maps.LatLng(b.lat, b.lng),
      polygon
    )
  );
  console.log(`${realBuildings.length} buildings inside polygon`);

  // 2️⃣ Reverse geocode each real building with rate limiting
  console.log("Geocoding real buildings...");
  const enrichedBuildings = [];

  for (let i = 0; i < realBuildings.length; i++) {
    const b = realBuildings[i];
    try {
      const address = await reverseGeocode(b.lat, b.lng);
      enrichedBuildings.push({
        address: address,
        coordinates: [b.lng, b.lat] as [number, number],
      });
    } catch (error) {
      console.warn(`Failed to geocode building ${i + 1}:`, error);
      // Add building with fallback address
      enrichedBuildings.push({
        address: `Building at ${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}`,
        coordinates: [b.lng, b.lat] as [number, number],
      });
    }
  }

  // 3️⃣ Fill missing with simulated points
  console.log("Generating simulated buildings for gaps...");
  const simulatedBuildings = generateSimulatedBuildings(
    polygon,
    bounds,
    targetCount,
    enrichedBuildings.length
  ).map((building) => ({
    address: building.address,
    coordinates: [building.lng, building.lat] as [number, number],
  }));

  // 4️⃣ Merge and return
  const allBuildings = [...enrichedBuildings, ...simulatedBuildings];
  console.log(
    `✅ Detected ${allBuildings.length} buildings (${enrichedBuildings.length} real, ${simulatedBuildings.length} simulated)`
  );

  return allBuildings;
};
