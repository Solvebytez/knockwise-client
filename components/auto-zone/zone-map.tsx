"use client";

import { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Grid3X3, X, Loader2 } from "lucide-react";
import { CommunityBoundary } from "@/lib/freeLocationData";
import { GridBlock, generateGridBlocks } from "@/lib/gridSubdivision";

const libraries: ("drawing" | "geometry" | "places")[] = [
  "drawing",
  "geometry",
  "places",
];

interface PropertyMarker {
  id: string;
  position: { lat: number; lng: number };
  price: string;
  address: string;
  type: string;
}

interface ZoneBoundary {
  id: string;
  name: string;
  paths: { lat: number; lng: number }[];
  color: string;
}

interface ZoneMapProps {
  selectedZone?: any;
  onZoneSelect: (zone: any) => void;
  communityBoundary?: CommunityBoundary | null;
  isBoundaryLoading?: boolean;
  boundaryError?: string | null;
  onGridBlocksGenerated?: (blocks: GridBlock[]) => void;
  gridBlocks?: GridBlock[];
  onGridBlocksUpdate?: (blocks: GridBlock[]) => void;
}

export function ZoneMap({
  selectedZone,
  onZoneSelect,
  communityBoundary,
  isBoundaryLoading,
  boundaryError,
  onGridBlocksGenerated,
  gridBlocks = [],
  onGridBlocksUpdate,
}: ZoneMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<PropertyMarker | null>(
    null
  );
  const [communityPolygon, setCommunityPolygon] =
    useState<google.maps.Polygon | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 });
  const [mapZoom, setMapZoom] = useState(15);
  const [localGridBlocks, setLocalGridBlocks] = useState<GridBlock[]>([]);
  const [showGridBlocks, setShowGridBlocks] = useState(false);
  const [focusedBlock, setFocusedBlock] = useState<GridBlock | null>(null);

  // No static property markers - will be populated dynamically
  const propertyMarkers: PropertyMarker[] = [];

  // No static zone boundaries - will be populated dynamically
  const zoneBoundaries: ZoneBoundary[] = [];

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Handle community boundary changes
  useEffect(() => {
    if (!map || !communityBoundary) {
      // Clear existing polygon if no boundary
      if (communityPolygon) {
        communityPolygon.setMap(null);
        setCommunityPolygon(null);
      }
      return;
    }

    // Clear existing polygon
    if (communityPolygon) {
      communityPolygon.setMap(null);
    }

    // Create new polygon with different styling based on source
    const isFallback = communityBoundary.source === "fallback";
    const isGoogle = communityBoundary.source === "google";

    let fillColor = "#3B82F6"; // Default blue
    let strokeColor = "#3B82F6";
    let strokeWeight = 3;

    if (isFallback) {
      fillColor = "#F59E0B"; // Orange for fallback
      strokeColor = "#F59E0B";
      strokeWeight = 2;
    } else if (isGoogle) {
      fillColor = "#10B981"; // Green for Google Places
      strokeColor = "#10B981";
      strokeWeight = 3;
    }

    console.log(`Creating polygon for ${communityBoundary.name}:`, {
      coordinates: communityBoundary.coordinates,
      fillColor,
      strokeColor,
      strokeWeight,
      source: communityBoundary.source,
    });

    const polygon = new google.maps.Polygon({
      paths: communityBoundary.coordinates,
      fillColor,
      fillOpacity: 0.4, // Increased from 0.2 to 0.4
      strokeColor,
      strokeOpacity: 1.0, // Increased from 0.8 to 1.0
      strokeWeight: strokeWeight + 2, // Increased stroke weight
      clickable: false,
    });

    polygon.setMap(map);
    setCommunityPolygon(polygon);

    console.log(
      `Polygon created and added to map for ${communityBoundary.name}`
    );

    // Auto-center and zoom to fit the community
    if (communityBoundary.coordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      communityBoundary.coordinates.forEach((coord) => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });

      console.log(`Fitting bounds for ${communityBoundary.name}:`, {
        bounds: {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        },
      });

      // Update map center and zoom to focus on the community
      const center = communityBoundary.center;
      setMapCenter(center);
      setMapZoom(14);

      // Fit bounds with padding
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

      // Set appropriate zoom level after bounds are set
      setTimeout(() => {
        const currentZoom = map.getZoom();
        console.log(`Current zoom after fitBounds: ${currentZoom}`);

        // If zoom is too high, set it to a more appropriate level
        if (currentZoom && currentZoom > 14) {
          map.setZoom(14);
          console.log(`Adjusted zoom to 14 for better polygon visibility`);
        }
      }, 100);
    }
  }, [map, communityBoundary]);

  const handleMarkerClick = (marker: PropertyMarker) => {
    setSelectedMarker(marker);
  };

  const handleMapClick = () => {
    setSelectedMarker(null);
  };

  // Sync with parent grid blocks
  useEffect(() => {
    setLocalGridBlocks(gridBlocks);
    setShowGridBlocks(gridBlocks.length > 0);
  }, [gridBlocks]);

  const handleGenerateGridBlocks = () => {
    if (!communityBoundary) {
      console.warn("No community boundary available for grid generation");
      return;
    }

    console.log("Generating grid blocks for:", communityBoundary.name);

    const blocks = generateGridBlocks(
      communityBoundary.name,
      communityBoundary.bounds
    );
    setLocalGridBlocks(blocks);
    setShowGridBlocks(true);

    // Notify parent component about generated blocks
    if (onGridBlocksGenerated) {
      onGridBlocksGenerated(blocks);
    }

    console.log(`Generated ${blocks.length} grid blocks`);
  };

  const clearGridBlocks = () => {
    setLocalGridBlocks([]);
    setShowGridBlocks(false);
    setFocusedBlock(null);
    if (onGridBlocksGenerated) {
      onGridBlocksGenerated([]);
    }
  };

  const focusOnBlock = (block: GridBlock) => {
    if (!map) return;

    setFocusedBlock(block);

    // Create bounds for the specific block
    const bounds = new google.maps.LatLngBounds();
    block.coordinates.forEach((coord) => {
      bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
    });

    // Fit map to block bounds with padding
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Set appropriate zoom level
    setTimeout(() => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 16) {
        map.setZoom(16);
      }
    }, 100);

    console.log(`Focused on ${block.name}`);
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={mapZoom}
        mapTypeId="hybrid"
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
            position: google?.maps?.ControlPosition?.TOP_CENTER,
            mapTypeIds: [
              google?.maps?.MapTypeId?.ROADMAP,
              google?.maps?.MapTypeId?.SATELLITE,
              google?.maps?.MapTypeId?.HYBRID,
            ],
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google?.maps?.ControlPosition?.RIGHT_CENTER,
          },
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google?.maps?.ControlPosition?.RIGHT_TOP,
          },
        }}
      >
        {/* Property Markers */}
        {propertyMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => handleMarkerClick(marker)}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <text x="20" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                    ${marker.id}
                  </text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        ))}

        {/* Zone Boundaries */}
        {zoneBoundaries.map((zone) => (
          <Polygon
            key={zone.id}
            paths={zone.paths}
            options={{
              fillColor: zone.color,
              fillOpacity: 0.1,
              strokeColor: zone.color,
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        ))}

        {/* Grid Blocks */}
        {showGridBlocks &&
          localGridBlocks.map((block) => {
            const isFocused = focusedBlock?.id === block.id;
            const hasData =
              block.isDataLoaded && block.streets && block.buildings;

            return (
              <Polygon
                key={block.id}
                paths={block.coordinates}
                options={{
                  fillColor: isFocused
                    ? "#F59E0B"
                    : hasData
                    ? "#10B981"
                    : "#8B5CF6", // Orange if focused, green if has data, purple default
                  fillOpacity: isFocused ? 0.4 : 0.2,
                  strokeColor: isFocused
                    ? "#F59E0B"
                    : hasData
                    ? "#10B981"
                    : "#8B5CF6",
                  strokeOpacity: isFocused ? 1.0 : 0.8,
                  strokeWeight: isFocused ? 4 : 2,
                  clickable: true,
                }}
                onClick={() => {
                  console.log(`Clicked on ${block.name}:`, block);
                  focusOnBlock(block);
                }}
              />
            );
          })}
      </GoogleMap>

      {/* Grid Subdivision Tool */}
      {communityBoundary && (
        <div className="absolute top-4 left-4">
          <Button
            variant={showGridBlocks ? "destructive" : "default"}
            size="sm"
            onClick={
              showGridBlocks ? clearGridBlocks : handleGenerateGridBlocks
            }
            className={`shadow-md ${
              showGridBlocks
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            title={
              showGridBlocks
                ? "Clear Grid Blocks"
                : "Split Community into Grid Blocks"
            }
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            {showGridBlocks ? "Clear Grid" : "Split Blocks"}
          </Button>
        </div>
      )}

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedMarker.address}
                </h3>
                <p className="text-sm text-gray-600">{selectedMarker.type}</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedMarker.price}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMarker(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Community Boundary Loading State */}
      {isBoundaryLoading && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-700">
              Loading community boundary...
            </span>
          </div>
        </div>
      )}

      {/* Community Boundary Error State */}
      {boundaryError && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-3 border border-red-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-700">{boundaryError}</span>
          </div>
        </div>
      )}

      {/* Community Boundary Success State */}
      {communityBoundary && !isBoundaryLoading && !boundaryError && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-3 border">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  communityBoundary.source === "fallback"
                    ? "bg-orange-500"
                    : communityBoundary.source === "google"
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {communityBoundary.name}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {communityBoundary.source === "fallback"
                ? "Approximate Boundary"
                : communityBoundary.source === "google"
                ? "Google Places Boundary"
                : "Community Boundary"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {communityBoundary.coordinates.length - 1} corners
              {communityBoundary.source === "fallback" && " • Fallback"}
              {communityBoundary.source === "google" && " • Google Places"}
            </p>
          </div>
        </div>
      )}

      {/* Focused Block Info Panel */}
      {focusedBlock && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-3 border max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">{focusedBlock.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFocusedBlock(null)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Area: {focusedBlock.area.toFixed(3)} km²</div>
              {focusedBlock.isDataLoaded && (
                <div>
                  <div>Streets: {focusedBlock.streets?.length || 0}</div>
                  <div>Buildings: {focusedBlock.buildings?.length || 0}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zone Info Panel - Only show when zones are available */}
      {zoneBoundaries.length > 0 && !communityBoundary && !focusedBlock && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-3 border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {zoneBoundaries[0]?.name || "Active Zone"}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Active Zone</p>
          </div>
        </div>
      )}
    </div>
  );
}
