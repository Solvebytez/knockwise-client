"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  DrawingManager,
  Marker,
  Polygon,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Search,
  Layers,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Circle,
  RotateCw,
  Navigation,
  Map as MapIcon,
  Satellite,
  Loader2,
  X,
} from "lucide-react";
import { apiInstance } from "@/lib/apiInstance";
import { toast } from "sonner";

interface TerritoryEditMapProps {
  territory: {
    _id: string;
    name: string;
    description?: string;
    boundary: {
      type: string;
      coordinates: number[][][];
    };
  } | null;
  showExistingTerritories?: boolean;
  onToggleExistingTerritories?: (show: boolean) => void;
  onExistingTerritoriesCountChange?: (count: number) => void;
  focusTrigger?: number;
  isEditingBoundary?: boolean;
  onBoundaryUpdate?: (newBoundary: any) => void;
  onApplyDrawnBoundary?: () => void;
  onCancelDrawing?: () => void;
  overlapCheckEndpoint?: string;
}

export function TerritoryEditMap({
  territory,
  showExistingTerritories: externalShowExistingTerritories,
  onToggleExistingTerritories: externalOnToggleExistingTerritories,
  onExistingTerritoriesCountChange,
  focusTrigger,
  isEditingBoundary,
  onBoundaryUpdate,
  onApplyDrawnBoundary,
  onCancelDrawing,
  overlapCheckEndpoint = "/zones/check-overlap",
}: TerritoryEditMapProps) {
  const [mapViewType, setMapViewType] = useState<
    "roadmap" | "satellite" | "hybrid" | "terrain"
  >("hybrid");
  const [mapRef, setMapRef] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isTiltView, setIsTiltView] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesService, setPlacesService] = useState<any>(null);
  const [existingTerritories, setExistingTerritories] = useState<any[]>([]);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(true);
  // Use external props if provided, otherwise use internal state
  const [internalShowExistingTerritories, setInternalShowExistingTerritories] =
    useState(true);
  const showExistingTerritories =
    externalShowExistingTerritories !== undefined
      ? externalShowExistingTerritories
      : internalShowExistingTerritories;
  const setShowExistingTerritories =
    externalOnToggleExistingTerritories || setInternalShowExistingTerritories;

  // Drawing manager state
  const drawingManagerRef = useRef<any | null>(null);
  const [drawingManagerInstance, setDrawingManagerInstance] =
    useState<any>(null);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [drawnBoundary, setDrawnBoundary] = useState<any>(null);
  const [isMapInitiallyLoaded, setIsMapInitiallyLoaded] = useState(false);

  const { isLoaded, loadError } = useGoogleMaps();

  // Fetch existing territories
  useEffect(() => {
    const fetchExistingTerritories = async () => {
      try {
        setIsLoadingTerritories(true);
        // Use visualization=true to get ALL territories regardless of user role for overlap prevention
        const response = await apiInstance.get(
          "/zones/list-all?visualization=true"
        );
        const territories = response.data.data || [];
        console.log(
          "Fetched existing territories for visualization:",
          territories
        );
        console.log("Current territory ID:", territory?._id);
        console.log(
          "Territories with boundaries:",
          territories.filter((t: any) => t.boundary?.coordinates)
        );
        setExistingTerritories(territories);
      } catch (error) {
        console.error("Error fetching existing territories:", error);
        setExistingTerritories([]);
      } finally {
        setIsLoadingTerritories(false);
      }
    };

    fetchExistingTerritories();
  }, [territory?._id]);

  // Notify parent component when existing territories count changes
  useEffect(() => {
    if (onExistingTerritoriesCountChange) {
      onExistingTerritoriesCountChange(existingTerritories.length);
    }
  }, [existingTerritories.length, onExistingTerritoriesCountChange]);

  // Focus on current territory function
  const focusOnTerritory = useCallback(() => {
    if (mapRef && territory?.boundary?.coordinates) {
      console.log("Focusing on territory via button:", territory.name);
      const bounds = new google.maps.LatLngBounds();
      territory.boundary.coordinates[0].forEach((coord: number[]) => {
        bounds.extend({ lat: coord[1], lng: coord[0] });
      });
      mapRef.fitBounds(bounds);
      // Set a reasonable zoom level after focusing
      setTimeout(() => {
        const currentZoom = mapRef.getZoom();
        if (currentZoom && currentZoom > 16) {
          mapRef.setZoom(16);
        }
        console.log("Button focus completed with zoom:", mapRef.getZoom());
      }, 100);
    }
  }, [mapRef, territory]);

  // Handle focus trigger from parent component
  useEffect(() => {
    if (focusTrigger && focusTrigger > 0) {
      focusOnTerritory();
    }
  }, [focusTrigger, focusOnTerritory]);

  // Reset map initially loaded state when territory changes
  useEffect(() => {
    setIsMapInitiallyLoaded(false);
  }, [territory?._id]);

  // Force focus on territory when territory data changes
  useEffect(() => {
    if (mapRef && territory?.boundary?.coordinates) {
      console.log(
        "Force focusing on territory after data change:",
        territory.name
      );
      const bounds = new google.maps.LatLngBounds();
      territory.boundary.coordinates[0].forEach((coord: number[]) => {
        bounds.extend({ lat: coord[1], lng: coord[0] });
      });
      mapRef.fitBounds(bounds);
      // Set a reasonable zoom level
      setTimeout(() => {
        const currentZoom = mapRef.getZoom();
        if (currentZoom && currentZoom > 16) {
          mapRef.setZoom(16);
        }
        console.log("Force focused with zoom:", mapRef.getZoom());
      }, 100);
    }
  }, [mapRef, territory?.boundary?.coordinates]);

  // Additional focus trigger when component mounts with territory data
  useEffect(() => {
    if (mapRef && territory?.boundary?.coordinates && !isMapInitiallyLoaded) {
      console.log("Component mount focus on territory:", territory.name);
      setTimeout(() => {
        const bounds = new google.maps.LatLngBounds();
        territory.boundary.coordinates[0].forEach((coord: number[]) => {
          bounds.extend({ lat: coord[1], lng: coord[0] });
        });
        mapRef.fitBounds(bounds);
        setTimeout(() => {
          const currentZoom = mapRef.getZoom();
          if (currentZoom && currentZoom > 16) {
            mapRef.setZoom(16);
          }
          console.log("Component mount focused with zoom:", mapRef.getZoom());
          setIsMapInitiallyLoaded(true);
        }, 100);
      }, 300);
    }
  }, [mapRef, territory?.boundary?.coordinates, isMapInitiallyLoaded]);

  // Handle boundary editing mode
  useEffect(() => {
    if (isEditingBoundary) {
      // Set cursor to crosshair for drawing mode
      if (mapRef) {
        mapRef.setOptions({ draggableCursor: "crosshair" });
      }
      // Enable drawing mode on the drawing manager
      if (drawingManagerInstance) {
        drawingManagerInstance.setDrawingMode(
          google.maps.drawing.OverlayType.POLYGON
        );
      }
    } else {
      // Reset cursor to default when not in drawing mode
      if (mapRef) {
        mapRef.setOptions({ draggableCursor: "grab" });
      }
      // Disable drawing mode on the drawing manager
      if (drawingManagerInstance) {
        drawingManagerInstance.setDrawingMode(null);
      }
    }
  }, [isEditingBoundary, mapRef, drawingManagerInstance]);

  const onLoad = useCallback(
    (map: any) => {
      setMapRef(map);
      if (window.google) {
        setPlacesService(new window.google.maps.places.PlacesService(map));
      }

      // Force set the map type to hybrid on load
      map.setMapTypeId(google.maps.MapTypeId.HYBRID);

      // Always focus on the current territory on initial load
      if (territory?.boundary?.coordinates) {
        console.log("Focusing on territory on map load:", territory.name);
        // Add a small delay to ensure map is fully loaded
        setTimeout(() => {
          const bounds = new google.maps.LatLngBounds();
          territory.boundary.coordinates[0].forEach((coord: number[]) => {
            bounds.extend({ lat: coord[1], lng: coord[0] });
          });
          map.fitBounds(bounds);
          // Set a reasonable zoom level that's not too zoomed in
          setTimeout(() => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 16) {
              map.setZoom(16); // Cap the zoom level
            }
            console.log("Map focused on territory with zoom:", map.getZoom());
          }, 100);
          setIsMapInitiallyLoaded(true);
        }, 200);
      }
    },
    [territory]
  );

  // Check if drawn polygon overlaps with existing territories
  const checkTerritoryOverlap = useCallback(
    (newPolygon: any) => {
      if (!window.google || !window.google.maps.geometry) {
        console.warn("Google Maps Geometry library not loaded");
        return false;
      }

      return existingTerritories.some((existingTerritory) => {
        // Skip the current territory being edited
        if (existingTerritory._id === territory?._id) return false;

        // Skip territories without boundaries
        if (!existingTerritory.boundary?.coordinates) return false;

        try {
          // Create Google Maps polygon for existing territory
          const existingPolygon = new window.google.maps.Polygon({
            paths: existingTerritory.boundary.coordinates[0].map(
              (coord: number[]) => ({
                lat: coord[1],
                lng: coord[0],
              })
            ),
          });

          // Check if any point from new polygon is inside existing polygon
          const newPolygonPath = newPolygon.getPath();
          for (let i = 0; i < newPolygonPath.getLength(); i++) {
            const point = newPolygonPath.getAt(i);
            if (
              window.google.maps.geometry.poly.containsLocation(
                point,
                existingPolygon
              )
            ) {
              return true;
            }
          }

          // Check if any point from existing polygon is inside new polygon
          const existingPolygonPath = existingPolygon.getPath();
          for (let i = 0; i < existingPolygonPath.getLength(); i++) {
            const point = existingPolygonPath.getAt(i);
            if (
              window.google.maps.geometry.poly.containsLocation(
                point,
                newPolygon
              )
            ) {
              return true;
            }
          }

          return false;
        } catch (error) {
          console.error("Error checking polygon intersection:", error);
          return false;
        }
      });
    },
    [existingTerritories, territory?._id]
  );

  // Check overlap with backend
  const checkBackendOverlap = useCallback(
    async (polygon: any) => {
      try {
        const polygonCoords = polygon
          .getPath()
          .getArray()
          .map((latLng: any) => [latLng.lng(), latLng.lat()]);

        // Ensure polygon is closed
        if (polygonCoords.length > 0) {
          const firstCoord = polygonCoords[0];
          const lastCoord = polygonCoords[polygonCoords.length - 1];
          if (
            firstCoord[0] !== lastCoord[0] ||
            firstCoord[1] !== lastCoord[1]
          ) {
            polygonCoords.push([...firstCoord]);
          }
        }

        const response = await apiInstance.post(overlapCheckEndpoint, {
          boundary: {
            type: "Polygon",
            coordinates: [polygonCoords],
          },
          excludeZoneId: territory?._id, // Exclude current territory from overlap check
        });

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || "Failed to check overlap");
        }
      } catch (error) {
        console.error("Error checking backend overlap:", error);
        // Fallback to frontend validation
        return null;
      }
    },
    [territory?._id, overlapCheckEndpoint]
  );

  // Validate territory before proceeding
  const validateTerritory = useCallback(
    async (polygon: any) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // First try backend validation
      const backendValidation = await checkBackendOverlap(polygon);

      if (backendValidation) {
        if (backendValidation.hasOverlap) {
          const zoneNames = backendValidation.overlappingZones
            .map((zone: any) => zone.name)
            .join(", ");
          errors.push(
            `This area overlaps with existing territory(ies): ${zoneNames}`
          );
        }

        return {
          errors,
          warnings,
          backendValidation,
        };
      }

      // Fallback to frontend validation
      if (checkTerritoryOverlap(polygon)) {
        errors.push("This area overlaps with an existing territory");
      }

      return { errors, warnings };
    },
    [checkTerritoryOverlap, checkBackendOverlap]
  );

  // Handle polygon completion
  const onPolygonComplete = useCallback(
    async (polygon: any) => {
      if (currentPolygon) {
        currentPolygon.setMap(null);
      }

      setCurrentPolygon(polygon);

      // Validate territory before proceeding
      const validation = await validateTerritory(polygon);

      if (validation.errors.length > 0) {
        // Show error and remove polygon
        console.error(
          "Territory overlap detected:",
          validation.errors.join(", ")
        );
        polygon.setMap(null);
        setCurrentPolygon(null);

        // Reset cursor to default
        if (mapRef) {
          mapRef.setOptions({ draggableCursor: "grab" });
        }

        // Show error message using toast
        toast.error(validation.errors.join(", "));
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Territory warnings:", validation.warnings.join(", "));
        toast.warning(validation.warnings.join(", "));
      }

      // Convert polygon to GeoJSON format
      const path = polygon.getPath();
      const coordinates = path
        .getArray()
        .map((latLng: any) => [latLng.lng(), latLng.lat()]);

      // Close the polygon by adding the first point at the end
      coordinates.push(coordinates[0]);

      const newBoundary = {
        type: "Polygon",
        coordinates: [coordinates],
      };

      // Store the boundary locally
      setDrawnBoundary(newBoundary);

      // Reset cursor to default after drawing is complete
      if (mapRef) {
        mapRef.setOptions({ draggableCursor: "grab" });
      }

      // Show success message
      toast.success("New boundary drawn successfully! No overlaps detected.");

      // Immediately trigger building detection like the working TerritoryMap component
      console.log(
        "Polygon drawn successfully, triggering building detection..."
      );
      if (onBoundaryUpdate) {
        onBoundaryUpdate(newBoundary);
      }
    },
    [currentPolygon, mapRef, onBoundaryUpdate, validateTerritory]
  );

  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (!value.trim() || !placesService) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const request = {
      input: value,
      componentRestrictions: { country: "ca" }, // Restrict to Canada
      types: ["address"],
    };

    const autocompleteService =
      new window.google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        predictions
      ) {
        setSearchSuggestions(predictions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (!placesService || !mapRef) return;

    placesService.getDetails(
      { placeId: suggestion.place_id },
      (place: any, status: any) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          place.geometry
        ) {
          mapRef.setCenter(place.geometry.location);
          mapRef.setZoom(18);
          setSearchQuery(suggestion.description);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleMapViewChange = (
    viewType: "roadmap" | "satellite" | "hybrid" | "terrain"
  ) => {
    setMapViewType(viewType);
    if (mapRef) {
      const mapTypeId =
        viewType === "roadmap"
          ? google.maps.MapTypeId.ROADMAP
          : viewType === "satellite"
          ? google.maps.MapTypeId.SATELLITE
          : viewType === "hybrid"
          ? google.maps.MapTypeId.HYBRID
          : google.maps.MapTypeId.TERRAIN;
      mapRef.setMapTypeId(mapTypeId);
    }
  };

  const handleTiltView = () => {
    if (mapRef) {
      const newTilt = !isTiltView;
      setIsTiltView(newTilt);
      mapRef.setTilt(newTilt ? 45 : 0);
    }
  };

  const zoomIn = () => {
    if (mapRef) {
      mapRef.setZoom((mapRef.getZoom() || 12) + 1);
    }
  };

  const zoomOut = () => {
    if (mapRef) {
      mapRef.setZoom((mapRef.getZoom() || 12) - 1);
    }
  };

  const recenterMap = () => {
    if (mapRef && territory?.boundary?.coordinates) {
      const bounds = new google.maps.LatLngBounds();
      territory.boundary.coordinates[0].forEach((coord: number[]) => {
        bounds.extend({ lat: coord[1], lng: coord[0] });
      });
      mapRef.fitBounds(bounds);
      mapRef.setZoom(Math.min(mapRef.getZoom() || 15, 18));
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Map Loading Error
          </div>
          <div className="text-gray-600">Failed to load Google Maps</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={
            territory?.boundary?.coordinates
              ? undefined
              : { lat: 43.6532, lng: -79.3832 }
          }
          zoom={territory?.boundary?.coordinates ? undefined : 12}
          tilt={isTiltView ? 45 : 0}
          options={{
            mapTypeControl: true,
            mapTypeControlOptions: {
              position: window.google?.maps?.ControlPosition?.TOP_LEFT,
            },
            zoomControl: true,
            zoomControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
            },
            streetViewControl: true,
            streetViewControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
            },
            fullscreenControl: true,
            fullscreenControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_TOP,
            },
            draggableCursor: "grab",
            gestureHandling: "cooperative",
            minZoom: 10,
            maxZoom: 20,
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Drawing Manager - Always render but control drawing mode */}
          <DrawingManager
            ref={drawingManagerRef}
            onPolygonComplete={onPolygonComplete}
            onLoad={(drawingManager) => {
              setDrawingManagerInstance(drawingManager);
              // Only set drawing mode if we're in editing mode
              if (isEditingBoundary) {
                drawingManager.setDrawingMode(
                  google.maps.drawing.OverlayType.POLYGON
                );
              } else {
                // Clear drawing mode when not editing
                drawingManager.setDrawingMode(null);
              }
            }}
            options={{
              drawingControl: false,
              polygonOptions: {
                fillColor: "#42A5F5",
                fillOpacity: 0.2,
                strokeColor: "#42A5F5",
                strokeWeight: 3,
                strokeOpacity: 0.8,
                editable: true,
                draggable: true,
              },
            }}
          />
          {/* Territory Boundary */}
          {territory?.boundary?.coordinates && (
            <Polygon
              paths={territory.boundary.coordinates[0].map(
                (coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0],
                })
              )}
              options={{
                fillColor: "#42A5F5",
                fillOpacity: 0.2,
                strokeColor: "#42A5F5",
                strokeWeight: 3,
                strokeOpacity: 0.8,
              }}
            />
          )}

          {/* Territory Center Marker */}
          {territory?.boundary?.coordinates && (
            <Marker
              position={{
                lat:
                  territory.boundary.coordinates[0].reduce(
                    (sum: number, coord: number[]) => sum + coord[1],
                    0
                  ) / territory.boundary.coordinates[0].length,
                lng:
                  territory.boundary.coordinates[0].reduce(
                    (sum: number, coord: number[]) => sum + coord[0],
                    0
                  ) / territory.boundary.coordinates[0].length,
              }}
              icon={{
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#42A5F5" stroke="white" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
              }}
            />
          )}

          {/* Existing Territories */}
          {showExistingTerritories &&
            existingTerritories.map((existingTerritory) => {
              // Skip the current territory being edited
              if (existingTerritory._id === territory?._id) return null;

              // Only show territories that have boundaries
              if (!existingTerritory.boundary?.coordinates) return null;

              return (
                <Polygon
                  key={existingTerritory._id}
                  paths={existingTerritory.boundary.coordinates[0].map(
                    (coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    })
                  )}
                  options={{
                    fillColor: "#FF6B35",
                    fillOpacity: 0.3,
                    strokeColor: "#FF6B35",
                    strokeWeight: 3,
                    strokeOpacity: 1,
                  }}
                />
              );
            })}
        </GoogleMap>

        {/* Loading Overlay for Existing Territories */}
        {isLoadingTerritories && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">
                Loading existing territories...
              </span>
            </div>
          </div>
        )}

        {/* Search Control */}
        <div className="absolute top-16 left-4 z-10">
          {showSearch ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-64">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search addresses or locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="mt-2 border-t border-gray-200 pt-2 relative z-30">
                  <div className="max-h-48 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        className="px-2 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="font-medium text-gray-900">
                          {suggestion.structured_formatting?.main_text ||
                            suggestion.description}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {suggestion.structured_formatting?.secondary_text ||
                            ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-600 hover:bg-gray-100"
                onClick={() => setShowSearch(true)}
                title="Search locations"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Map View Controls */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <div className="flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
            <Button
              variant={mapViewType === "roadmap" ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                mapViewType === "roadmap"
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
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
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMapViewChange("hybrid")}
              title="Hybrid View (Recommended for Territory Viewing)"
            >
              <Layers className="h-5 w-5" />
            </Button>

            <Button
              variant={mapViewType === "satellite" ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                mapViewType === "satellite"
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMapViewChange("satellite")}
              title="Satellite View"
            >
              <Satellite className="h-5 w-5" />
            </Button>

            <Button
              variant={isTiltView ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                isTiltView
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={handleTiltView}
              title="Tilt View"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>

            <div className="border-t border-gray-200 my-1"></div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-gray-600 hover:bg-gray-100"
              onClick={zoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-gray-600 hover:bg-gray-100"
              onClick={zoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-gray-600 hover:bg-gray-100"
              onClick={recenterMap}
              title="Recenter on Territory"
            >
              <Navigation className="h-5 w-5" />
            </Button>

            {isLoadingTerritories && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 cursor-not-allowed"
                disabled
                title="Loading existing territories..."
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            )}
          </div>
        </div>

        {/* Drawing Mode Indicator */}
        {isEditingBoundary && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">
                {drawnBoundary
                  ? 'Boundary Drawn - Click "Update Territory" to Apply'
                  : "Drawing Mode Active - Draw your new boundary"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                onClick={() => {
                  // Reset cursor to default
                  if (mapRef) {
                    mapRef.setOptions({ draggableCursor: "grab" });
                  }
                  // Clear drawn boundary and cancel the edit
                  setDrawnBoundary(null);
                  if (currentPolygon) {
                    currentPolygon.setMap(null);
                    setCurrentPolygon(null);
                  }
                  if (onBoundaryUpdate) {
                    onBoundaryUpdate(null); // Cancel the edit
                  }
                  // Call the cancel drawing handler
                  if (onCancelDrawing) {
                    onCancelDrawing();
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Overlap Warning Indicator */}
        {showExistingTerritories && existingTerritories.length > 0 && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-medium text-sm">
                {existingTerritories.length} existing territories shown in
                orange - avoid overlaps when drawing
              </span>
            </div>
          </div>
        )}

        {/* Territory Info Overlay */}
        {territory && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">
                  {territory.name}
                </h3>
              </div>
              {territory.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {territory.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mb-2">
                Territory boundary highlighted in blue
              </div>
              {existingTerritories.length > 0 && (
                <div className="text-xs text-gray-500">
                  {showExistingTerritories
                    ? `${existingTerritories.length} other territories shown in orange`
                    : `${existingTerritories.length} other territories hidden`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
