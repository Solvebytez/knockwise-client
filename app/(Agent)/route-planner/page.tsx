"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Flag,
  Route,
  Trash2,
  Loader2,
  Navigation,
  Locate,
  Edit,
} from "lucide-react";
import { useAuthStore } from "@/store/userStore";
import {
  useMyRoutes,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
} from "@/lib/api/routeApi";
import { toast } from "sonner";
import {
  GoogleMap,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";

export default function RoutesPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useMyRoutes({ page: 1, limit: 50 });
  const createRouteMutation = useCreateRoute();
  const updateRouteMutation = useUpdateRoute();
  const deleteRouteMutation = useDeleteRoute();

  const { isLoaded } = useGoogleMaps();

  const [currentRoute, setCurrentRoute] = useState({
    name: "",
    description: "",
    addresses: [] as string[],
    transportationMode: "DRIVING" as google.maps.TravelMode,
    optimization: {
      fastestRoute: true,
      avoidFerries: false,
      avoidHighways: false,
      avoidTolls: false,
    },
  });

  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [routeAlternatives, setRouteAlternatives] = useState<Array<{
    id: string;
    summary: string;
    distance: number;
    duration: number;
    trafficCondition: string;
    legs: google.maps.DirectionsLeg[];
  }> | null>(null);

  const [gettingLocation, setGettingLocation] = useState<number | null>(null);
  const [recalculatingRouteId, setRecalculatingRouteId] = useState<
    string | null
  >(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [displayingRouteId, setDisplayingRouteId] = useState<string | null>(
    null
  );

  const handleOptimizationChange = (
    option: keyof typeof currentRoute.optimization
  ) => {
    setCurrentRoute((prev) => ({
      ...prev,
      optimization: {
        ...prev.optimization,
        [option]: !prev.optimization[option],
      },
    }));
  };

  const addAddress = () => {
    setCurrentRoute((prev) => ({
      ...prev,
      addresses: [...prev.addresses, ""],
    }));
  };

  const removeAddress = (index: number) => {
    setCurrentRoute((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  };

  const updateAddress = (index: number, value: string) => {
    setCurrentRoute((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, i) =>
        i === index ? value : address
      ),
    }));
  };

  const moveAddress = (fromIndex: number, toIndex: number) => {
    setCurrentRoute((prev) => {
      const newAddresses = [...prev.addresses];
      const [movedAddress] = newAddresses.splice(fromIndex, 1);
      newAddresses.splice(toIndex, 0, movedAddress);
      return {
        ...prev,
        addresses: newAddresses,
      };
    });
  };

  const parseBulkAddresses = (text: string): string[] => {
    // Split by lines and filter out empty lines
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const addresses: string[] = [];

    for (const line of lines) {
      // Skip lines that are just website names or common non-address text
      if (
        line
          .toLowerCase()
          .match(/^(redfin|zolo\.ca|zillow|realtor\.ca|mls|\.com|\.ca)$/)
      ) {
        continue;
      }

      // Clean up the address line
      let address = line
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/,\s*$/, "") // Remove trailing comma
        .trim();

      // Skip if it's too short to be a valid address
      if (address.length < 5) {
        // Reduced from 10 to 5 for more flexibility
        continue;
      }

      // More flexible address validation - accept addresses that:
      // 1. Start with number and contain letters, OR
      // 2. Contain common address patterns (Rd, St, Ave, Cres, etc.)
      if (
        address.match(/^\d+.*[a-zA-Z]/) ||
        address.match(
          /.*\b(Rd|St|Ave|Cres|Crt|Way|Dr|Blvd|Ln|Pl|Ct|Gdns|Gardens)\b.*/i
        )
      ) {
        addresses.push(address);
      }
    }

    return addresses;
  };

  const handleBulkImport = () => {
    const parsedAddresses = parseBulkAddresses(bulkAddresses);

    console.log("Bulk import - Raw text:", bulkAddresses);
    console.log("Bulk import - Parsed addresses:", parsedAddresses);
    console.log("Bulk import - Address count:", parsedAddresses.length);

    if (parsedAddresses.length === 0) {
      toast.error("No valid addresses found. Please check your input format.");
      return;
    }

    if (parsedAddresses.length > 25) {
      toast.error("Too many addresses. Please limit to 25 addresses maximum.");
      return;
    }

    setCurrentRoute((prev) => ({
      ...prev,
      addresses: parsedAddresses,
    }));

    setShowBulkImport(false);
    setBulkAddresses("");

    toast.success(`Successfully imported ${parsedAddresses.length} addresses!`);
  };

  const getCurrentLocation = (index: number) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setGettingLocation(index);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use Google Geocoding to get address from coordinates
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results, status) => {
            setGettingLocation(null);

            if (status === "OK" && results && results[0]) {
              const address = results[0].formatted_address;
              updateAddress(index, address);
              toast.success(`Current location set as address ${index + 1}`);
            } else {
              toast.error("Could not get address from current location");
            }
          });
        } catch (error) {
          setGettingLocation(null);
          toast.error("Failed to get current location");
        }
      },
      (error) => {
        setGettingLocation(null);
        let errorMessage = "Failed to get current location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Helper function to transform Google Maps data to our RouteDetails format
  const transformGoogleMapsToRouteDetails = (
    result: google.maps.DirectionsResult,
    selectedIndex: number = 0
  ) => {
    const alternatives = result.routes.map((route, index) => {
      const leg = route.legs[0];
      const distanceInMiles = (leg.distance?.value || 0) / 1609.34;
      const durationInMinutes = (leg.duration?.value || 0) / 60;

      // Generate route summary from highway names
      const summary =
        route.summary ||
        route.legs[0]?.steps
          ?.slice(0, 3)
          .map((step) =>
            step.instructions
              ?.replace(/<[^>]*>/g, "")
              .split(" ")
              .slice(0, 2)
              .join(" ")
          )
          .filter(Boolean)
          .join(" and ") ||
        "Direct route";

      // Determine traffic condition
      let trafficCondition = "";
      if (index === 0) {
        trafficCondition = "Best route now due to traffic conditions";
      } else if (durationInMinutes < 60) {
        trafficCondition = "Alternative route";
      } else {
        trafficCondition = "Longer route";
      }

      // Transform legs
      const legs = route.legs.map((leg) => ({
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        startLocation: [leg.start_location.lng(), leg.start_location.lat()] as [
          number,
          number
        ],
        endLocation: [leg.end_location.lng(), leg.end_location.lat()] as [
          number,
          number
        ],
        distance: leg.distance?.value || 0,
        duration: leg.duration?.value || 0,
        steps: leg.steps.map((step) => ({
          instruction: step.instructions?.replace(/<[^>]*>/g, "") || "",
          distance: step.distance?.value || 0,
          duration: step.duration?.value || 0,
          startLocation: [
            step.start_location.lng(),
            step.start_location.lat(),
          ] as [number, number],
          endLocation: [step.end_location.lng(), step.end_location.lat()] as [
            number,
            number
          ],
          maneuver: step.maneuver,
          polyline: step.polyline?.points || "",
        })),
      }));

      return {
        summary,
        distance: distanceInMiles,
        duration: durationInMinutes,
        trafficCondition,
        legs,
        overviewPolyline: route.overview_polyline || "",
        warnings: route.warnings || [],
        waypointOrder: route.waypoint_order || [],
      };
    });

    return {
      selectedAlternativeIndex: selectedIndex,
      alternatives,
      bounds: result.routes[0]?.bounds
        ? {
            northeast: [
              result.routes[0].bounds.getNorthEast().lng(),
              result.routes[0].bounds.getNorthEast().lat(),
            ] as [number, number],
            southwest: [
              result.routes[0].bounds.getSouthWest().lng(),
              result.routes[0].bounds.getSouthWest().lat(),
            ] as [number, number],
          }
        : undefined,
      copyrights: result.routes[0]?.copyrights || "",
      calculatedAt: new Date().toISOString(),
    };
  };

  const calculateRoute = async () => {
    if (!isLoaded) {
      toast.error("Google Maps is not loaded yet");
      return null;
    }

    if (currentRoute.addresses.length < 2) {
      toast.error("Please enter at least 2 addresses for a route");
      return null;
    }

    setCalculatingRoute(true);

    try {
      const directionsService = new google.maps.DirectionsService();

      // Filter out empty addresses
      const validAddresses = currentRoute.addresses.filter(
        (address) => address.trim() !== ""
      );

      console.log("All addresses:", currentRoute.addresses);
      console.log("Valid addresses:", validAddresses);
      console.log("Address count:", validAddresses.length);

      if (validAddresses.length < 2) {
        toast.error("Please enter at least 2 valid addresses");
        return null;
      }

      const waypoints =
        validAddresses.length > 2
          ? validAddresses.slice(1, -1).map((address) => ({
              location: address,
              stopover: true,
            }))
          : undefined;

      console.log("Origin:", validAddresses[0]);
      console.log("Destination:", validAddresses[validAddresses.length - 1]);
      console.log("Waypoints:", waypoints);

      const request: google.maps.DirectionsRequest = {
        origin: validAddresses[0],
        destination: validAddresses[validAddresses.length - 1],
        waypoints: waypoints,
        travelMode: currentRoute.transportationMode,
        avoidFerries: currentRoute.optimization.avoidFerries,
        avoidHighways: currentRoute.optimization.avoidHighways,
        avoidTolls: currentRoute.optimization.avoidTolls,
        provideRouteAlternatives: true, // Get multiple route options
        optimizeWaypoints: false, // Don't optimize waypoint order - keep user's order
      };

      console.log("Google Maps request:", request);

      const result = await directionsService.route(request);

      console.log("Google Maps result:", result);
      console.log("Number of routes:", result.routes?.length);
      console.log("First route legs:", result.routes?.[0]?.legs?.length);

      if (result.routes && result.routes.length > 0) {
        // Process multiple route alternatives
        const alternatives = result.routes.map((route, index) => {
          console.log(`Route ${index} legs:`, route.legs.length);
          console.log(
            `Route ${index} total distance:`,
            route.legs.reduce(
              (total, leg) => total + (leg.distance?.value || 0),
              0
            )
          );
          console.log(
            `Route ${index} total duration:`,
            route.legs.reduce(
              (total, leg) => total + (leg.duration?.value || 0),
              0
            )
          );

          // Calculate total distance and duration across all legs
          const totalDistanceInMeters = route.legs.reduce(
            (total, leg) => total + (leg.distance?.value || 0),
            0
          );
          const totalDurationInSeconds = route.legs.reduce(
            (total, leg) => total + (leg.duration?.value || 0),
            0
          );
          const distanceInMiles = totalDistanceInMeters / 1609.34;
          const durationInMinutes = totalDurationInSeconds / 60;

          // Generate route summary from highway names
          const summary =
            route.summary ||
            route.legs[0]?.steps
              ?.slice(0, 3)
              .map((step) =>
                step.instructions
                  ?.replace(/<[^>]*>/g, "")
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")
              )
              .filter(Boolean)
              .join(" and ") ||
            "Direct route";

          // Determine traffic condition
          let trafficCondition = "";
          if (index === 0) {
            trafficCondition = "Best route now due to traffic conditions";
          } else if (durationInMinutes < 60) {
            trafficCondition = "Alternative route";
          } else {
            trafficCondition = "Longer route";
          }

          return {
            id: `route_${index}`,
            summary: summary,
            distance: distanceInMiles,
            duration: durationInMinutes,
            trafficCondition: trafficCondition,
            legs: route.legs,
          };
        });

        setRouteAlternatives(alternatives);

        // Use the first route as primary
        const primaryRoute = alternatives[0];
        setDirectionsResponse(result);
        setRouteDetails({
          distance: primaryRoute.distance,
          duration: primaryRoute.duration,
        });

        console.log("Primary route details:", {
          distance: primaryRoute.distance,
          duration: primaryRoute.duration,
          legs: result.routes[0].legs.length,
        });

        // Transform the full route details for storage
        const routeDetails = transformGoogleMapsToRouteDetails(result, 0);

        return {
          distance: primaryRoute.distance,
          duration: primaryRoute.duration,
          startCoordinates: [
            primaryRoute.legs[0].start_location.lng(),
            primaryRoute.legs[0].start_location.lat(),
          ] as [number, number],
          endCoordinates: [
            primaryRoute.legs[0].end_location.lng(),
            primaryRoute.legs[0].end_location.lat(),
          ] as [number, number],
          routeDetails, // Return the full route details
        };
      }

      return null;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not calculate route"
      );
      return null;
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleCreateRoute = async () => {
    console.log("Creating route with data:", currentRoute);

    if (!currentRoute.name || currentRoute.addresses.length < 2) {
      toast.error("Please fill in route name and at least 2 addresses");
      return;
    }

    // Test backend connection first
    try {
      console.log("Testing backend connection...");
      const testResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
        }/routes/my?page=1&limit=1`
      );
      console.log("Backend test response:", testResponse.status);
    } catch (error) {
      console.error("Backend connection test failed:", error);
      toast.error(
        "Backend server is not running or not accessible. Please start the backend server on port 4000."
      );
      return;
    }

    // First calculate route using Google Maps API (frontend)
    const calculatedData = await calculateRoute();
    if (!calculatedData) {
      toast.error("Failed to calculate route");
      return;
    }

    console.log("Calculated route data:", calculatedData);

    try {
      // Create stops array from addresses
      const validAddresses = currentRoute.addresses.filter(
        (address) => address.trim() !== ""
      );
      const stops = validAddresses.map((address, index) => ({
        address: address, // Store the actual address
        order: index + 1,
        estimatedDuration: 15, // Default 15 minutes per stop
        notes: address,
        status: "PENDING" as const,
      }));

      const routeData = {
        name: currentRoute.name,
        description: currentRoute.description || undefined,
        date: new Date().toISOString(),
        priority: "MEDIUM" as const,
        startLocation: {
          address: validAddresses[0],
          coordinates: calculatedData.startCoordinates,
        },
        endLocation:
          validAddresses.length > 1
            ? {
                address: validAddresses[validAddresses.length - 1],
                coordinates: calculatedData.endCoordinates,
              }
            : undefined,
        stops: stops,
        totalDistance: calculatedData.distance, // Real distance from Google Maps
        totalDuration: calculatedData.duration, // Real duration from Google Maps
        optimizationSettings: {
          optimizationType: currentRoute.optimization.fastestRoute
            ? ("FASTEST" as const)
            : ("BALANCED" as const),
          avoidFerries: currentRoute.optimization.avoidFerries,
          avoidHighways: currentRoute.optimization.avoidHighways,
          avoidTolls: currentRoute.optimization.avoidTolls,
        },
        // Send route analytics with real data
        analytics: {
          totalStops: stops.length,
          completedStops: 0,
          skippedStops: 0,
          totalDistance: calculatedData.distance,
          estimatedDuration: calculatedData.duration,
          efficiency: 0, // Will be calculated during route execution
          completionRate: 0,
        },
        // Send full route details with all alternatives and turn-by-turn directions
        routeDetails: calculatedData.routeDetails,
      };

      console.log("Sending route data to backend:", routeData);

      // Then save to backend with calculated data
      const result = await createRouteMutation.mutateAsync(routeData);

      console.log("Route created successfully:", result);

      toast.success(
        `Route "${
          currentRoute.name
        }" created successfully! Distance: ${calculatedData.distance.toFixed(
          1
        )} miles, Duration: ${Math.round(calculatedData.duration)} minutes`
      );

      // Reset form
      setCurrentRoute({
        name: "",
        description: "",
        addresses: [],
        transportationMode: google.maps.TravelMode.DRIVING,
        optimization: {
          fastestRoute: true,
          avoidFerries: false,
          avoidHighways: false,
          avoidTolls: false,
        },
      });
      setDirectionsResponse(null);
      setRouteDetails(null);
      setRouteAlternatives(null);
    } catch (error) {
      console.error("Error creating route:", error);
      toast.error(
        `Error creating route: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    // For now, we'll just delete without confirmation
    // In a real app, you'd want a proper confirmation dialog

    try {
      await deleteRouteMutation.mutateAsync(routeId);
      toast.success("Route deleted successfully");
    } catch (error) {
      toast.error("Failed to delete route");
    }
  };

  const recalculateRoute = async (route: any) => {
    if (!isLoaded) {
      toast.error("Google Maps is not loaded yet");
      return;
    }

    setRecalculatingRouteId(route._id);

    try {
      const directionsService = new google.maps.DirectionsService();

      // Reconstruct addresses from route data
      const addresses = [];
      if (route.startLocation?.address)
        addresses.push(route.startLocation.address);
      if (route.stops?.length > 0) {
        addresses.push(
          ...route.stops.map((stop: any) => stop.address || stop.notes || "")
        );
      }
      if (
        route.endLocation?.address &&
        route.endLocation.address !== route.startLocation?.address
      ) {
        addresses.push(route.endLocation.address);
      }

      console.log("Recalculating route with addresses:", addresses);

      if (addresses.length < 2) {
        toast.error("Not enough addresses to calculate route");
        return;
      }

      const waypoints =
        addresses.length > 2
          ? addresses
              .slice(1, -1)
              .map((address: string) => ({ location: address, stopover: true }))
          : undefined;

      const result = await directionsService.route({
        origin: addresses[0],
        destination: addresses[addresses.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidFerries: route.optimizationSettings?.avoidFerries || false,
        avoidHighways: route.optimizationSettings?.avoidHighways || false,
        avoidTolls: route.optimizationSettings?.avoidTolls || false,
        provideRouteAlternatives: true,
        optimizeWaypoints: false, // Keep user's order
      });

      if (result.routes && result.routes.length > 0) {
        const leg = result.routes[0].legs[0];
        const distanceInMiles = (leg.distance?.value || 0) / 1609.34;
        const durationInMinutes = (leg.duration?.value || 0) / 60;

        // Transform Google Maps response to our RouteDetails format
        const updatedRouteDetails = transformGoogleMapsToRouteDetails(
          result,
          0
        );

        // Process route alternatives for display
        const alternatives = result.routes.map((r, index) => {
          const rLeg = r.legs[0];
          const rDistance = (rLeg.distance?.value || 0) / 1609.34;
          const rDuration = (rLeg.duration?.value || 0) / 60;

          return {
            id: `alt-${index}`,
            summary: r.summary || `Route ${index + 1}`,
            distance: rDistance,
            duration: rDuration,
            trafficCondition: index === 0 ? "Recommended" : "Alternative",
            legs: r.legs,
          };
        });

        // Display the route on the map
        setDirectionsResponse(result);

        // Update route alternatives for display
        setRouteAlternatives(alternatives);

        // Update route details display
        setRouteDetails({
          distance: distanceInMiles,
          duration: durationInMinutes,
        });

        // Scroll to map view
        setTimeout(() => {
          const mapElement = document.querySelector('[data-map-view="true"]');
          if (mapElement) {
            mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        toast.success(
          `✓ Real-time route loaded: ${distanceInMiles.toFixed(
            1
          )} mi | ${Math.round(durationInMinutes)} min | ${
            result.routes.length
          } alternative(s) found`,
          { duration: 4000 }
        );

        console.log("Route recalculated with details:", {
          distance: distanceInMiles,
          duration: durationInMinutes,
          alternatives: alternatives.length,
          routeDetails: updatedRouteDetails,
        });
      }
    } catch (error) {
      console.error("Recalculate route error:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not get real-time data"
      );
    } finally {
      setRecalculatingRouteId(null);
    }
  };

  const toggleRouteDetails = (routeId: string) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  const calculateRouteDirectly = async (addresses: string[], route: any) => {
    if (!isLoaded) {
      toast.error("Google Maps is not loaded yet");
      return;
    }

    setDisplayingRouteId(route._id);

    try {
      const directionsService = new google.maps.DirectionsService();

      console.log("Calculating route directly with addresses:", addresses);

      const waypoints =
        addresses.length > 2
          ? addresses
              .slice(1, -1)
              .map((address: string) => ({ location: address, stopover: true }))
          : undefined;

      const result = await directionsService.route({
        origin: addresses[0],
        destination: addresses[addresses.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidFerries: route.optimizationSettings?.avoidFerries || false,
        avoidHighways: route.optimizationSettings?.avoidHighways || false,
        avoidTolls: route.optimizationSettings?.avoidTolls || false,
        provideRouteAlternatives: true,
        optimizeWaypoints: false, // Keep user's order
      });

      if (result.routes && result.routes.length > 0) {
        // Process multiple route alternatives
        const alternatives = result.routes.map((route, index) => {
          // Calculate total distance and duration across all legs
          const totalDistanceInMeters = route.legs.reduce(
            (total, leg) => total + (leg.distance?.value || 0),
            0
          );
          const totalDurationInSeconds = route.legs.reduce(
            (total, leg) => total + (leg.duration?.value || 0),
            0
          );
          const distanceInMiles = totalDistanceInMeters / 1609.34;
          const durationInMinutes = totalDurationInSeconds / 60;

          // Generate route summary from highway names
          const summary =
            route.summary ||
            route.legs[0]?.steps
              ?.slice(0, 3)
              .map((step) =>
                step.instructions
                  ?.replace(/<[^>]*>/g, "")
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")
              )
              .filter(Boolean)
              .join(" and ") ||
            "Direct route";

          // Determine traffic condition
          let trafficCondition = "";
          if (index === 0) {
            trafficCondition = "Best route now due to traffic conditions";
          } else if (durationInMinutes < 60) {
            trafficCondition = "Alternative route";
          } else {
            trafficCondition = "Longer route";
          }

          return {
            id: `route_${index}`,
            summary: summary,
            distance: distanceInMiles,
            duration: durationInMinutes,
            trafficCondition: trafficCondition,
            legs: route.legs,
          };
        });

        setRouteAlternatives(alternatives);

        // Use the first route as primary
        const primaryRoute = alternatives[0];
        setDirectionsResponse(result);
        setRouteDetails({
          distance: primaryRoute.distance,
          duration: primaryRoute.duration,
        });

        console.log("Route displayed successfully:", route.name);
      }
    } catch (error) {
      console.error("Error calculating route directly:", error);
      toast.error("Failed to display route");
    } finally {
      setDisplayingRouteId(null);
    }
  };

  const displayRouteOnMap = (route: any) => {
    console.log("Displaying route:", route.name);
    console.log("Route data:", route);
    console.log("Route details:", route.routeDetails);

    // Reconstruct addresses from route data (same as handleEditRoute)
    const addresses = [];
    if (route.startLocation?.address)
      addresses.push(route.startLocation.address);
    if (route.stops?.length > 0) {
      // Only add stops that are not the same as start or end location
      const stopAddresses = route.stops
        .map((stop: any) => stop.address || stop.notes || "")
        .filter(
          (address: string) =>
            address &&
            address !== route.startLocation?.address &&
            address !== route.endLocation?.address
        );
      addresses.push(...stopAddresses);
    }
    if (
      route.endLocation?.address &&
      route.endLocation.address !== route.startLocation?.address
    ) {
      addresses.push(route.endLocation.address);
    }

    console.log("Reconstructed addresses:", addresses);

    // Temporarily populate the form with route data
    const originalRoute = { ...currentRoute };
    setCurrentRoute({
      name: route.name,
      description: route.description || "",
      addresses: addresses,
      transportationMode: google.maps.TravelMode.DRIVING,
      optimization: {
        fastestRoute:
          route.optimizationSettings?.optimizationType === "FASTEST",
        avoidFerries: route.optimizationSettings?.avoidFerries || false,
        avoidHighways: route.optimizationSettings?.avoidHighways || false,
        avoidTolls: route.optimizationSettings?.avoidTolls || false,
      },
    });

    // Calculate route directly with the addresses (similar to recalculateRoute)
    if (addresses.length >= 2) {
      calculateRouteDirectly(addresses, route);
    } else {
      toast.error("Not enough addresses to display route");
    }
  };

  const handleEditRoute = (route: any) => {
    console.log("Editing route:", route);

    // Populate the form with the route data
    const addresses = [];
    if (route.startLocation?.address)
      addresses.push(route.startLocation.address);
    if (route.stops?.length > 0) {
      addresses.push(
        ...route.stops.map(
          (stop: any) =>
            stop.address || stop.notes || stop.propertyId?.address || ""
        )
      );
    }
    if (
      route.endLocation?.address &&
      route.endLocation.address !== route.startLocation?.address
    ) {
      addresses.push(route.endLocation.address);
    }

    setCurrentRoute({
      name: route.name,
      description: route.description || "",
      addresses: addresses,
      transportationMode: google.maps.TravelMode.DRIVING, // Default, could be stored in route data
      optimization: {
        fastestRoute:
          route.optimizationSettings?.optimizationType === "FASTEST",
        avoidFerries: route.optimizationSettings?.avoidFerries || false,
        avoidHighways: route.optimizationSettings?.avoidHighways || false,
        avoidTolls: route.optimizationSettings?.avoidTolls || false,
      },
    });

    setEditingRoute(route);

    // Display the route on the map if routeDetails exist
    if (
      route.routeDetails &&
      route.routeDetails.alternatives &&
      route.routeDetails.alternatives.length > 0
    ) {
      displayRouteOnMap(route);
    }

    // Scroll to the form
    document
      .getElementById("create-route-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute) return;

    console.log("Updating route:", editingRoute._id);

    if (!currentRoute.name || currentRoute.addresses.length < 2) {
      toast.error("Please fill in route name and at least 2 addresses");
      return;
    }

    // Test backend connection first
    try {
      console.log("Testing backend connection...");
      const testResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
        }/routes/my?page=1&limit=1`
      );
      console.log("Backend test response:", testResponse.status);
    } catch (error) {
      console.error("Backend connection test failed:", error);
      toast.error(
        "Backend server is not running or not accessible. Please start the backend server on port 4000."
      );
      return;
    }

    // First calculate route using Google Maps API (frontend)
    const calculatedData = await calculateRoute();
    if (!calculatedData) {
      toast.error("Failed to calculate route");
      return;
    }

    console.log("Calculated route data:", calculatedData);

    try {
      // Create stops array from addresses
      const validAddresses = currentRoute.addresses.filter(
        (address) => address.trim() !== ""
      );
      const stops = validAddresses.map((address, index) => ({
        address: address, // Store the actual address
        order: index + 1,
        estimatedDuration: 15, // Default 15 minutes per stop
        notes: address,
        status: "PENDING" as const,
      }));

      const routeData = {
        name: currentRoute.name,
        description: currentRoute.description || undefined,
        date: new Date().toISOString(),
        priority: "MEDIUM" as const,
        startLocation: {
          address: validAddresses[0],
          coordinates: calculatedData.startCoordinates,
        },
        endLocation:
          validAddresses.length > 1
            ? {
                address: validAddresses[validAddresses.length - 1],
                coordinates: calculatedData.endCoordinates,
              }
            : undefined,
        stops: stops,
        totalDistance: calculatedData.distance,
        totalDuration: calculatedData.duration,
        optimizationSettings: {
          optimizationType: currentRoute.optimization.fastestRoute
            ? ("FASTEST" as const)
            : ("BALANCED" as const),
          avoidFerries: currentRoute.optimization.avoidFerries,
          avoidHighways: currentRoute.optimization.avoidHighways,
          avoidTolls: currentRoute.optimization.avoidTolls,
        },
        analytics: {
          totalStops: stops.length,
          completedStops: 0,
          skippedStops: 0,
          totalDistance: calculatedData.distance,
          estimatedDuration: calculatedData.duration,
          efficiency: 0,
          completionRate: 0,
        },
        // Send full route details with all alternatives and turn-by-turn directions
        routeDetails: calculatedData.routeDetails,
      };

      console.log("Sending updated route data to backend:", routeData);

      // Update the route using the update API
      const result = await updateRouteMutation.mutateAsync({
        id: editingRoute._id,
        data: routeData,
      });

      console.log("Route updated successfully:", result);

      toast.success(
        `Route "${
          currentRoute.name
        }" updated successfully! Distance: ${calculatedData.distance.toFixed(
          1
        )} miles, Duration: ${Math.round(calculatedData.duration)} minutes`
      );

      // Reset form and editing state
      setCurrentRoute({
        name: "",
        description: "",
        addresses: [],
        transportationMode: google.maps.TravelMode.DRIVING,
        optimization: {
          fastestRoute: true,
          avoidFerries: false,
          avoidHighways: false,
          avoidTolls: false,
        },
      });
      setDirectionsResponse(null);
      setRouteDetails(null);
      setRouteAlternatives(null);
      setEditingRoute(null);
    } catch (error) {
      console.error("Error updating route:", error);
      toast.error(
        `Error updating route: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#42A5F5] mx-auto mb-4" />
              <p className="text-gray-600">Loading routes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Error Loading Routes
              </h3>
              <p className="text-red-600 mb-4">
                {error.message || "Failed to load routes. Please try again."}
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const routes = data?.routes || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600 mt-1">
              Plan and manage your survey routes for efficient zone coverage
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Agent: {user?.name || "Unknown"}
          </div>
        </div>

        {/* Map View */}
        {directionsResponse && isLoaded && (
          <Card data-map-view="true">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Route Map View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={
                    directionsResponse?.routes?.[0]?.bounds?.getCenter() || {
                      lat: 43.6532,
                      lng: -79.3832,
                    }
                  }
                  zoom={directionsResponse?.routes?.[0]?.bounds ? 12 : 10}
                  options={{
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                  }}
                >
                  <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                      suppressMarkers: false,
                      polylineOptions: {
                        strokeColor: "#4285F4",
                        strokeWeight: 6,
                        strokeOpacity: 0.8,
                      },
                      markerOptions: {
                        icon: {
                          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        },
                      },
                    }}
                  />
                </GoogleMap>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create/Edit Route Form */}
          <Card id="create-route-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                {editingRoute
                  ? `Edit Route: ${editingRoute.name}`
                  : "Create New Route"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Route Name */}
              <div className="space-y-2">
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  placeholder="Enter route name..."
                  value={currentRoute.name}
                  onChange={(e) =>
                    setCurrentRoute((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  disabled={createRouteMutation.isPending}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Enter description..."
                  value={currentRoute.description}
                  onChange={(e) =>
                    setCurrentRoute((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={createRouteMutation.isPending}
                />
              </div>

              {/* Address List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Route Addresses
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkImport(!showBulkImport)}
                      disabled={createRouteMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg">📋</span>
                      Bulk Import
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAddress}
                      disabled={createRouteMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg">+</span>
                      Add Address
                    </Button>
                    {currentRoute.addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentRoute((prev) => ({
                            ...prev,
                            addresses: [],
                          }));
                          toast.success("All addresses cleared");
                        }}
                        disabled={createRouteMutation.isPending}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bulk Import Section */}
                {showBulkImport && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                          Paste multiple addresses (one per line):
                        </span>
                      </div>
                      <textarea
                        value={bulkAddresses}
                        onChange={(e) => setBulkAddresses(e.target.value)}
                        placeholder={`1711 Carolyn Rd, Mississauga, ON
5471 Shorecrest Cres, Mississauga, ON
5465 Shorecrest Cres, Mississauga, ON
4338 Spinningdale Crt, Mississauga, ON
5043 Durie Rd, Mississauga, ON
5192 Durie Rd, Mississauga, ON
1446 Tillingham Gdns N, Mississauga, ON
6052 St. Ives Way, Mississauga, ON
4881 Creditview Rd, Mississauga, ON`}
                        className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={createRouteMutation.isPending}
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-blue-700">
                          💡 Tip: You can paste addresses with website names
                          (Redfin, Zillow, etc.) - they'll be automatically
                          filtered out
                          {bulkAddresses.trim() && (
                            <span className="block mt-1 font-medium">
                              📊 {parseBulkAddresses(bulkAddresses).length}{" "}
                              valid addresses found
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowBulkImport(false);
                              setBulkAddresses("");
                            }}
                            disabled={createRouteMutation.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleBulkImport}
                            disabled={
                              createRouteMutation.isPending ||
                              !bulkAddresses.trim()
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Import {parseBulkAddresses(bulkAddresses).length}{" "}
                            Addresses
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  {currentRoute.addresses.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No addresses added yet</p>
                      <p className="text-xs">
                        Add at least 2 addresses to create a route
                      </p>
                    </div>
                  )}

                  {currentRoute.addresses.map((address, index) => (
                    <div key={index} className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                            index === 0
                              ? "bg-green-500 text-white"
                              : index === currentRoute.addresses.length - 1
                              ? "bg-red-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {index === 0
                            ? "S"
                            : index === currentRoute.addresses.length - 1
                            ? "E"
                            : index}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isLoaded ? (
                            <Autocomplete
                              onLoad={(autocomplete) => {
                                // Store autocomplete reference if needed
                              }}
                              onPlaceChanged={() => {
                                // Handle place change if needed
                              }}
                              options={{
                                types: ["address"],
                                componentRestrictions: { country: "ca" },
                              }}
                            >
                              <Input
                                placeholder={`${
                                  index === 0
                                    ? "Starting"
                                    : index ===
                                      currentRoute.addresses.length - 1
                                    ? "Ending"
                                    : "Stop"
                                } address`}
                                value={address}
                                onChange={(e) =>
                                  updateAddress(index, e.target.value)
                                }
                                className="w-full"
                                disabled={createRouteMutation.isPending}
                              />
                            </Autocomplete>
                          ) : (
                            <Input
                              placeholder={`${
                                index === 0
                                  ? "Starting"
                                  : index === currentRoute.addresses.length - 1
                                  ? "Ending"
                                  : "Stop"
                              } address`}
                              value={address}
                              onChange={(e) =>
                                updateAddress(index, e.target.value)
                              }
                              className="w-full"
                              disabled={createRouteMutation.isPending}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => getCurrentLocation(index)}
                          disabled={
                            gettingLocation === index ||
                            createRouteMutation.isPending
                          }
                          className="px-2"
                          title="Use current location"
                        >
                          {gettingLocation === index ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Locate className="w-4 h-4" />
                          )}
                        </Button>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveAddress(index, index - 1)}
                            disabled={createRouteMutation.isPending}
                            className="p-1 h-8 w-8"
                            title="Move up"
                          >
                            ↑
                          </Button>
                        )}
                        {index < currentRoute.addresses.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveAddress(index, index + 1)}
                            disabled={createRouteMutation.isPending}
                            className="p-1 h-8 w-8"
                            title="Move down"
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddress(index)}
                          disabled={createRouteMutation.isPending}
                          className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transportation Mode Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Transportation Mode
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { mode: "DRIVING", label: "Car", icon: "🚗" },
                    { mode: "WALKING", label: "Walking", icon: "🚶" },
                    { mode: "BICYCLING", label: "Biking", icon: "🚴" },
                    { mode: "TRANSIT", label: "Transit", icon: "🚌" },
                  ].map(({ mode, label, icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setCurrentRoute((prev) => ({
                          ...prev,
                          transportationMode: mode as google.maps.TravelMode,
                        }))
                      }
                      disabled={createRouteMutation.isPending}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentRoute.transportationMode === mode
                          ? "border-[#42A5F5] bg-blue-50 text-[#42A5F5]"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-sm font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optimization Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Optimization Options
                </Label>
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Fastest Route</span>
                      {currentRoute.optimization.fastestRoute && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={currentRoute.optimization.fastestRoute}
                      onCheckedChange={() =>
                        handleOptimizationChange("fastestRoute")
                      }
                      disabled={createRouteMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Avoid Ferries</span>
                      {currentRoute.optimization.avoidFerries && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={currentRoute.optimization.avoidFerries}
                      onCheckedChange={() =>
                        handleOptimizationChange("avoidFerries")
                      }
                      disabled={createRouteMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Avoid Highways
                      </span>
                      {currentRoute.optimization.avoidHighways && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={currentRoute.optimization.avoidHighways}
                      onCheckedChange={() =>
                        handleOptimizationChange("avoidHighways")
                      }
                      disabled={createRouteMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Avoid Tolls</span>
                      {currentRoute.optimization.avoidTolls && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={currentRoute.optimization.avoidTolls}
                      onCheckedChange={() =>
                        handleOptimizationChange("avoidTolls")
                      }
                      disabled={createRouteMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Route Alternatives */}
              {routeAlternatives && routeAlternatives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Route Options</h4>
                  </div>

                  {routeAlternatives.map((route, index) => (
                    <div
                      key={route.id}
                      className={`p-4 border rounded-lg transition-all cursor-pointer ${
                        index === 0
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <h5 className="font-medium text-gray-900">
                              {route.summary}
                            </h5>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {route.trafficCondition}
                          </p>

                          <div className="flex gap-4">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.info(`Details for ${route.summary}`);
                                toggleRouteDetails(route.id);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(route.duration / 60)} hr{" "}
                            {Math.round(route.duration % 60)} min
                          </div>
                          <div className="text-sm text-gray-600">
                            {route.distance.toFixed(0)} mi
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Details Section */}
                      {expandedRouteId === route.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">
                                  Route:
                                </span>
                                <p className="text-gray-900">{route.summary}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Condition:
                                </span>
                                <p className="text-gray-900">
                                  {route.trafficCondition}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Distance:
                                </span>
                                <p className="text-gray-900">
                                  {route.distance.toFixed(1)} miles
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Duration:
                                </span>
                                <p className="text-gray-900">
                                  {Math.round(route.duration / 60)} hr{" "}
                                  {Math.round(route.duration % 60)} min
                                </p>
                              </div>
                            </div>

                            {/* Detailed Route Legs */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">
                                Detailed Route Directions:
                              </h5>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                {route.legs.map(
                                  (leg: any, legIndex: number) => {
                                    const legDistance =
                                      leg.distance?.text || "0 m";
                                    const legDuration =
                                      leg.duration?.text || "0 min";
                                    const startAddress =
                                      leg.start_address || "";
                                    const endAddress = leg.end_address || "";

                                    return (
                                      <div
                                        key={legIndex}
                                        className="border-l-2 border-blue-200 pl-4"
                                      >
                                        {/* Leg Header */}
                                        <div className="mb-2">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-blue-700">
                                              {legDuration} ({legDistance})
                                            </span>
                                          </div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {endAddress}
                                          </p>
                                        </div>

                                        {/* Leg Steps */}
                                        <div className="space-y-2">
                                          {leg.steps?.map(
                                            (step: any, stepIndex: number) => {
                                              const instruction =
                                                step.instructions?.replace(
                                                  /<[^>]*>/g,
                                                  ""
                                                ) || "Continue";
                                              const distance =
                                                step.distance?.text || "";
                                              const duration =
                                                step.duration?.text || "";

                                              return (
                                                <div
                                                  key={stepIndex}
                                                  className="flex items-start gap-2 text-sm"
                                                >
                                                  <span className="text-gray-500 font-medium min-w-[20px]">
                                                    {stepIndex + 1}.
                                                  </span>
                                                  <div className="flex-1">
                                                    <p className="text-gray-900">
                                                      {instruction}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                      {distance} • {duration}
                                                    </p>
                                                  </div>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Route Preview (fallback for single route) */}
              {routeDetails && !routeAlternatives && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Route Preview</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-blue-700 font-medium">
                        Distance:
                      </span>
                      <p className="text-blue-900">
                        {routeDetails.distance.toFixed(1)} miles
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Duration:
                      </span>
                      <p className="text-blue-900">
                        {Math.round(routeDetails.duration)} minutes
                      </p>
                    </div>
                  </div>
                  {currentRoute.addresses.filter((a) => a.trim() !== "")
                    .length > 2 && (
                    <div className="text-sm">
                      <span className="text-blue-700 font-medium">
                        Stops:{" "}
                        {
                          currentRoute.addresses.filter((a) => a.trim() !== "")
                            .length
                        }
                      </span>
                      <p className="text-blue-900 text-xs mt-1">
                        {currentRoute.addresses.filter((a) => a.trim() !== "")
                          .length > 0
                          ? `${
                              currentRoute.addresses.filter(
                                (a) => a.trim() !== ""
                              )[0]
                            } → ${
                              currentRoute.addresses.filter(
                                (a) => a.trim() !== ""
                              ).length - 2
                            } stops → ${
                              currentRoute.addresses.filter(
                                (a) => a.trim() !== ""
                              )[
                                currentRoute.addresses.filter(
                                  (a) => a.trim() !== ""
                                ).length - 1
                              ]
                            }`
                          : "No addresses set"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={calculateRoute}
                  className="flex-1"
                  disabled={
                    calculatingRoute ||
                    createRouteMutation.isPending ||
                    updateRouteMutation.isPending
                  }
                >
                  {calculatingRoute ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Preview Route
                    </>
                  )}
                </Button>
                <Button
                  onClick={editingRoute ? handleUpdateRoute : handleCreateRoute}
                  className="flex-1 bg-[#42A5F5] hover:bg-[#3b94e4] text-white font-medium"
                  disabled={
                    createRouteMutation.isPending ||
                    updateRouteMutation.isPending ||
                    calculatingRoute
                  }
                >
                  {createRouteMutation.isPending ||
                  updateRouteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingRoute ? "Updating..." : "Saving..."}
                    </>
                  ) : editingRoute ? (
                    "Update Route"
                  ) : (
                    "Create & Save Route"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentRoute({
                      name: "",
                      description: "",
                      addresses: [],
                      transportationMode: google.maps.TravelMode.DRIVING,
                      optimization: {
                        fastestRoute: true,
                        avoidFerries: false,
                        avoidHighways: false,
                        avoidTolls: false,
                      },
                    });
                    setDirectionsResponse(null);
                    setRouteDetails(null);
                    setRouteAlternatives(null);
                    setEditingRoute(null);
                  }}
                  className="px-6"
                  disabled={
                    createRouteMutation.isPending ||
                    updateRouteMutation.isPending ||
                    calculatingRoute
                  }
                >
                  {editingRoute ? "Cancel Edit" : "Clear"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Routes List */}
          <Card>
            <CardHeader>
              <CardTitle>My Routes ({routes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Route className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No routes created yet</p>
                  <p className="text-sm">
                    Create your first route to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {routes.map((route) => (
                    <div
                      key={route._id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {route.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                route.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-800"
                                  : route.status === "PLANNED"
                                  ? "bg-blue-100 text-blue-800"
                                  : route.status === "IN_PROGRESS"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : route.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {route.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(route.date).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          {route.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {route.description}
                            </p>
                          )}
                          <div className="mt-2 space-y-1">
                            {route.startLocation?.address && (
                              <p className="text-sm">
                                <span className="font-medium">From:</span>{" "}
                                {route.startLocation.address}
                              </p>
                            )}
                            {route.endLocation?.address && (
                              <p className="text-sm">
                                <span className="font-medium">To:</span>{" "}
                                {route.endLocation.address}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <span>Priority: {route.priority}</span>
                            <span>•</span>
                            <span>
                              Stops:{" "}
                              {route.analytics?.totalStops ||
                                route.stops.length}
                            </span>
                            {(route.analytics?.totalStops ||
                              route.stops.length) > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                Multi-stop
                              </span>
                            )}
                            {route.totalDistance > 0 && (
                              <>
                                <span>•</span>
                                <span>{route.totalDistance.toFixed(1)} mi</span>
                              </>
                            )}
                            {route.totalDuration > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {Math.round(route.totalDuration)} min
                                </span>
                              </>
                            )}
                          </div>
                          {route.analytics &&
                            route.analytics.totalDistance > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Distance:
                                    </span>{" "}
                                    <span className="text-gray-900">
                                      {route.analytics.totalDistance.toFixed(1)}{" "}
                                      mi
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Duration:
                                    </span>{" "}
                                    <span className="text-gray-900">
                                      {Math.round(
                                        route.analytics.estimatedDuration
                                      )}{" "}
                                      min
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          {route.optimizationSettings && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {route.optimizationSettings.optimizationType ===
                                "FASTEST" && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Fastest Route
                                </span>
                              )}
                              {route.optimizationSettings.avoidFerries && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  Avoid Ferries
                                </span>
                              )}
                              {route.optimizationSettings.avoidHighways && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  Avoid Highways
                                </span>
                              )}
                              {route.optimizationSettings.avoidTolls && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                  Avoid Tolls
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Just display the route without editing
                              if (
                                route.routeDetails &&
                                route.routeDetails.alternatives &&
                                route.routeDetails.alternatives.length > 0
                              ) {
                                displayRouteOnMap(route);
                                // Scroll to map view
                                setTimeout(() => {
                                  const mapElement = document.querySelector(
                                    '[data-map-view="true"]'
                                  );
                                  if (mapElement) {
                                    mapElement.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                  }
                                }, 100);
                              } else {
                                toast.info(
                                  "No route details available for this route"
                                );
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="View route on map"
                            disabled={displayingRouteId === route._id}
                          >
                            {displayingRouteId === route._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoute(route)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Edit route"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => recalculateRoute(route)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            disabled={recalculatingRouteId === route._id}
                            title="Get real-time route data"
                          >
                            {recalculatingRouteId === route._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Navigation className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoute(route._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteRouteMutation.isPending}
                          >
                            {deleteRouteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
