// utils/osm.ts
type OSMElement = {
  id: number;
  type: "node" | "way" | "relation" | "area";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type Neighbourhood = {
  id: string;
  name: string;
  type: string; // neighbourhood | suburb | quarter | district | administrative
  lat: number;
  lon: number;
  source: "overpass" | "nominatim";
};

// Respect Nominatim usage policy: set your app email/domain here
const NOMINATIM_HEADERS = {
  "User-Agent": "Knockwise/1.0 (contact@knockwise.com)",
  "Accept": "application/json",
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc = (s: string) => s.replace(/["\\]/g, "\\$&"); // minimal Overpass-safe

function toAreaId(element: { id: number; type: string }): number {
  // If Overpass returns an "area" element, its id is already the area id.
  if (element.type === "area") return element.id;
  // For relation -> area: add 3600000000
  // (Overpass often returns only "area" when using 'area[...]' query, but this keeps it robust.)
  return 3600000000 + element.id;
}

function mapElementsToNeighbourhoods(elements: OSMElement[], source: "overpass" | "nominatim"): Neighbourhood[] {
  return elements
    .map(el => {
      const name = el.tags?.name || el.tags?.["name:en"];
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const placeType =
        el.tags?.place ||
        (el.tags?.boundary === "neighbourhood" ? "neighbourhood" :
         el.tags?.boundary === "suburb" ? "suburb" :
         el.tags?.boundary === "administrative" ? "administrative" : "");

      if (!name || lat == null || lon == null) return null;

      return {
        id: `${source}_${el.type}_${el.id}`,
        name,
        type: placeType || "unknown",
        lat,
        lon,
        source,
      } as Neighbourhood;
    })
    .filter(Boolean) as Neighbourhood[];
}

async function overpass<T = any>(body: string): Promise<T> {
  console.log('🌐 Overpass request:', body);
  
  // Add delay to prevent rate limiting
  await sleep(1000);
  
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    console.log('📡 Overpass response status:', res.status, res.statusText);
    
    if (res.status === 504) {
      console.log('⚠️ Overpass timeout, trying with simpler query...');
      throw new Error('TIMEOUT');
    }
    
    if (!res.ok) throw new Error(`Overpass error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('📦 Overpass response data:', data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'TIMEOUT') {
      throw error;
    }
    console.log('💥 Overpass request failed:', error);
    throw error;
  }
}

async function nominatim<T = any>(pathAndQuery: string): Promise<T> {
  console.log('🌐 Nominatim request:', `${NOMINATIM_URL}${pathAndQuery}`);
  const res = await fetch(`${NOMINATIM_URL}${pathAndQuery}`, {
    headers: NOMINATIM_HEADERS,
  });
  console.log('📡 Nominatim response status:', res.status, res.statusText);
  if (!res.ok) throw new Error(`Nominatim error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  console.log('📦 Nominatim response data:', data);
  return data;
}

/**
 * Get city area id via Overpass (returns Overpass "area" id).
 */
export async function getCityAreaId(cityName: string, country?: string): Promise<number | null> {
  console.log('🔍 getCityAreaId called with:', cityName, country);
  
  // Try to constrain by country via Nominatim to reduce ambiguity -> get canonical city name + bbox, then use Overpass
  // But we can start with Overpass-only:
  const qCity = esc(cityName);

  // First, try admin boundaries; don't force admin_level to be tolerant (6/7/8/9/10 vary by country/province)
  const q = `
    [out:json][timeout:25];
    area["name"="${qCity}"]["boundary"="administrative"];
    out ids tags;
  `;

  try {
    const data = await overpass<{ elements: OSMElement[] }>(q);

    const elems = data?.elements || [];
    console.log('📊 City area elements found:', elems.length);
    if (elems.length === 0) {
      console.log('❌ No city area elements found');
      return null;
    }

    console.log('🏙️ All city elements:', elems);

    // Prefer typical city/town levels if present, else first one.
    const preferred = elems.find(e => e.tags?.admin_level === "8" || e.tags?.admin_level === "7" || e.tags?.admin_level === "6") || elems[0];
    
    console.log('✅ Selected city element:', preferred);
    const areaId = toAreaId(preferred as any);
    console.log('🆔 Calculated area ID:', areaId);
    
    return areaId;
  } catch (error) {
    console.log('💥 Error in getCityAreaId:', error);
    return null;
  }
}

/**
 * Query Overpass for neighbourhoods/suburbs/quarters/districts inside an area id.
 */
export async function getNeighbourhoodsOverpassByAreaId(areaId: number, nameLike?: string): Promise<Neighbourhood[]> {
  console.log('🔍 getNeighbourhoodsOverpassByAreaId called with:', areaId, nameLike);
  
  const filterName = nameLike ? `["name"~"${esc(nameLike)}",i]` : "";
  const q = `
    [out:json][timeout:30];
    area(${areaId})->.searchArea;

    (
      node["place"~"neighbourhood|suburb|quarter|district"]${filterName}(area.searchArea);
      way["place"~"neighbourhood|suburb|quarter|district"]${filterName}(area.searchArea);
      relation["place"~"neighbourhood|suburb|quarter|district"]${filterName}(area.searchArea);

      // Some cities map neighbourhoods as boundaries instead of place-nodes
      relation["boundary"="neighbourhood"]${filterName}(area.searchArea);
      relation["boundary"="suburb"]${filterName}(area.searchArea);
      relation["boundary"="administrative"]["admin_level"~"9|10"]${filterName}(area.searchArea);
    );
    out center;
  `;

  try {
    const data = await overpass<{ elements: OSMElement[] }>(q);
    const results = mapElementsToNeighbourhoods(data.elements || [], "overpass");
    console.log('✅ Overpass neighbourhoods found:', results);
    return results;
  } catch (error) {
    console.log('💥 Error in getNeighbourhoodsOverpassByAreaId:', error);
    return [];
  }
}

/**
 * If Overpass is empty, use Nominatim:
 * 1) Get city bbox
 * 2) Search within bbox for neighbourhood-ish features
 */
export async function getNeighbourhoodsNominatim(cityName: string, query?: string): Promise<Neighbourhood[]> {
  console.log('🔍 getNeighbourhoodsNominatim called with:', cityName, query);
  
  try {
    // 1) City bbox via Nominatim
    const cityRes = await nominatim<any[]>(
      `/search?format=jsonv2&limit=1&addressdetails=1&polygon_geojson=0&city=${encodeURIComponent(cityName)}`
    );
    if (!Array.isArray(cityRes) || cityRes.length === 0) {
      console.log('❌ No city found in Nominatim');
      return [];
    }

    const city = cityRes[0];
    console.log('🏙️ City found in Nominatim:', city);
    
    const [south, north, west, east] = city.boundingbox.map((v: string) => parseFloat(v));
    // Nominatim viewbox format: left,top,right,bottom => west,north,east,south
    const viewbox = `${west},${north},${east},${south}`;
    console.log('📦 City bounding box:', viewbox);

    // 2) Search inside bbox
    const q = query?.trim() || "";
    const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

    // Filter by place classes likely to represent neighbourhoods
    // Nominatim doesn't have a perfect filter param; use "q" plus "bounded=1" and "extratags"
    const results = await nominatim<any[]>(
      `/search?format=jsonv2&bounded=1&viewbox=${viewbox}${qParam}&extratags=1&namedetails=1&limit=50`
    );

    console.log('📊 Nominatim search results:', results?.length || 0);

    // Keep only relevant place types
    const allowedPlaceValues = new Set(["neighbourhood", "suburb", "quarter", "district"]);
    const filtered = (results || []).filter((r: any) => {
      const cls = r.class; // often "place" or "boundary"
      const typ = r.type;  // e.g., "neighbourhood" | "suburb" | "administrative"
      return (cls === "place" && allowedPlaceValues.has(typ)) ||
             (cls === "boundary" && (typ === "administrative" || typ === "neighbourhood" || typ === "suburb"));
    });

    console.log('🔍 Filtered neighbourhood results:', filtered.length);

    const neighbourhoods = filtered.map((r: any) => ({
      id: `nominatim_${r.osm_type}_${r.osm_id}`,
      name: r.namedetails?.name || r.display_name?.split(",")[0] || r.name,
      type: r.type,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      source: "nominatim" as const,
    }));

    console.log('✅ Nominatim neighbourhoods found:', neighbourhoods);
    return neighbourhoods;
  } catch (error) {
    console.log('💥 Error in getNeighbourhoodsNominatim:', error);
    return [];
  }
}

/**
 * Main function: dynamic, no static lists.
 * Tries Overpass by city area; if empty, falls back to Nominatim-in-bbox.
 */
export async function getCityNeighbourhoodsDynamic(cityName: string, query?: string): Promise<Neighbourhood[]> {
  console.log('🔍 getCityNeighbourhoodsDynamic called with:', cityName, query);
  
  try {
    const areaId = await getCityAreaId(cityName);
    if (areaId) {
      console.log('✅ Found area ID, trying Overpass...');
      const viaOverpass = await getNeighbourhoodsOverpassByAreaId(areaId, query);
      if (viaOverpass.length > 0) {
        console.log('✅ Found neighbourhoods via Overpass');
        return viaOverpass;
      }
      // If filtered search was empty and user typed something, try unfiltered to discover all
      if (query && query.trim()) {
        console.log('🔍 No filtered results, trying unfiltered search...');
        await sleep(750); // be kind to the API
        const allInCity = await getNeighbourhoodsOverpassByAreaId(areaId);
        if (allInCity.length > 0) {
          console.log('✅ Found neighbourhoods via unfiltered Overpass search');
          return allInCity.filter(n => n.name.toLowerCase().includes(query.toLowerCase()));
        }
      }
    }
  } catch (error) {
    console.log('💥 Error in Overpass approach:', error);
    // Ignore and fallback
  }

  // Fallback: Nominatim within city bbox
  console.log('🔄 Falling back to Nominatim...');
  try {
    const nominatimResults = await getNeighbourhoodsNominatim(cityName, query);
    console.log('✅ Found neighbourhoods via Nominatim fallback');
    return nominatimResults;
  } catch (error) {
    console.log('💥 Error in Nominatim fallback:', error);
    return [];
  }
}

/**
 * Get streets within a neighbourhood using OSM data.
 * Takes a neighbourhood object and returns all streets within that area.
 */
export async function getStreetsInNeighbourhood(neighbourhood: Neighbourhood): Promise<any[]> {
  console.log('🔍 getStreetsInNeighbourhood called with:', neighbourhood);
  
  try {
    // Extract the OSM ID from the neighbourhood ID
    const idParts = neighbourhood.id.split('_');
    const osmType = idParts[1]; // node, way, or relation
    const osmId = parseInt(idParts[2]);
    
    console.log('🆔 OSM Type:', osmType, 'OSM ID:', osmId);
    
    let query: string;
    
    if (osmType === 'relation') {
      // If it's a relation, use it directly as an area
      query = `
        [out:json][timeout:25];
        area(${3600000000 + osmId})->.searchArea;
        
        (
          way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"](area.searchArea);
          way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"](area.searchArea);
          way["highway"~"trunk|trunk_link|motorway|motorway_link"](area.searchArea);
          way["highway"~"footway|path|track|cycleway"](area.searchArea);
          way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"](area.searchArea);
        );
        out body;
        >;
        out skel qt;
      `;
    } else {
      // If it's a node or way, search around it
      const lat = neighbourhood.lat;
      const lon = neighbourhood.lon;
      const radius = 1000; // Reduced radius to 1km to avoid timeouts
      
      query = `
        [out:json][timeout:25];
        (
          way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"](around:${radius},${lat},${lon});
          way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"](around:${radius},${lat},${lon});
          way["highway"~"trunk|trunk_link|motorway|motorway_link"](around:${radius},${lat},${lon});
          way["highway"~"footway|path|track|cycleway"](around:${radius},${lat},${lon});
          way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
      `;
    }
    
    console.log('🌐 Streets query:', query);
    
    try {
      const data = await overpass<{ elements: any[] }>(query);
      const streets = data.elements || [];
      
      console.log('📊 Streets found:', streets.length);
      
      // Filter and format street results
      const formattedStreets = streets
        .filter(street => {
          // Include all highways that have names
          return street.tags?.name && street.tags?.highway && 
                 // Include more street types, but exclude some that are not really streets
                 !['steps', 'cycleway', 'bridleway'].includes(street.tags.highway);
        })
        .map(street => ({
          id: `osm_way_${street.id}`,
          name: street.tags.name,
          type: street.tags.highway,
          lat: street.center?.lat || street.lat,
          lon: street.center?.lon || street.lon,
          source: 'overpass' as const,
        }))
        .filter((street, index, self) => 
          // Remove duplicates based on name
          index === self.findIndex(s => s.name === street.name)
        )
        .sort((a, b) => {
          // Sort by street type priority (main streets first, then smaller ones)
          const priority = {
            'primary': 1,
            'secondary': 2,
            'tertiary': 3,
            'residential': 4,
            'service': 5,
            'unclassified': 6,
            'living_street': 7,
            'pedestrian': 8,
            'footway': 9,
            'path': 10,
            'track': 11,
            'alley': 12,
            'cul_de_sac': 13
          };
          const aPriority = priority[a.type as keyof typeof priority] || 99;
          const bPriority = priority[b.type as keyof typeof priority] || 99;
          return aPriority - bPriority;
        });
      
      console.log('✅ Formatted streets:', formattedStreets);
      return formattedStreets;
      
    } catch (error) {
      if (error instanceof Error && error.message === 'TIMEOUT') {
        console.log('🔄 Main query timed out, trying simpler fallback query...');
        
        // Try a much simpler query as fallback
        const fallbackQuery = `
          [out:json][timeout:15];
          (
            way["highway"~"residential|service|unclassified|living_street"]["name"](around:500,${neighbourhood.lat},${neighbourhood.lon});
            way["highway"~"alley|cul_de_sac|drive|avenue|crescent|circle|court|place|terrace|lane"](around:500,${neighbourhood.lat},${neighbourhood.lon});
          );
          out body;
          >;
          out skel qt;
        `;
        
        try {
          const fallbackData = await overpass<{ elements: any[] }>(fallbackQuery);
          const fallbackStreets = fallbackData.elements || [];
          
          console.log('📊 Fallback streets found:', fallbackStreets.length);
          
          const formattedFallbackStreets = fallbackStreets
            .filter(street => street.tags?.name)
            .map(street => ({
              id: `osm_way_${street.id}`,
              name: street.tags.name,
              type: street.tags.highway,
              lat: street.center?.lat || street.lat,
              lon: street.center?.lon || street.lon,
              source: 'overpass' as const,
            }))
            .filter((street, index, self) => 
              index === self.findIndex(s => s.name === street.name)
            );
          
          console.log('✅ Fallback formatted streets:', formattedFallbackStreets);
          return formattedFallbackStreets;
          
        } catch (fallbackError) {
          console.log('💥 Fallback query also failed:', fallbackError);
          return [];
        }
      }
      
      console.log('💥 Error in getStreetsInNeighbourhood:', error);
      return [];
    }
    
  } catch (error) {
    console.log('💥 Error in getStreetsInNeighbourhood:', error);
    return [];
  }
}

/**
 * Get streets within a neighbourhood by name (fallback method).
 * This is useful when we don't have the full neighbourhood object.
 */
export async function getStreetsInNeighbourhoodByName(neighbourhoodName: string, cityName: string): Promise<any[]> {
  console.log('🔍 getStreetsInNeighbourhoodByName called with:', neighbourhoodName, cityName);
  
  // Extract just the neighbourhood name (remove city suffix if present)
  const cleanNeighbourhoodName = neighbourhoodName.split(',')[0].trim();
  console.log('🧹 Cleaned neighbourhood name:', cleanNeighbourhoodName);
  
  // First, try to get proper coordinates for the neighbourhood using Google Geocoding
  console.log('🌐 Getting coordinates for neighbourhood via Google Geocoding...');
  let neighbourhoodLat = 0;
  let neighbourhoodLon = 0;
  
  try {
    const geocodeQuery = `${cleanNeighbourhoodName}, ${cityName}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    console.log('📦 Geocoding response:', geocodeData);
    
    if (geocodeData.results && geocodeData.results.length > 0) {
      const result = geocodeData.results[0];
      neighbourhoodLat = result.geometry.location.lat;
      neighbourhoodLon = result.geometry.location.lng;
      console.log('✅ Got coordinates from Google Geocoding:', neighbourhoodLat, neighbourhoodLon);
    } else {
      console.log('❌ No geocoding results, using fallback coordinates for Brampton');
      // Fallback coordinates for Brampton area
      neighbourhoodLat = 43.6831;
      neighbourhoodLon = -79.7662;
    }
  } catch (geocodeError) {
    console.log('❌ Geocoding failed, using fallback coordinates:', geocodeError);
    // Fallback coordinates for Brampton area
    neighbourhoodLat = 43.6831;
    neighbourhoodLon = -79.7662;
  }
  
  try {
    // First, try to find the neighbourhood boundary with exact name
    const neighbourhoodQuery = `
      [out:json][timeout:25];
      area["name"="${esc(cityName)}"]["boundary"="administrative"]->.city;
      (
        relation["name"="${esc(cleanNeighbourhoodName)}"]["boundary"="neighbourhood"](area.city);
        relation["name"="${esc(cleanNeighbourhoodName)}"]["place"="neighbourhood"](area.city);
        way["name"="${esc(cleanNeighbourhoodName)}"]["place"="neighbourhood"](area.city);
        node["name"="${esc(cleanNeighbourhoodName)}"]["place"="neighbourhood"](area.city);
        relation["name"="${esc(cleanNeighbourhoodName)}"]["place"="suburb"](area.city);
        way["name"="${esc(cleanNeighbourhoodName)}"]["place"="suburb"](area.city);
        node["name"="${esc(cleanNeighbourhoodName)}"]["place"="suburb"](area.city);
      );
      out ids tags;
    `;
    
    console.log('🌐 Neighbourhood search query (exact):', neighbourhoodQuery);
    
    const neighbourhoodData = await overpass<{ elements: any[] }>(neighbourhoodQuery);
    const neighbourhoods = neighbourhoodData.elements || [];
    
    console.log('📊 Neighbourhoods found (exact):', neighbourhoods.length);
    
    if (neighbourhoods.length === 0) {
      console.log('❌ No exact match found, trying partial search...');
      
      // Try partial search within the city
      const partialQuery = `
        [out:json][timeout:25];
        area["name"="${esc(cityName)}"]["boundary"="administrative"]->.city;
        (
          relation["name"~"${esc(cleanNeighbourhoodName)}",i]["boundary"="neighbourhood"](area.city);
          relation["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="neighbourhood"](area.city);
          way["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="neighbourhood"](area.city);
          node["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="neighbourhood"](area.city);
          relation["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="suburb"](area.city);
          way["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="suburb"](area.city);
          node["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="suburb"](area.city);
        );
        out ids tags;
      `;
      
      console.log('🌐 Neighbourhood search query (partial):', partialQuery);
      
      const partialData = await overpass<{ elements: any[] }>(partialQuery);
      const partialNeighbourhoods = partialData.elements || [];
      
      console.log('📊 Neighbourhoods found (partial):', partialNeighbourhoods.length);
      
      if (partialNeighbourhoods.length === 0) {
        console.log('❌ No neighbourhood found, trying broader search...');
        // Try a broader search without city constraint
        const broadQuery = `
          [out:json][timeout:25];
          (
            relation["name"~"${esc(cleanNeighbourhoodName)}",i]["boundary"="neighbourhood"];
            relation["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="neighbourhood"];
            relation["name"~"${esc(cleanNeighbourhoodName)}",i]["place"="suburb"];
          );
          out ids tags;
        `;
        
        const broadData = await overpass<{ elements: any[] }>(broadQuery);
        const broadNeighbourhoods = broadData.elements || [];
        
        if (broadNeighbourhoods.length === 0) {
          console.log('❌ No neighbourhood found in broader search, trying direct street search...');
          
          // If we can't find the neighbourhood, try to get streets directly in the city area
          // This is a fallback for when neighbourhoods aren't properly tagged in OSM
          const directStreetQuery = `
            [out:json][timeout:25];
            area["name"="${esc(cityName)}"]["boundary"="administrative"]->.city;
            (
              way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"]["name"~"${esc(cleanNeighbourhoodName)}",i](area.city);
              way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"]["name"~"${esc(cleanNeighbourhoodName)}",i](area.city);
              way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"]["name"~"${esc(cleanNeighbourhoodName)}",i](area.city);
              way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"](area.city);
              way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"](area.city);
              way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"](area.city);
            );
            out body;
            >;
            out skel qt;
          `;
          
          console.log('🌐 Direct street search query:', directStreetQuery);
          
          try {
            const directStreetData = await overpass<{ elements: any[] }>(directStreetQuery);
            const directStreets = directStreetData.elements || [];
            
            console.log('📊 Direct streets found:', directStreets.length);
            
            const formattedDirectStreets = directStreets
              .filter(street => street.tags?.name)
              .map(street => ({
                id: `osm_way_${street.id}`,
                name: street.tags.name,
                type: street.tags.highway,
                lat: street.center?.lat || street.lat,
                lon: street.center?.lon || street.lon,
                source: 'overpass' as const,
              }))
              .filter((street, index, self) => 
                index === self.findIndex(s => s.name === street.name)
              );
            
            console.log('✅ Direct formatted streets:', formattedDirectStreets);
            
            // If we found some streets, return them
            if (formattedDirectStreets.length > 0) {
              return formattedDirectStreets;
            }
            
                          // If no streets found with neighbourhood name, try getting ALL residential streets in the city
              console.log('🔄 No neighbourhood-specific streets found, getting all residential streets in city...');
              
              const allResidentialQuery = `
                [out:json][timeout:30];
                area["name"="${esc(cityName)}"]["boundary"="administrative"]->.city;
                (
                  way["highway"~"residential|service|unclassified|living_street"]["name"](area.city);
                  way["highway"~"tertiary|secondary|primary"]["name"](area.city);
                  way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"]["name"](area.city);
                  way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"]["name"](area.city);
                  way["highway"~"footway|path|track|cycleway"]["name"](area.city);
                );
                out body;
                >;
                out skel qt;
              `;
            
            console.log('🌐 All residential streets query:', allResidentialQuery);
            
            const allResidentialData = await overpass<{ elements: any[] }>(allResidentialQuery);
            const allResidentialStreets = allResidentialData.elements || [];
            
            console.log('📊 All residential streets found:', allResidentialStreets.length);
            
            const formattedAllResidential = allResidentialStreets
              .filter(street => street.tags?.name)
              .map(street => ({
                id: `osm_way_${street.id}`,
                name: street.tags.name,
                type: street.tags.highway,
                lat: street.center?.lat || street.lat,
                lon: street.center?.lon || street.lon,
                source: 'overpass' as const,
              }))
              .filter((street, index, self) => 
                index === self.findIndex(s => s.name === street.name)
              )
              .sort((a, b) => {
                // Sort by street type priority (residential first)
                const priority = {
                  'residential': 1,
                  'service': 2,
                  'unclassified': 3,
                  'living_street': 4,
                  'pedestrian': 5
                };
                const aPriority = priority[a.type as keyof typeof priority] || 99;
                const bPriority = priority[b.type as keyof typeof priority] || 99;
                return aPriority - bPriority;
              });
            
            console.log('✅ All residential formatted streets:', formattedAllResidential);
            return formattedAllResidential;
            
          } catch (directError) {
            console.log('💥 Direct street search failed:', directError);
            return [];
          }
        }
        
        // Use the first found neighbourhood
        const neighbourhood = broadNeighbourhoods[0];
        console.log('✅ Using neighbourhood from broader search:', neighbourhood);
        
        // Now get streets around this neighbourhood
        const lat = neighbourhood.lat || neighbourhood.center?.lat;
        const lon = neighbourhood.lon || neighbourhood.center?.lon;
        
        if (lat && lon) {
          const radius = 1000; // Reduced radius to 1km to avoid timeouts
          const streetsQuery = `
            [out:json][timeout:25];
            (
              way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"](around:${radius},${lat},${lon});
              way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"](around:${radius},${lat},${lon});
              way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"](around:${radius},${lat},${lon});
              way["highway"~"footway|path|track|cycleway"](around:${radius},${lat},${lon});
            );
            out body;
            >;
            out skel qt;
          `;
          
          console.log('🌐 Streets query (broad search):', streetsQuery);
          
          const streetsData = await overpass<{ elements: any[] }>(streetsQuery);
          const streets = streetsData.elements || [];
          
          console.log('📊 Streets found (broad search):', streets.length);
          
          const formattedStreets = streets
            .filter(street => {
              // Include all highways that have names
              return street.tags?.name && street.tags?.highway && 
                     // Exclude footways, paths, and tracks unless they have proper names
                     !['footway', 'path', 'track', 'steps', 'cycleway'].includes(street.tags.highway);
            })
            .map(street => ({
              id: `osm_way_${street.id}`,
              name: street.tags.name,
              type: street.tags.highway,
              lat: street.center?.lat || street.lat,
              lon: street.center?.lon || street.lon,
              source: 'overpass' as const,
            }))
            .filter((street, index, self) => 
              index === self.findIndex(s => s.name === street.name)
            )
            .sort((a, b) => {
              // Sort by street type priority (main streets first, then smaller ones)
              const priority = {
                'primary': 1,
                'secondary': 2,
                'tertiary': 3,
                'residential': 4,
                'service': 5,
                'unclassified': 6,
                'living_street': 7,
                'pedestrian': 8,
                'footway': 9,
                'path': 10,
                'track': 11,
                'alley': 12,
                'cul_de_sac': 13
              };
              const aPriority = priority[a.type as keyof typeof priority] || 99;
              const bPriority = priority[b.type as keyof typeof priority] || 99;
              return aPriority - bPriority;
            });
          
          console.log('✅ Formatted streets (broad search):', formattedStreets);
          return formattedStreets;
        }
      } else {
        // Use the first found neighbourhood from partial search
        const neighbourhood = partialNeighbourhoods[0];
        console.log('✅ Using neighbourhood from partial search:', neighbourhood);
        
        // Convert to Neighbourhood format and get streets
        const neighbourhoodObj: Neighbourhood = {
          id: `osm_${neighbourhood.type}_${neighbourhood.id}`,
          name: cleanNeighbourhoodName,
          type: 'neighbourhood',
          lat: neighbourhood.lat || neighbourhood.center?.lat || 0,
          lon: neighbourhood.lon || neighbourhood.center?.lon || 0,
          source: 'overpass',
        };
        
        return await getStreetsInNeighbourhood(neighbourhoodObj);
      }
    } else {
      // Use the first found neighbourhood from exact search
      const neighbourhood = neighbourhoods[0];
      console.log('✅ Using neighbourhood from exact search:', neighbourhood);
      
      // Convert to Neighbourhood format and get streets
      const neighbourhoodObj: Neighbourhood = {
        id: `osm_${neighbourhood.type}_${neighbourhood.id}`,
        name: cleanNeighbourhoodName,
        type: 'neighbourhood',
        lat: neighbourhood.lat || neighbourhood.center?.lat || neighbourhoodLat,
        lon: neighbourhood.lon || neighbourhood.center?.lon || neighbourhoodLon,
        source: 'overpass',
      };
      
      return await getStreetsInNeighbourhood(neighbourhoodObj);
    }
    
    // If no neighbourhood found in OSM, try searching for streets using the coordinates we got from Google Geocoding
    console.log('🔄 No neighbourhood found in OSM, trying coordinate-based street search...');
    
    if (neighbourhoodLat !== 0 && neighbourhoodLon !== 0) {
      const coordinateBasedQuery = `
        [out:json][timeout:25];
        (
          way["highway"~"residential|tertiary|secondary|primary|service|unclassified|living_street|pedestrian"](around:2000,${neighbourhoodLat},${neighbourhoodLon});
          way["highway"~"residential_link|tertiary_link|secondary_link|primary_link"](around:2000,${neighbourhoodLat},${neighbourhoodLon});
          way["highway"~"alley|cul_de_sac|drive|avenue|boulevard|crescent|circle|court|place|terrace|lane|road|street"](around:2000,${neighbourhoodLat},${neighbourhoodLon});
        );
        out body;
        >;
        out skel qt;
      `;
      
      console.log('🌐 Coordinate-based street search query:', coordinateBasedQuery);
      
      try {
        const coordinateData = await overpass<{ elements: any[] }>(coordinateBasedQuery);
        const coordinateStreets = coordinateData.elements || [];
        
        console.log('📊 Coordinate-based streets found:', coordinateStreets.length);
        
        const formattedCoordinateStreets = coordinateStreets
          .filter(street => street.tags?.name)
          .map(street => ({
            id: `osm_way_${street.id}`,
            name: street.tags.name,
            type: street.tags.highway,
            lat: street.center?.lat || street.lat,
            lon: street.center?.lon || street.lon,
            source: 'overpass' as const,
          }))
          .filter((street, index, self) => 
            index === self.findIndex(s => s.name === street.name)
          );
        
        console.log('✅ Coordinate-based formatted streets:', formattedCoordinateStreets.length);
        
        if (formattedCoordinateStreets.length > 0) {
          return formattedCoordinateStreets;
        }
      } catch (coordinateError) {
        console.log('❌ Coordinate-based search failed:', coordinateError);
      }
    }
    
    return [];
    
  } catch (error) {
    console.log('💥 Error in getStreetsInNeighbourhoodByName:', error);
    
    // Final fallback: try a very broad search within the city
    console.log('🔄 Final fallback: broad city-wide street search...');
    
    try {
      const finalFallbackQuery = `
        [out:json][timeout:25];
        area["name"="${esc(cityName)}"]["boundary"="administrative"]->.city;
        (
          way["highway"]["name"](area.city);
        );
        out body;
        >;
        out skel qt;
      `;
      
      console.log('🌐 Final fallback query:', finalFallbackQuery);
      
      const finalData = await overpass<{ elements: any[] }>(finalFallbackQuery);
      const finalStreets = finalData.elements || [];
      
      console.log('📊 Final fallback streets found:', finalStreets.length);
      
      const formattedFinal = finalStreets
        .filter(street => street.tags?.name)
        .map(street => ({
          id: `osm_way_${street.id}`,
          name: street.tags.name,
          type: street.tags.highway,
          lat: street.center?.lat || street.lat,
          lon: street.center?.lon || street.lon,
          source: 'overpass' as const,
        }))
        .filter((street, index, self) => 
          index === self.findIndex(s => s.name === street.name)
        )
        .slice(0, 100); // Limit to 100 results
      
      console.log('✅ Final fallback formatted streets:', formattedFinal.length);
      return formattedFinal;
      
    } catch (finalError) {
      console.log('💥 Final fallback also failed:', finalError);
      return [];
    }
  }
}

/**
 * Get comprehensive streets using Google APIs (Geocoding + Roads API)
 * This approach generates a grid of points within the neighborhood and finds nearest roads
 */
export async function getStreetsInNeighbourhoodGoogle(neighbourhoodName: string, cityName: string): Promise<any[]> {
  console.log('🔍 getStreetsInNeighbourhoodGoogle called with:', neighbourhoodName, cityName);
  
  try {
    // Step 1: Get neighborhood bounds using Geocoding API
    const geocodeQuery = `${neighbourhoodName}, ${cityName}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    
    console.log('🌐 Geocoding request:', geocodeUrl);
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    console.log('📦 Geocoding response:', geocodeData);
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.log('❌ No geocoding results found');
      return [];
    }
    
    const result = geocodeData.results[0];
    const bounds = result.geometry.bounds || result.geometry.viewport;
    
    if (!bounds) {
      console.log('❌ No bounds found in geocoding result');
      return [];
    }
    
    console.log('📦 Neighborhood bounds:', bounds);
    
    // Step 2: Generate grid of points within the bounds
    const points = generateGridPoints(bounds, 0.0005); // ~50m spacing
    console.log('📊 Generated grid points:', points.length);
    
    // Step 3: Call Roads API in batches (max 100 points per request)
    const allStreets = new Set<string>();
    const streetDetails: any[] = [];
    
    for (let i = 0; i < points.length; i += 100) {
      const batch = points.slice(i, i + 100);
      const pointsString = batch.map(p => `${p.lat},${p.lng}`).join('|');
      
      const roadsUrl = `https://roads.googleapis.com/v1/nearestRoads?points=${pointsString}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      
      console.log(`🌐 Roads API request ${Math.floor(i/100) + 1}:`, roadsUrl);
      
      try {
        const roadsResponse = await fetch(roadsUrl);
        const roadsData = await roadsResponse.json();
        
        console.log(`📦 Roads API response ${Math.floor(i/100) + 1}:`, roadsData);
        
        // Check for API errors
        if (roadsData.error) {
          console.log(`❌ Roads API error:`, roadsData.error);
          if (roadsData.error.code === 403) {
            console.log('🚫 Roads API not enabled. Please enable it in Google Cloud Console.');
            console.log('📋 Go to: https://console.cloud.google.com/apis/library/roads.googleapis.com');
          }
          continue;
        }
        
        if (roadsData.snappedPoints) {
          // Step 4: Get street names for each snapped point
          for (const point of roadsData.snappedPoints) {
            const streetName = await getStreetNameFromCoordinates(point.location.latitude, point.location.longitude);
            if (streetName && !allStreets.has(streetName)) {
              allStreets.add(streetName);
              streetDetails.push({
                id: `google_road_${point.placeId}`,
                name: streetName,
                type: 'road',
                lat: point.location.latitude,
                lon: point.location.longitude,
                source: 'google' as const,
              });
            }
          }
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`💥 Roads API batch ${Math.floor(i/100) + 1} failed:`, error);
        continue;
      }
    }
    
    console.log('✅ Google streets found:', streetDetails.length);
    console.log('📋 Unique street names:', Array.from(allStreets));
    
    return streetDetails;
    
  } catch (error) {
    console.log('💥 Error in getStreetsInNeighbourhoodGoogle:', error);
    return [];
  }
}

/**
 * Generate a grid of points within given bounds
 */
function generateGridPoints(bounds: any, step: number = 0.0005): Array<{lat: number, lng: number}> {
  const points: Array<{lat: number, lng: number}> = [];
  
  const southwest = bounds.southwest || bounds.southwest;
  const northeast = bounds.northeast || bounds.northeast;
  
  for (let lat = southwest.lat; lat <= northeast.lat; lat += step) {
    for (let lng = southwest.lng; lng <= northeast.lng; lng += step) {
      points.push({ lat, lng });
    }
  }
  
  return points;
}

/**
 * Get street name from coordinates using reverse geocoding
 */
async function getStreetNameFromCoordinates(lat: number, lng: number): Promise<string | null> {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const addressComponents = data.results[0].address_components;
      const routeComponent = addressComponents.find((component: any) => 
        component.types.includes('route')
      );
      
      if (routeComponent) {
        return routeComponent.long_name;
      }
    }
    
    return null;
  } catch (error) {
    console.log('💥 Error getting street name from coordinates:', error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function getNeighbourhoods(cityName: string, query: string): Promise<any[]> {
  console.log('🔍 Legacy getNeighbourhoods called with:', cityName, query);
  const results = await getCityNeighbourhoodsDynamic(cityName, query);
  
  // Convert to legacy format
  return results.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type,
    lat: n.lat,
    lon: n.lon,
  }));
}

// Legacy function for backward compatibility
export async function getAllNeighbourhoods(cityName: string): Promise<any[]> {
  console.log('🔍 Legacy getAllNeighbourhoods called with:', cityName);
  return await getCityNeighbourhoodsDynamic(cityName);
}
