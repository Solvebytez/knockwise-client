"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  DrawingManager,
  Marker,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useTerritoryStore } from "@/store/territoryStore";
import type { Resident, ResidentStatus } from "@/types/territory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Grid3X3, Circle, Trash2, Calendar } from "lucide-react";
import { useTerritoryStore as useTerritoryStoreState } from "@/store/territoryStore";

const libraries: ("drawing" | "geometry" | "places")[] = [
  "drawing",
  "geometry",
  "places",
];

const statusColors: Record<ResidentStatus, string> = {
  new: "#3B82F6",
  knocked: "#EF4444",
  "not-home": "#F97316",
  interested: "#EAB308",
  callback: "#06B6D4",
  "not-interested": "#EC4899",
  "do-not-knock": "#8B5CF6",
  appointment: "#22C55E",
};

const statusLabels: Record<ResidentStatus, string> = {
  new: "New",
  knocked: "Knocked",
  "not-home": "Not Home",
  interested: "Interested",
  callback: "Callback",
  "not-interested": "Not Interested",
  "do-not-knock": "Do Not Knock",
  appointment: "Appointment",
};

export function TerritoryMap() {
  const {
    territories,
    residents,
    mapSettings,
    isDrawingMode,
    selectedTerritory,
    setDrawingMode,
    addTerritory,
    selectTerritory,
    updateResidentStatus,
    setMapType,
    assignTerritoryToRep,
  } = useTerritoryStore();
  const { clearAllTerritories } = useTerritoryStoreState.getState();

  const [selectedResident, setSelectedResident] = useState<Resident | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [isTiltView, setIsTiltView] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapViewType, setMapViewType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">(mapSettings.mapType as "roadmap" | "satellite" | "hybrid" | "terrain");
  const [territorySearch, setTerritorySearch] = useState("");
  const [assignedRep, setAssignedRep] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [mapRef, setMapRef] = useState<any | null>(null);
  const drawingManagerRef = useRef<any | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesService, setPlacesService] = useState<any>(null);
  const [territorySearchSuggestions, setTerritorySearchSuggestions] = useState<
    any[]
  >([]);
  const [showTerritorySuggestions, setShowTerritorySuggestions] =
    useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [residentsInCurrentPolygon, setResidentsInCurrentPolygon] = useState<
    string[]
  >([]);
  const [workflowStep, setWorkflowStep] = useState<
    "drawing" | "saving" | "assigning"
  >("drawing");
  const [pendingTerritory, setPendingTerritory] = useState<any>(null);
  const [territoryName, setTerritoryName] = useState("");
  const [territoryDescription, setTerritoryDescription] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    setIsMapLoaded(Boolean(isLoaded));
  }, [isLoaded]);

  // Ensure map view type is applied when map loads
  useEffect(() => {
    if (mapRef && isLoaded) {
      mapRef.setMapTypeId(mapViewType);
    }
  }, [mapRef, isLoaded, mapViewType]);

  // Sync map view type with store on mount
  useEffect(() => {
    if (mapSettings.mapType !== mapViewType) {
      setMapViewType(mapSettings.mapType as "roadmap" | "satellite" | "hybrid" | "terrain");
    }
  }, [mapSettings.mapType]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (value.length > 2 && placesService && window.google) {
        const request = {
          input: value,
          componentRestrictions: { country: "us" },
        };

        const autocompleteService =
          new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSearchSuggestions(predictions.slice(0, 5));
              setShowSuggestions(true);
            } else {
              setSearchSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [placesService]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      setSearchQuery(suggestion.description);
      setShowSuggestions(false);

      if (placesService && window.google) {
        const request = {
          placeId: suggestion.place_id,
          fields: ["geometry", "name", "formatted_address"],
        };

        placesService.getDetails(request, (place: any, status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place.geometry
          ) {
            const location = place.geometry.location;
            mapRef?.panTo(location);
            mapRef?.setZoom(17);
          }
        });
      }
    },
    [placesService, mapRef]
  );

  const handleTerritorySearchChange = useCallback(
    (value: string) => {
      setTerritorySearch(value);

      if (value.length > 2 && placesService && window.google) {
        const request = {
          input: value,
          componentRestrictions: { country: "us" },
        };

        const autocompleteService =
          new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setTerritorySearchSuggestions(predictions.slice(0, 5));
              setShowTerritorySuggestions(true);
            } else {
              setTerritorySearchSuggestions([]);
              setShowTerritorySuggestions(false);
            }
          }
        );
      } else {
        setTerritorySearchSuggestions([]);
        setShowTerritorySuggestions(false);
      }
    },
    [placesService]
  );

  const handleTerritorySuggestionSelect = useCallback(
    (suggestion: any) => {
      setTerritorySearch(suggestion.description);
      setShowTerritorySuggestions(false);

      if (placesService && window.google) {
        const request = {
          placeId: suggestion.place_id,
          fields: ["geometry", "name", "formatted_address"],
        };

        placesService.getDetails(request, (place: any, status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place.geometry
          ) {
            const location = place.geometry.location;
            mapRef?.panTo(location);
            mapRef?.setZoom(17);
          }
        });
      }
    },
    [placesService, mapRef]
  );

  const detectResidentsInPolygon = useCallback(
    (polygon: any) => {
      if (!polygon || !window.google?.maps?.geometry?.poly) {
        setResidentsInCurrentPolygon([]);
        return;
      }

      const residentsInside = residents.filter((resident) => {
        const point = new window.google.maps.LatLng(resident.lat, resident.lng);
        return window.google.maps.geometry.poly.containsLocation(
          point,
          polygon
        );
      });

      setResidentsInCurrentPolygon(residentsInside.map((r) => r.id));

      // Show real-time feedback
      console.log(
        `Real-time detection: ${residentsInside.length} residents in current polygon`
      );
    },
    [residents]
  );

  const onPolygonComplete = useCallback(
    (polygon: any) => {
      const path = polygon
        .getPath()
        .getArray()
        .map((latLng: any) => ({
          lat: latLng.lat(),
          lng: latLng.lng(),
        }));

      // Create a proper Google Maps polygon for containment checking
      const tempPolygon = new window.google.maps.Polygon({
        paths: path,
      });

      const residentsInside = residents.filter((resident) => {
        if (!window.google?.maps?.geometry?.poly) {
          console.error("Google Maps geometry library not loaded");
          return false;
        }

        const point = new window.google.maps.LatLng(resident.lat, resident.lng);
        const isInside = window.google.maps.geometry.poly.containsLocation(
          point,
          tempPolygon
        );

        if (isInside) {
          console.log(`Resident ${resident.name} is inside the polygon`);
        }

        return isInside;
      });

      const territoryData = {
        polygon: path,
        residents: residentsInside.map((r) => r.id),
        residentsData: residentsInside,
      };

      setPendingTerritory(territoryData);
      setDrawingMode(false);
      setWorkflowStep("saving");
      polygon.setMap(null);

      setCurrentPolygon(null);
      setResidentsInCurrentPolygon([]);

      // Enhanced logging
      console.log(
        `Territory drawn with ${residentsInside.length} residents inside:`
      );
      residentsInside.forEach((r) =>
        console.log(`- ${r.name} at ${r.address}`)
      );
    },
    [residents, setDrawingMode]
  );

  const handleSaveTerritory = () => {
    if (!pendingTerritory || !territoryName.trim()) {
      alert("Please enter a territory name");
      return;
    }

    const saveData = {
      territory: {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
        polygon: pendingTerritory.polygon,
        status: "draft",
        createdAt: new Date(),
        metadata: {
          totalResidents: pendingTerritory.residents.length,
          polygonPoints: pendingTerritory.polygon.length,
          createdBy: "SubAdmin", // This would come from current user context
          source: "KnockWise Territory Management",
        },
      },
      residents: pendingTerritory.residentsData.map((resident: any) => ({
        id: resident.id,
        name: resident.name,
        address: resident.address,
        lat: resident.lat,
        lng: resident.lng,
        status: resident.status,
        phone: resident.phone,
        email: resident.email,
      })),
      geometry: {
        type: "Polygon",
        coordinates: [
          pendingTerritory.polygon.map((point: any) => [point.lng, point.lat]),
        ],
      },
      submission: {
        submittedAt: new Date(),
        workflowStep: "territory_creation",
        nextStep: "territory_assignment",
      },
    };

    console.log("=== SAVE TERRITORY SUBMISSION DATA ===");
    console.log("Territory Name:", saveData.territory.name);
    console.log(
      "Territory Description:",
      saveData.territory.description || "No description"
    );
    console.log("Status:", saveData.territory.status);
    console.log(
      "Total Residents Found:",
      saveData.territory.metadata.totalResidents
    );
    console.log("Polygon Points:", saveData.territory.metadata.polygonPoints);
    console.log("Residents Data:");
    saveData.residents.forEach((resident: any, index: any) => {
      console.log(
        `  ${index + 1}. ${resident.name} - ${resident.address} (${
          resident.status
        })`
      );
    });
    console.log("Full Save Territory Object:");
    console.log(JSON.stringify(saveData, null, 2));
    console.log("=== END SAVE TERRITORY DATA ===");

    const newTerritory = {
      id: Date.now().toString(),
      name: territoryName.trim(),
      description: territoryDescription.trim(),
      polygon: pendingTerritory.polygon,
      residents: pendingTerritory.residents,
      status: "draft" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addTerritory(newTerritory);
    selectTerritory(newTerritory);

    // Reset territory save form
    setTerritoryName("");
    setTerritoryDescription("");
    setPendingTerritory(null);
    setWorkflowStep("assigning");

    alert(
      `Territory "${newTerritory.name}" saved successfully!\n\nStatus: Draft\nResidents: ${newTerritory.residents.length}\n\nCheck browser console (F12) for complete API submission data.\n\nYou can now assign it to a sales rep or leave it as draft for later.`
    );
  };

  const handleCancelSave = () => {
    setPendingTerritory(null);
    setTerritoryName("");
    setTerritoryDescription("");
    setWorkflowStep("drawing");
  };

  const handleAssignTerritory = () => {
    if (selectedTerritory && assignedRep && assignedDate) {
      const submitData = {
        territory: {
          id: selectedTerritory.id,
          name: selectedTerritory.name,
          description: selectedTerritory.description || "",
          polygon: selectedTerritory.polygon,
          status: "assigned",
          createdAt: selectedTerritory.createdAt,
          updatedAt: new Date(),
        },
        assignment: {
          assignedTo: assignedRep,
          assignedDate: assignedDate,
          assignedBy: "SubAdmin", // This would come from current user context
          assignedAt: new Date(),
        },
        residents: selectedTerritory.residents
          .map((residentId) => {
            const resident = residents.find((r) => r.id === residentId);
            return resident
              ? {
                  id: resident.id,
                  name: resident.name,
                  address: resident.address,
                  lat: resident.lat,
                  lng: resident.lng,
                  status: resident.status,
                  phone: resident.phone,
                  email: resident.email,
                }
              : null;
          })
          .filter(Boolean),
        metadata: {
          totalResidents: selectedTerritory.residents.length,
          territoryArea: selectedTerritory.polygon.length,
          submittedAt: new Date(),
          source: "KnockWise Territory Management",
        },
      };

      console.log("=== TERRITORY ASSIGNMENT SUBMISSION DATA ===");
      console.log("Territory ID:", submitData.territory.id);
      console.log("Territory Name:", submitData.territory.name);
      console.log("Assigned To:", submitData.assignment.assignedTo);
      console.log("Assignment Date:", submitData.assignment.assignedDate);
      console.log("Total Residents:", submitData.metadata.totalResidents);
      console.log("Full Submission Object:");
      console.log(JSON.stringify(submitData, null, 2));
      console.log("=== END SUBMISSION DATA ===");

      // Update the store
      assignTerritoryToRep(
        selectedTerritory.id,
        assignedRep,
        new Date(assignedDate)
      );

      // Reset form and workflow
      setAssignedRep("");
      setAssignedDate("");
      selectTerritory(null);
      setWorkflowStep("drawing");

      alert(
        `Territory "${selectedTerritory.name}" successfully assigned to ${assignedRep}!\n\nStatus changed from Draft to Assigned.\n\nCheck browser console (F12) for complete API submission data.`
      );
    } else {
      const missingFields = [];
      if (!selectedTerritory) missingFields.push("No territory selected");
      if (!assignedRep) missingFields.push("Sales rep name required");
      if (!assignedDate) missingFields.push("Assignment date required");

      alert(`Cannot assign territory:\n${missingFields.join("\n")}`);
    }
  };

  const handleResidentClick = (resident: Resident) => {
    if (isMarkingMode) {
      const currentIndex = Object.keys(statusColors).indexOf(resident.status);
      const nextIndex = (currentIndex + 1) % Object.keys(statusColors).length;
      const nextStatus = Object.keys(statusColors)[nextIndex] as ResidentStatus;
      updateResidentStatus(resident.id, nextStatus);
    } else {
      setSelectedResident(resident);
    }
  };

  const handleClearAreas = useCallback(() => {
    clearAllTerritories();
    setTerritorySearch("");
    setPendingTerritory(null);
    setWorkflowStep("drawing");
    setTerritoryName("");
    setTerritoryDescription("");
    setAssignedRep("");
    setAssignedDate("");
    setSelectedResident(null);
    setResidentsInCurrentPolygon([]);
    setCurrentPolygon(null);
    setIsMarkingMode(false);
  }, []);

  const handleTiltView = () => {
    if (mapRef) {
      const newTiltState = !isTiltView;
      setIsTiltView(newTiltState);

      if (newTiltState) {
        mapRef.setMapTypeId(mapViewType);
        mapRef.setTilt(45);
      } else {
        mapRef.setMapTypeId(mapViewType);
        mapRef.setTilt(0);
      }
    }
  };

  const handleMapViewChange = (viewType: "roadmap" | "satellite" | "hybrid" | "terrain") => {
    setMapViewType(viewType);
    setMapType(viewType); // Update store
    if (mapRef) {
      mapRef.setMapTypeId(viewType);
    }
  };

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMarkerIcon = (status: ResidentStatus, residentId: string) => {
    if (!isMapLoaded || !window.google) {
      return undefined;
    }

    // Check if resident is in any territory
    const isInTerritory = territories.some((territory) =>
      territory.residents.includes(residentId)
    );

    const isInCurrentPolygon = residentsInCurrentPolygon.includes(residentId);

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: isInTerritory ? 10 : isInCurrentPolygon ? 12 : 8, // Largest for current polygon
      fillColor: statusColors[status],
      fillOpacity: 1,
      strokeColor: isInCurrentPolygon
        ? "#FF0000"
        : isInTerritory
        ? "#FFD700"
        : "#ffffff", // Red for current polygon
      strokeWeight: isInCurrentPolygon ? 4 : isInTerritory ? 3 : 2, // Thickest for current polygon
    };
  };

  return (
    <div className="flex h-full mt-4">
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            center={mapSettings.center}
            zoom={mapSettings.zoom}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            mapTypeId={mapViewType}
            tilt={isTiltView ? 45 : 0}
            onLoad={(map) => {
              setMapRef(map);
              if (window.google) {
                setPlacesService(
                  new window.google.maps.places.PlacesService(map)
                );
              }
            }}
            options={{
              mapTypeControl: true,
              mapTypeControlOptions: {
                position:
                  typeof window !== "undefined"
                    ? window.google?.maps?.ControlPosition?.TOP_LEFT
                    : undefined,
              },
            }}
          >
            {isDrawingMode && (
              <DrawingManager
                ref={drawingManagerRef}
                onPolygonComplete={onPolygonComplete}
                options={{
                  drawingControl: false,
                  drawingMode:
                    typeof window !== "undefined"
                      ? window.google?.maps?.drawing?.OverlayType?.POLYGON
                      : undefined,
                  polygonOptions: {
                    fillColor: "#42A5F5",
                    fillOpacity: 0.2,
                    strokeColor: "#42A5F5",
                    strokeWeight: 2,
                    editable: true,
                  },
                }}
              />
            )}

            {territories.map((territory) => (
              <Polygon
                key={territory.id}
                path={territory.polygon}
                options={{
                  fillColor:
                    selectedTerritory?.id === territory.id
                      ? "#42A5F5"
                      : "#10B981",
                  fillOpacity: 0.2,
                  strokeColor:
                    selectedTerritory?.id === territory.id
                      ? "#42A5F5"
                      : "#10B981",
                  strokeWeight: 2,
                  strokeOpacity: 0.8,
                }}
                onClick={() => selectTerritory(territory)}
              />
            ))}

            {/* Show the just-drawn polygon during the Save step */}
            {workflowStep === "saving" && pendingTerritory?.polygon && (
              <Polygon
                path={pendingTerritory.polygon}
                options={{
                  fillColor: "#42A5F5",
                  fillOpacity: 0.2,
                  strokeColor: "#42A5F5",
                  strokeWeight: 2,
                  strokeOpacity: 0.8,
                }}
              />
            )}

            {filteredResidents.map((resident) => (
              <Marker
                key={resident.id}
                position={{ lat: resident.lat, lng: resident.lng }}
                icon={createMarkerIcon(resident.status, resident.id)}
                onClick={() => handleResidentClick(resident)}
                title={`${resident.name} - ${resident.address} ${
                  residentsInCurrentPolygon.includes(resident.id)
                    ? "(In Current Drawing)"
                    : territories.some((t) => t.residents.includes(resident.id))
                    ? "(In Territory)"
                    : ""
                }`}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#42A5F5]" />
          </div>
        )}

        <div className="absolute top-16 left-4 z-10">
          {showSearch ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-64">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  placeholder="Search addresses or names..."
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
                title="Search residents"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>

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
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
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
              title="Hybrid View (Recommended for Territory Drawing)"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
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
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </Button>
            <Button
              variant={isMarkingMode ? "default" : "ghost"}
              size="icon"
              className={`h-10 w-10 ${
                isMarkingMode
                  ? "bg-[#42A5F5] text-white hover:bg-[#42A5F5]/90"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMarkingMode(!isMarkingMode)}
              title="Quick Mark Mode"
            >
              <Circle className="h-5 w-5 fill-current" />
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
          </div>
        </div>

        {((workflowStep === "drawing") || territories.length > 0 || !!pendingTerritory) && (
          <div className="absolute bottom-20 left-4 z-10 flex flex-col gap-2">
            {workflowStep === "drawing" && (
            <Button
              onClick={() => setDrawingMode(!isDrawingMode)}
              variant={isDrawingMode ? "default" : "outline"}
              className={`${
                isDrawingMode
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-[#FFC107] hover:bg-[#FFC107]/90 text-black"
              } shadow-lg`}
            >
              {isDrawingMode ? "Stop Drawing" : "Draw Area"}
            </Button>
            )}
            {(territories.length > 0 || !!pendingTerritory) && (
              <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white shadow-lg hover:bg-gray-50"
                  >
                    Clear Areas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all areas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the current drawing and any saved draft territories from the map and reset the workflow.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAreas}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {isDrawingMode && residentsInCurrentPolygon.length > 0 && (
          <div className="absolute top-32 right-4 z-10">
            <div className="bg-red-500 text-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-sm font-medium">Drawing Territory</div>
              <div className="text-xs">
                {residentsInCurrentPolygon.length} residents detected
              </div>
            </div>
          </div>
        )}

        {isMarkingMode && (
          <div className="absolute top-16 right-4 z-10">
            <div className="bg-[#42A5F5] text-white rounded-lg shadow-lg px-3 py-2">
              <div className="text-sm font-medium">Quick Mark Mode Active</div>
              <div className="text-xs">Click markers to change status</div>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
        <div className="p-4 space-y-4 bg-white">
          {workflowStep === "drawing" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-gray-900">Territory Drawing</div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDrawingMode(!isDrawingMode)}
                    className={`flex-1 font-medium ${
                      isDrawingMode
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-[#FFC107] hover:bg-[#FFC107]/90 text-black"
                    }`}
                  >
                    {isDrawingMode ? "Stop Drawing" : "Draw Territory"}
                  </Button>
                  {territories.length > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-transparent border-gray-300 hover:bg-gray-50"
                      onClick={handleClearAreas}
                      title="Clear All Territories"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Territory Search
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search area to draw territory"
                      value={territorySearch}
                      onChange={(e) =>
                        handleTerritorySearchChange(e.target.value)
                      }
                      className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white"
                    />
                    {showTerritorySuggestions &&
                      territorySearchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {territorySearchSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.place_id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              onClick={() =>
                                handleTerritorySuggestionSelect(suggestion)
                              }
                            >
                              <div className="font-medium text-gray-900">
                                {suggestion.structured_formatting?.main_text ||
                                  suggestion.description}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {suggestion.structured_formatting
                                  ?.secondary_text || ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {workflowStep === "saving" && pendingTerritory && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-[#42A5F5]">
                  Save Territory
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <div className="text-sm font-medium text-[#42A5F5] mb-1">
                    Territory Drawn Successfully!
                  </div>
                  <div className="text-xs text-gray-600">
                    Found {pendingTerritory.residents.length} residents in the
                    selected area
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Territory Name *
                  </label>
                  <Input
                    placeholder="Enter territory name (e.g., Downtown Dallas)"
                    value={territoryName}
                    onChange={(e) => setTerritoryName(e.target.value)}
                    className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#42A5F5] focus:border-transparent resize-none bg-white"
                    placeholder="Optional description for this territory"
                    value={territoryDescription}
                    onChange={(e) => setTerritoryDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Territory Summary
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Residents Found:</span>
                      <span className="font-semibold text-[#42A5F5]">
                        {pendingTerritory.residents.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-semibold text-orange-600">
                        Draft
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTerritory}
                    className="flex-1 bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white font-medium"
                    disabled={!territoryName.trim()}
                  >
                    Save Territory
                  </Button>
                  <Button
                    onClick={handleCancelSave}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                  >
                    Clear Drawing
                  </Button>
                </div>
              </div>
            </div>
          )}

          {workflowStep === "assigning" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-gray-900">Territory Assignment</div>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-1">
                    Territory Saved as Draft
                  </div>
                  <div className="text-xs text-gray-600">
                    You can assign it now or leave it for later assignment
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Assign to Sales Rep
                  </label>
                  <Input
                    placeholder="Enter sales rep name"
                    value={assignedRep}
                    onChange={(e) => setAssignedRep(e.target.value)}
                    className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Date Assigned
                  </label>
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

                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignTerritory}
                    className="flex-1 bg-[#FFC107] hover:bg-[#FFC107]/90 text-black font-medium"
                    disabled={
                      !selectedTerritory || !assignedRep || !assignedDate
                    }
                  >
                    Assign Territory
                  </Button>
                  <Button
                    onClick={() => {
                      setWorkflowStep("drawing");
                      selectTerritory(null);
                      setAssignedRep("");
                      setAssignedDate("");
                    }}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={() => {
                      handleClearAreas();
                      setAssignedRep("");
                      setAssignedDate("");
                      selectTerritory(null);
                      setWorkflowStep("drawing");
                    }}
                    variant="outline"
                    className="px-4 bg-transparent border-gray-300 hover:bg-gray-50"
                  >
                    Clear Areas
                  </Button>
                </div>

                {selectedTerritory && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Territory Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{selectedTerritory.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className="text-orange-600 font-semibold">
                          {selectedTerritory.status === "draft"
                            ? "Draft"
                            : "Assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Residents:</span>
                        <span className="font-semibold text-[#42A5F5]">
                          {selectedTerritory.residents.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span>
                          {selectedTerritory.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {selectedTerritory.description && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="text-gray-600 text-xs mt-1">
                            {selectedTerritory.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Drawing Card */}
          {isDrawingMode && residentsInCurrentPolygon.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="pb-3">
                <div className="text-lg font-semibold text-red-600">
                  Current Drawing
                </div>
              </div>
              <div>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Residents Detected:</span>
                    <span className="font-bold text-red-600">
                      {residentsInCurrentPolygon.length}
                    </span>
                  </div>
                  {residentsInCurrentPolygon.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2 border border-red-100">
                      {residentsInCurrentPolygon.map((residentId) => {
                        const resident = residents.find(
                          (r) => r.id === residentId
                        );
                        return resident ? (
                          <div
                            key={residentId}
                            className="text-xs py-1 border-b border-red-200 last:border-b-0"
                          >
                            <div className="font-medium">{resident.name}</div>
                            <div className="text-gray-600">
                              {resident.address}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Complete the polygon to create territory
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
