"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  MapPin,
  Home,
  Users,
  Phone,
  Calendar,
  Filter,
  ArrowLeft,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  Map as MapIcon,
  Layers,
  Satellite,
  Gauge,
  Download,
  X,
  Edit,
  Info,
} from "lucide-react";
import { apiInstance } from "@/lib/apiInstance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PropertyDetailModal } from "./property-detail-modal";
import { useQueryClient } from "@tanstack/react-query";

interface TerritoryMapViewProps {
  territoryId: string;
}

interface Property {
  _id: string;
  address: string;
  houseNumber: number;
  coordinates: [number, number];
  status:
    | "not-visited"
    | "interested"
    | "visited"
    | "callback"
    | "appointment"
    | "follow-up"
    | "not-interested";
  lastVisited?: string;
  notes?: string;
  dataSource?: "AUTO" | "MANUAL";
  lastUpdatedBy?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
  residents?: {
    name: string;
    phone?: string;
    email?: string;
  }[];
}

interface Territory {
  _id: string;
  name: string;
  description?: string;
  boundary: any;
  totalResidents: number;
  activeResidents: number;
  status: string;
  assignedTo?: {
    type: "TEAM" | "INDIVIDUAL";
    name: string;
  };
}

const statusColors = {
  "not-visited": "#EF4444", // red
  interested: "#F59E0B", // amber
  visited: "#10B981", // emerald
  callback: "#8B5CF6", // violet
  appointment: "#3B82F6", // blue
  "follow-up": "#EC4899", // pink
  "not-interested": "#6B7280", // gray
};

export function TerritoryMapView({ territoryId }: TerritoryMapViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    "not-visited": 0,
    interested: 0,
    visited: 0,
    callback: 0,
    appointment: 0,
    "follow-up": 0,
    "not-interested": 0,
  });
  const [stats, setStats] = useState({
    totalHomes: 0,
    visited: 0,
    remaining: 0,
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [detailedProperty, setDetailedProperty] = useState<any>(null);
  const [isLoadingPropertyDetails, setIsLoadingPropertyDetails] =
    useState(false);
  const [isUpdatingResident, setIsUpdatingResident] = useState(false);
  const [editFormData, setEditFormData] = useState({
    address: "",
    houseNumber: "",
    longitude: "",
    latitude: "",
    status: "not-visited" as any,
    lastVisited: "",
    notes: "",
    phone: "",
    email: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerMailingAddress: "",
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingResident, setIsAddingResident] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addFormData, setAddFormData] = useState({
    address: "",
    houseNumber: "",
    longitude: "",
    latitude: "",
    status: "not-visited" as any,
    lastVisited: "",
    notes: "",
    phone: "",
    email: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerMailingAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [dataSourceFilter, setDataSourceFilter] =
    useState<string>("All Sources");
  const [sortBy, setSortBy] = useState<string>("Sequential");
  const [currentPage, setCurrentPage] = useState(1);
  const [mapViewType, setMapViewType] = useState<
    "roadmap" | "satellite" | "hybrid" | "terrain"
  >("hybrid");

  // Validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [coordinatesInsideZone, setCoordinatesInsideZone] = useState(false);
  const [fieldsSynchronized, setFieldsSynchronized] = useState(false);

  // Edit form validation states
  const [isEditValidating, setIsEditValidating] = useState(false);
  const [editValidationErrors, setEditValidationErrors] = useState<string[]>(
    []
  );
  const [editCoordinatesInsideZone, setEditCoordinatesInsideZone] =
    useState(false);
  const [editFieldsSynchronized, setEditFieldsSynchronized] = useState(false);
  const [isEditGettingLocation, setIsEditGettingLocation] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Fetch territory and properties data
  useEffect(() => {
    const fetchTerritoryData = async () => {
      try {
        setLoading(true);

        // Fetch territory map view data (zone details + residents)
        const response = await apiInstance.get(
          `/zones/map-view/${territoryId}`
        );
        if (response.data.success) {
          const {
            zone,
            properties: zoneProperties,
            statusSummary,
            statistics,
          } = response.data.data;

          // Set territory data
          setTerritory(zone);

          // Set properties data
          setProperties(zoneProperties);
          setFilteredProperties(zoneProperties);
        }
      } catch (error) {
        console.error("Error fetching territory map view data:", error);
        toast.error("Failed to load territory data");
      } finally {
        setLoading(false);
      }
    };

    if (territoryId) {
      fetchTerritoryData();
    }
  }, [territoryId]);

  // Filter and sort properties
  useEffect(() => {
    let filtered = properties;

    // Apply status filter
    if (statusFilter && statusFilter !== "All Status") {
      filtered = filtered.filter(
        (property) => property.status === statusFilter
      );
    }

    // Apply data source filter
    if (dataSourceFilter && dataSourceFilter !== "All Sources") {
      filtered = filtered.filter(
        (property) => property.dataSource === dataSourceFilter
      );
    }

    // Apply sorting
    if (sortBy === "Sequential") {
      filtered = filtered.sort((a, b) => a.houseNumber - b.houseNumber);
    } else if (sortBy === "Odd") {
      filtered = filtered
        .filter((property) => property.houseNumber % 2 === 1)
        .sort((a, b) => a.houseNumber - b.houseNumber);
    } else if (sortBy === "Even") {
      filtered = filtered
        .filter((property) => property.houseNumber % 2 === 0)
        .sort((a, b) => a.houseNumber - b.houseNumber);
    }

    setFilteredProperties(filtered);
  }, [properties, statusFilter, dataSourceFilter, sortBy]);

  // Update status counts and statistics whenever properties change
  useEffect(() => {
    const counts = {
      "not-visited": 0,
      interested: 0,
      visited: 0,
      callback: 0,
      appointment: 0,
      "follow-up": 0,
      "not-interested": 0,
    };

    let visitedCount = 0;

    properties.forEach((property) => {
      if (counts.hasOwnProperty(property.status)) {
        counts[property.status as keyof typeof counts]++;
      }

      // Count visited properties (any status except not-visited and not-interested)
      if (
        property.status === "visited" ||
        property.status === "interested" ||
        property.status === "callback" ||
        property.status === "appointment" ||
        property.status === "follow-up"
      ) {
        visitedCount++;
      }
    });

    setStatusCounts(counts);
    setStats({
      totalHomes: properties.length,
      visited: visitedCount,
      remaining: properties.length - visitedCount,
    });
  }, [properties]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // Set hybrid view by default
      map.setMapTypeId(google.maps.MapTypeId.HYBRID);

      if (territory?.boundary) {
        // Add a small delay to ensure map is fully loaded
        setTimeout(() => {
          const bounds = new window.google.maps.LatLngBounds();
          territory.boundary.coordinates[0].forEach(
            ([lng, lat]: [number, number]) => {
              bounds.extend(new window.google.maps.LatLng(lat, lng));
            }
          );
          map.fitBounds(bounds);
          // Set a reasonable zoom level that's not too zoomed in
          setTimeout(() => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 16) {
              map.setZoom(16); // Cap the zoom level
            }
          }, 100);
        }, 200);
      }
    },
    [territory]
  );

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      setIsLoadingPropertyDetails(true);
      const response = await apiInstance.get(`/residents/${propertyId}`);
      console.log("🔍 API Response Data:", response.data.data);
      console.log("🏠 Resident Data:", response.data.data.resident);
      console.log("🏘️ Property Data:", response.data.data.propertyData);
      console.log("🗺️ Zone Data:", response.data.data.zone);
      console.log("📊 Zone Stats:", response.data.data.zoneStats);
      setDetailedProperty(response.data.data); // Now contains comprehensive data
    } catch (error) {
      console.error("Error fetching property details:", error);
      toast.error("Failed to load property details");
      setDetailedProperty(null);
    } finally {
      setIsLoadingPropertyDetails(false);
    }
  };

  const handlePropertyClick = async (property: Property) => {
    setSelectedProperty(property);

    // Center map on selected property
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: property.coordinates[1],
        lng: property.coordinates[0],
      });
      mapRef.current.setZoom(18);
    }

    // Fetch detailed property information
    await fetchPropertyDetails(property._id);
  };

  const handleViewDetails = () => {
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProperty(null);
    // Reset form data
    setEditFormData({
      address: "",
      houseNumber: "",
      longitude: "",
      latitude: "",
      status: "not-visited",
      lastVisited: "",
      notes: "",
      phone: "",
      email: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerMailingAddress: "",
    });
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);

    // Debug: Log the lastVisited values
    console.log("🔍 Debug - Property lastVisited:", property.lastVisited);
    console.log(
      "🔍 Debug - DetailedProperty lastVisited:",
      detailedProperty?.resident?.lastVisited
    );

    // Initialize form data with current property values
    setEditFormData({
      address: property.address,
      houseNumber: property.houseNumber?.toString() || "",
      longitude: property.coordinates[0]?.toString() || "",
      latitude: property.coordinates[1]?.toString() || "",
      status: property.status,
      lastVisited: (() => {
        const detailedDate = detailedProperty?.resident?.lastVisited
          ? new Date(detailedProperty.resident.lastVisited)
              .toISOString()
              .split("T")[0]
          : "";
        const propertyDate = property.lastVisited
          ? new Date(property.lastVisited).toISOString().split("T")[0]
          : "";
        const finalDate = detailedDate || propertyDate;
        console.log("🔍 Debug - Formatted lastVisited date:", finalDate);
        return finalDate;
      })(),
      notes: detailedProperty?.resident?.notes || property.notes || "",
      phone:
        detailedProperty?.resident?.phone ||
        property.residents?.[0]?.phone ||
        "",
      email:
        detailedProperty?.resident?.email ||
        property.residents?.[0]?.email ||
        "",
      // Get owner information from detailed property data if available
      ownerName: detailedProperty?.propertyData?.ownerName || "",
      ownerPhone: detailedProperty?.propertyData?.ownerPhone || "",
      ownerEmail: detailedProperty?.propertyData?.ownerEmail || "",
      ownerMailingAddress:
        detailedProperty?.propertyData?.ownerMailingAddress || "",
    });
    // Prevent the property details modal from opening
    setIsDetailModalOpen(false);
  };

  const handleFormChange = async (field: string, value: string) => {
    if (isUpdatingResident) return; // Prevent changes during update
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // NO automatic synchronization - users must manually click Search button
    // This prevents unwanted address replacement and gives full control
    // Users can:
    // 1. Type/paste addresses freely without interference
    // 2. Click Search button to geocode address → coordinates
    // 3. Click Search button to reverse geocode coordinates → address

    // Only validate form (no synchronization)
    setTimeout(() => validateEditForm(), 500);
  };

  const handleUpdateResident = async () => {
    if (!selectedProperty) return;

    try {
      setIsUpdatingResident(true);

      // No validation needed - basic info update is allowed without status fields
      // Users can update address, coordinates, contact info independently

      const updateData = {
        address: editFormData.address,
        houseNumber: editFormData.houseNumber
          ? parseInt(editFormData.houseNumber)
          : undefined,
        coordinates: [
          parseFloat(editFormData.longitude),
          parseFloat(editFormData.latitude),
        ],
        status: editFormData.status,
        lastVisited: editFormData.lastVisited || undefined,
        notes: editFormData.notes || undefined,
        phone: editFormData.phone || undefined,
        email: editFormData.email || undefined,
        // Owner information (these might need to be handled separately for PropertyData)
        ownerName: editFormData.ownerName || undefined,
        ownerPhone: editFormData.ownerPhone || undefined,
        ownerEmail: editFormData.ownerEmail || undefined,
        ownerMailingAddress: editFormData.ownerMailingAddress || undefined,
      };

      console.log("🔄 Updating resident:", selectedProperty._id, updateData);

      const response = await apiInstance.put(
        `/residents/${selectedProperty._id}`,
        updateData
      );

      console.log("✅ Update response:", response.data);

      if (response.data.success) {
        toast.success(
          "Resident updated successfully! You can continue editing or close the modal."
        );

        // Invalidate dashboard query cache to refresh statistics
        queryClient.invalidateQueries({ queryKey: ["myTerritories"] });

        // Also invalidate admin dashboard queries
        queryClient.invalidateQueries({
          queryKey: ["admin", "team-performance"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "territory-stats"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "assignment-status"],
        });

        // Update the local state
        setProperties((prev) =>
          prev.map((prop) =>
            prop._id === selectedProperty._id
              ? {
                  ...prop,
                  address: updateData.address,
                  houseNumber: updateData.houseNumber || prop.houseNumber,
                  coordinates: updateData.coordinates as [number, number],
                  status: updateData.status,
                  lastVisited: updateData.lastVisited,
                  lastUpdatedBy: response.data.data.lastUpdatedBy,
                  notes: updateData.notes,
                  phone: updateData.phone,
                  email: updateData.email,
                }
              : prop
          )
        );

        // Update the selected property with new data
        setSelectedProperty((prev) =>
          prev
            ? {
                ...prev,
                address: updateData.address,
                houseNumber: updateData.houseNumber || prev.houseNumber,
                coordinates: updateData.coordinates as [number, number],
                status: updateData.status,
                lastVisited: updateData.lastVisited,
                lastUpdatedBy: response.data.data.lastUpdatedBy,
                notes: updateData.notes,
                phone: updateData.phone,
                email: updateData.email,
              }
            : null
        );

        // Update the detailed property data to reflect changes in the card
        setDetailedProperty((prev: any) =>
          prev
            ? {
                ...prev,
                resident: {
                  ...prev.resident,
                  address: updateData.address,
                  houseNumber:
                    updateData.houseNumber || prev.resident?.houseNumber,
                  coordinates: updateData.coordinates as [number, number],
                  status: updateData.status,
                  lastVisited: updateData.lastVisited,
                  lastUpdatedBy: response.data.data.lastUpdatedBy,
                  notes: updateData.notes,
                  phone: updateData.phone,
                  email: updateData.email,
                },
                propertyData: response.data.data.propertyData
                  ? {
                      ...prev.propertyData,
                      ownerName: updateData.ownerName,
                      ownerPhone: updateData.ownerPhone,
                      ownerEmail: updateData.ownerEmail,
                      ownerMailingAddress: updateData.ownerMailingAddress,
                    }
                  : prev.propertyData,
              }
            : null
        );

        // Update form data with the response data to show updated values
        setEditFormData({
          address: updateData.address,
          houseNumber: updateData.houseNumber?.toString() || "",
          longitude: updateData.coordinates[0]?.toString() || "",
          latitude: updateData.coordinates[1]?.toString() || "",
          status: updateData.status,
          lastVisited: updateData.lastVisited || "",
          notes: updateData.notes || "",
          phone: updateData.phone || "",
          email: updateData.email || "",
          ownerName: updateData.ownerName || "",
          ownerPhone: updateData.ownerPhone || "",
          ownerEmail: updateData.ownerEmail || "",
          ownerMailingAddress: updateData.ownerMailingAddress || "",
        });

        // Modal stays open - user can see updated values
        // User can manually close or make more changes
      }
    } catch (error: any) {
      console.error("❌ Error updating resident:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update resident");
      }
    } finally {
      setIsUpdatingResident(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setSelectedProperty(null); // Close any selected property
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    // Reset form data
    setAddFormData({
      address: "",
      houseNumber: "",
      longitude: "",
      latitude: "",
      status: "not-visited",
      lastVisited: "",
      notes: "",
      phone: "",
      email: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerMailingAddress: "",
    });
  };

  const handleAddFormChange = async (field: string, value: string) => {
    if (isAddingResident) return; // Prevent changes during submit

    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // NO automatic synchronization - users must manually click Search button
    // This prevents unwanted address replacement and gives full control
    // Users can:
    // 1. Type/paste addresses freely without interference
    // 2. Click Search button to geocode address → coordinates
    // 3. Click Search button to reverse geocode coordinates → address

    // Only validate form (no synchronization)
    setTimeout(() => validateForm(), 500);
  };

  // Find exact coordinates using Places API
  const findExactCoordinates = async (formType: "add" | "edit") => {
    const address =
      formType === "add" ? addFormData.address : editFormData.address;

    if (!address.trim()) {
      toast.error("Please enter an address");
      return;
    }

    try {
      console.log("🔍 Finding exact coordinates for address:", address);

      // Create Places service
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      // Use findPlaceFromQuery to get exact coordinates
      service.findPlaceFromQuery(
        {
          query: address,
          fields: ["place_id", "geometry", "formatted_address"],
        },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length
          ) {
            const place = results[0];

            // Check if geometry and location exist
            if (!place.geometry || !place.geometry.location) {
              toast.error("No location data found for this address");
              return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || address;

            console.log("🎯 Places API Results:");
            console.log("📍 Place ID:", place.place_id);
            console.log("📍 Address:", formattedAddress);
            console.log("📍 Coordinates:", lat, lng);

            // Update the form with exact coordinates
            if (formType === "add") {
              setAddFormData((prev) => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: formattedAddress,
                houseNumber: formattedAddress.match(/^(\d+)/)?.[1] || "",
              }));
            } else {
              setEditFormData((prev) => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: formattedAddress,
                houseNumber: formattedAddress.match(/^(\d+)/)?.[1] || "",
              }));
            }

            toast.success(`✅ Exact coordinates found: ${lat}, ${lng}`);
          } else {
            console.error("❌ Places API Error:", status);
            toast.error(`Failed to find coordinates: ${status}`);
          }
        }
      );
    } catch (error) {
      console.error("❌ Error finding exact coordinates:", error);
      toast.error("Error finding exact coordinates");
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (isAddModalOpen && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setAddFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      // Trigger synchronization and validation
      await synchronizeFields("coordinates");
      setTimeout(() => validateForm(), 500);

      toast.info(`Coordinates captured: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    toast.info("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update coordinates first
        setAddFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // Get address using reverse geocoding
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat, lng },
          });

          if (result.results && result.results.length > 0) {
            const address = result.results[0].formatted_address;

            // Extract house number from address
            const houseNumberMatch = address.match(/^(\d+)/);
            const houseNumber = houseNumberMatch ? houseNumberMatch[1] : "";

            // Update form data with address and house number
            setAddFormData((prev) => ({
              ...prev,
              address: address,
              houseNumber: houseNumber,
            }));

            toast.success(
              `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
                6
              )}\nAddress: ${address}`
            );
          } else {
            toast.success(
              `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
                6
              )}\nAddress not found`
            );
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          toast.success(
            `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
              6
            )}\nAddress lookup failed`
          );
        }

        setIsGettingLocation(false);

        // Trigger validation after setting location
        setTimeout(() => validateForm(), 500);

        // Optional: Center map on current location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(18);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Location permission denied. Please enable location access in your browser."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location information unavailable");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out");
        } else {
          toast.error("Failed to get your location");
        }
      },
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached location
      }
    );
  };

  // Validation functions
  const validateCoordinatesInsideZone = async (
    lat: number,
    lng: number
  ): Promise<boolean> => {
    if (!territory?.boundary) return false;

    try {
      // Use Google Maps geometry library to check if point is inside polygon
      const point = new window.google.maps.LatLng(lat, lng);
      const polygon = new window.google.maps.Polygon({
        paths: territory.boundary.coordinates[0].map(
          (coord: [number, number]) =>
            new window.google.maps.LatLng(coord[1], coord[0])
        ),
      });

      return window.google.maps.geometry.poly.containsLocation(point, polygon);
    } catch (error) {
      console.error("Error validating coordinates inside zone:", error);
      return false;
    }
  };

  const synchronizeFields = async (
    sourceField: "address" | "coordinates"
  ): Promise<void> => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      if (sourceField === "address" && addFormData.address) {
        // Use Places API for exact coordinates (same as Test Address)
        console.log("🔍 Places API geocoding address:", addFormData.address);

        // Create Places service
        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );

        // Use findPlaceFromQuery to get exact coordinates
        service.findPlaceFromQuery(
          {
            query: addFormData.address,
            fields: ["place_id", "geometry", "formatted_address"],
          },
          (results, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results &&
              results.length
            ) {
              const place = results[0];

              // Check if geometry and location exist
              if (!place.geometry || !place.geometry.location) {
                toast.error("No location data found for this address");
                return;
              }

              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || addFormData.address;

              console.log("🎯 Places API Results for Address field:");
              console.log("📍 Place ID:", place.place_id);
              console.log("📍 Address:", address);
              console.log("📍 Coordinates:", lat, lng);

              // Update form with exact coordinates
              setAddFormData((prev) => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: address,
                houseNumber: address.match(/^(\d+)/)?.[1] || "",
              }));

              toast.success(`✅ Exact coordinates found: ${lat}, ${lng}`);
            } else {
              console.error("❌ Places API Error:", status);
              toast.error(`Failed to find coordinates: ${status}`);
            }
          }
        );
      } else if (
        sourceField === "coordinates" &&
        addFormData.latitude &&
        addFormData.longitude
      ) {
        // Reverse geocode coordinates to get address
        const lat = parseFloat(addFormData.latitude);
        const lng = parseFloat(addFormData.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat, lng },
            region: "ca",
          });

          if (result.results && result.results.length > 0) {
            // Prefer rooftop accuracy
            const preciseResult =
              result.results.find(
                (r) => r.geometry.location_type === "ROOFTOP"
              ) || result.results[0];

            const address = preciseResult.formatted_address;

            // Extract the street number safely from address_components
            const houseNumberComponent = preciseResult.address_components.find(
              (c) => c.types.includes("street_number")
            );
            const houseNumber = houseNumberComponent
              ? houseNumberComponent.long_name
              : "";

            setAddFormData((prev) => ({
              ...prev,
              address: address,
              houseNumber: houseNumber,
            }));
          } else {
            toast.warning(
              "No address found for these coordinates. Try moving the pin slightly."
            );
          }
        }
      }

      setFieldsSynchronized(true);
    } catch (error: any) {
      console.error("Error synchronizing fields:", error);

      // Provide specific error messages based on the error type
      let errorMessage = "Failed to synchronize location fields";
      if (error?.code === "ZERO_RESULTS") {
        errorMessage =
          "Address not found. Please check the address or enter coordinates manually.";
      } else if (error?.code === "OVER_QUERY_LIMIT") {
        errorMessage =
          "Geocoding service limit reached. Please try again later.";
      } else if (error?.code === "REQUEST_DENIED") {
        errorMessage = "Geocoding request denied. Please check your API key.";
      } else if (error?.code === "INVALID_REQUEST") {
        errorMessage = "Invalid address format. Please check your input.";
      }

      setValidationErrors((prev) => [...prev, errorMessage]);
      setFieldsSynchronized(false);

      // Show user-friendly toast message
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationErrors([]);

    const errors: string[] = [];

    try {
      // Check required fields
      if (!addFormData.address.trim()) errors.push("Address is required");
      if (!addFormData.houseNumber.trim())
        errors.push("House number is required");
      if (!addFormData.longitude.trim()) errors.push("Longitude is required");
      if (!addFormData.latitude.trim()) errors.push("Latitude is required");

      // Validate coordinates format
      if (addFormData.latitude && addFormData.longitude) {
        const lat = parseFloat(addFormData.latitude);
        const lng = parseFloat(addFormData.longitude);

        if (isNaN(lat) || isNaN(lng)) {
          errors.push("Invalid coordinates format");
        } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          errors.push("Coordinates are out of valid range");
        }
      }

      setValidationErrors(errors);
      return errors.length === 0;
    } catch (error) {
      console.error("Error validating form:", error);
      setValidationErrors(["Validation error occurred"]);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const isFormValid = (): boolean => {
    return (
      addFormData.address.trim() !== "" &&
      addFormData.houseNumber.trim() !== "" &&
      addFormData.longitude.trim() !== "" &&
      addFormData.latitude.trim() !== ""
    );
  };

  // Edit form validation functions
  const validateEditCoordinatesInsideZone = async (
    lat: number,
    lng: number
  ): Promise<boolean> => {
    if (!territory?.boundary) return false;

    try {
      // Use Google Maps geometry library to check if point is inside polygon
      const point = new window.google.maps.LatLng(lat, lng);
      const polygon = new window.google.maps.Polygon({
        paths: territory.boundary.coordinates[0].map(
          (coord: [number, number]) =>
            new window.google.maps.LatLng(coord[1], coord[0])
        ),
      });

      return window.google.maps.geometry.poly.containsLocation(point, polygon);
    } catch (error) {
      console.error("Error validating edit coordinates inside zone:", error);
      return false;
    }
  };

  const synchronizeEditFields = async (
    sourceField: "address" | "coordinates"
  ): Promise<void> => {
    setIsEditValidating(true);
    setEditValidationErrors([]);

    try {
      if (sourceField === "address" && editFormData.address) {
        // Use Places API for exact coordinates (same as Test Address)
        console.log("🔍 Places API geocoding address:", editFormData.address);

        // Create Places service
        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );

        // Use findPlaceFromQuery to get exact coordinates
        service.findPlaceFromQuery(
          {
            query: editFormData.address,
            fields: ["place_id", "geometry", "formatted_address"],
          },
          (results, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results &&
              results.length
            ) {
              const place = results[0];

              // Check if geometry and location exist
              if (!place.geometry || !place.geometry.location) {
                toast.error("No location data found for this address");
                return;
              }

              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || editFormData.address;

              console.log("🎯 Places API Results for Edit Address field:");
              console.log("📍 Place ID:", place.place_id);
              console.log("📍 Address:", address);
              console.log("📍 Coordinates:", lat, lng);

              // Update form with exact coordinates
              setEditFormData((prev) => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: address,
                houseNumber: address.match(/^(\d+)/)?.[1] || "",
              }));

              toast.success(`✅ Exact coordinates found: ${lat}, ${lng}`);
            } else {
              console.error("❌ Places API Error:", status);
              toast.error(`Failed to find coordinates: ${status}`);
            }
          }
        );
      } else if (
        sourceField === "coordinates" &&
        editFormData.latitude &&
        editFormData.longitude
      ) {
        // Reverse geocode coordinates to get address
        const lat = parseFloat(editFormData.latitude);
        const lng = parseFloat(editFormData.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat, lng },
            region: "ca",
          });

          if (result.results && result.results.length > 0) {
            // Prefer rooftop accuracy
            const preciseResult =
              result.results.find(
                (r) => r.geometry.location_type === "ROOFTOP"
              ) || result.results[0];

            const address = preciseResult.formatted_address;

            // Extract the street number safely from address_components
            const houseNumberComponent = preciseResult.address_components.find(
              (c) => c.types.includes("street_number")
            );
            const houseNumber = houseNumberComponent
              ? houseNumberComponent.long_name
              : "";

            setEditFormData((prev) => ({
              ...prev,
              address: address,
              houseNumber: houseNumber,
            }));
          } else {
            toast.warning(
              "No address found for these coordinates. Try moving the pin slightly."
            );
          }
        }
      }

      setEditFieldsSynchronized(true);
    } catch (error: any) {
      console.error("Error synchronizing edit fields:", error);

      // Provide specific error messages based on the error type
      let errorMessage = "Failed to synchronize location fields";
      if (error?.code === "ZERO_RESULTS") {
        errorMessage =
          "Address not found. Please check the address or enter coordinates manually.";
      } else if (error?.code === "OVER_QUERY_LIMIT") {
        errorMessage =
          "Geocoding service limit reached. Please try again later.";
      } else if (error?.code === "REQUEST_DENIED") {
        errorMessage = "Geocoding request denied. Please check your API key.";
      } else if (error?.code === "INVALID_REQUEST") {
        errorMessage = "Invalid address format. Please check your input.";
      }

      setEditValidationErrors((prev) => [...prev, errorMessage]);
      setEditFieldsSynchronized(false);

      // Show user-friendly toast message
      toast.error(errorMessage);
    } finally {
      setIsEditValidating(false);
    }
  };

  const validateEditForm = async (): Promise<boolean> => {
    setIsEditValidating(true);
    setEditValidationErrors([]);

    const errors: string[] = [];

    try {
      // Check required fields - only house number is mandatory
      if (!editFormData.houseNumber) errors.push("House number is required");

      // Validate coordinates format (only if provided)
      if (editFormData.latitude && editFormData.longitude) {
        const lat = parseFloat(editFormData.latitude);
        const lng = parseFloat(editFormData.longitude);

        if (isNaN(lat) || isNaN(lng)) {
          errors.push("Invalid coordinates format");
        } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          errors.push("Coordinates are out of valid range");
        } else {
          // Zone boundary validation is handled by backend
          // Frontend only validates coordinate format and range
          setEditCoordinatesInsideZone(true);
        }
      } else {
        // If no coordinates provided, set as valid for zone check
        setEditCoordinatesInsideZone(true);
      }

      setEditValidationErrors(errors);
      return errors.length === 0;
    } catch (error) {
      console.error("Error validating edit form:", error);
      setEditValidationErrors(["Validation error occurred"]);
      return false;
    } finally {
      setIsEditValidating(false);
    }
  };

  const isEditFormValid = (): boolean => {
    // Basic info is required
    const basicInfoValid =
      editFormData.address.trim() !== "" &&
      editFormData.houseNumber.trim() !== "" &&
      editFormData.longitude.trim() !== "" &&
      editFormData.latitude.trim() !== "";

    // Last Visited is required ONLY when status is not "not-visited"
    const statusValid =
      editFormData.status === "not-visited" ||
      (editFormData.status !== "not-visited" &&
        editFormData.lastVisited.trim() !== "");

    return basicInfoValid && statusValid;
  };

  const handleEditUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsEditGettingLocation(true);
    toast.info("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update coordinates first
        setEditFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // Get address using reverse geocoding
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat, lng },
          });

          if (result.results && result.results.length > 0) {
            const address = result.results[0].formatted_address;

            // Extract house number from address
            const houseNumberMatch = address.match(/^(\d+)/);
            const houseNumber = houseNumberMatch ? houseNumberMatch[1] : "";

            // Update form data with address and house number
            setEditFormData((prev) => ({
              ...prev,
              address: address,
              houseNumber: houseNumber,
            }));

            toast.success(
              `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
                6
              )}\nAddress: ${address}`
            );
          } else {
            toast.success(
              `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
                6
              )}\nAddress not found`
            );
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          toast.success(
            `Location captured: ${lat.toFixed(6)}, ${lng.toFixed(
              6
            )}\nAddress lookup failed`
          );
        }

        setIsEditGettingLocation(false);

        // Trigger validation after setting location
        setTimeout(() => validateEditForm(), 500);

        // Optional: Center map on current location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(18);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsEditGettingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Location permission denied. Please enable location access in your browser."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location information unavailable");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out");
        } else {
          toast.error("Failed to get your location");
        }
      },
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached location
      }
    );
  };

  const handleAddResident = async () => {
    try {
      setIsAddingResident(true);

      // Validate required fields - only house number is mandatory
      if (!addFormData.houseNumber) {
        toast.error("Please enter a house number");
        return;
      }

      const createData = {
        zoneId: territoryId,
        address: addFormData.address,
        houseNumber: parseInt(addFormData.houseNumber),
        coordinates: [
          parseFloat(addFormData.longitude),
          parseFloat(addFormData.latitude),
        ],
        status: addFormData.status,
        lastVisited: addFormData.lastVisited || undefined,
        notes: addFormData.notes || undefined,
        phone: addFormData.phone || undefined,
        email: addFormData.email || undefined,
        ownerName: addFormData.ownerName || undefined,
        ownerPhone: addFormData.ownerPhone || undefined,
        ownerEmail: addFormData.ownerEmail || undefined,
        ownerMailingAddress: addFormData.ownerMailingAddress || undefined,
      };

      console.log("🏗️ Creating resident:", createData);

      const response = await apiInstance.post("/residents", createData);

      console.log("✅ Create response:", response.data);

      if (response.data.success) {
        toast.success("Property added successfully!");

        // Invalidate dashboard query cache
        queryClient.invalidateQueries({ queryKey: ["myTerritories"] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "team-performance"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "territory-stats"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "assignment-status"],
        });

        // Add new property to local state
        const newProperty: Property = {
          _id: response.data.data._id,
          address: createData.address,
          houseNumber: createData.houseNumber,
          coordinates: createData.coordinates as [number, number],
          status: createData.status,
          lastVisited: createData.lastVisited,
          notes: createData.notes,
          dataSource: "MANUAL",
          lastUpdatedBy: response.data.data.lastUpdatedBy,
        };

        setProperties((prev) => [...prev, newProperty]);

        // Close modal and reset form
        handleCloseAddModal();
      }
    } catch (error: any) {
      console.error("❌ Error creating resident:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to add property");
      }
    } finally {
      setIsAddingResident(false);
    }
  };

  const handleExportProperty = () => {
    if (selectedProperty) {
      // Export logic here
      toast.success("Property data exported successfully");
    }
  };

  const handleFocusCurrentZone = () => {
    if (mapRef.current && territory?.boundary) {
      const bounds = new google.maps.LatLngBounds();

      // Add boundary coordinates to bounds
      if (territory.boundary.coordinates && territory.boundary.coordinates[0]) {
        territory.boundary.coordinates[0].forEach((coord: [number, number]) => {
          bounds.extend({ lat: coord[1], lng: coord[0] });
        });
      }

      // Add property coordinates to bounds
      properties.forEach((property) => {
        bounds.extend({
          lat: property.coordinates[1],
          lng: property.coordinates[0],
        });
      });

      mapRef.current.fitBounds(bounds);

      // Add some padding to the bounds
      const listener = google.maps.event.addListenerOnce(
        mapRef.current,
        "bounds_changed",
        () => {
          if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom && currentZoom > 16) {
              mapRef.current.setZoom(16);
            }
          }
        }
      );
    }
  };

  const handleMapViewChange = (
    viewType: "roadmap" | "satellite" | "hybrid" | "terrain"
  ) => {
    setMapViewType(viewType);
    if (mapRef.current) {
      const mapTypeId =
        viewType === "roadmap"
          ? google.maps.MapTypeId.ROADMAP
          : viewType === "satellite"
          ? google.maps.MapTypeId.SATELLITE
          : viewType === "hybrid"
          ? google.maps.MapTypeId.HYBRID
          : google.maps.MapTypeId.TERRAIN;
      mapRef.current.setMapTypeId(mapTypeId);
    }
  };

  const handleBackToList = () => {
    router.back();
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading Google Maps</div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading map view...</div>
          <div className="text-gray-400 text-sm mt-2">
            Please wait while we prepare your territory
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to List</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {territory?.name || "Territory Map View"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {territory?.description ||
                  "Detailed property view and management"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFocusCurrentZone}
              className="text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Focus Current Zone</span>
              <span className="sm:hidden">Focus</span>
            </Button>
            <div
              className="text-xs sm:text-sm font-medium px-2 py-1"
              style={{
                color:
                  territory?.status === "ACTIVE"
                    ? "#10B981"
                    : territory?.status === "SCHEDULED"
                    ? "#F59E0B"
                    : territory?.status === "DRAFT"
                    ? "#6B7280"
                    : territory?.status === "COMPLETED"
                    ? "#3B82F6"
                    : "#6B7280",
              }}
            >
              {territory?.status || "Loading..."}
            </div>
            {territory?.assignedTo && (
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Assigned to:{" "}
                <span className="font-medium">{territory.assignedTo.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        {/* Responsive Left Sidebar */}
        <div className="w-full xl:w-96 bg-white border-b xl:border-b-0 xl:border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Fixed Stats Header */}
          <div className="p-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-medium text-gray-700">
                Properties
              </h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
              <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                <CardContent className="p-1 sm:p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold">
                    {stats.totalHomes}
                  </div>
                  <div className="text-xs">Total Homes</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white">
                <CardContent className="p-1 sm:p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold">
                    {stats.visited}
                  </div>
                  <div className="text-xs">Visited</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white">
                <CardContent className="p-1 sm:p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold">
                    {stats.remaining}
                  </div>
                  <div className="text-xs">Remaining</div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
              <Button
                variant={sortBy === "Sequential" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("Sequential")}
                className={`text-xs sm:text-sm ${
                  sortBy === "Sequential" ? "bg-blue-600 text-white" : ""
                }`}
              >
                <span className="hidden sm:inline">Sequential</span>
                <span className="sm:hidden">Seq</span>
              </Button>
              <Button
                variant={sortBy === "Odd" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("Odd")}
                className={`text-xs sm:text-sm ${
                  sortBy === "Odd" ? "bg-blue-600 text-white" : ""
                }`}
              >
                Odd
              </Button>
              <Button
                variant={sortBy === "Even" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("Even")}
                className={`text-xs sm:text-sm ${
                  sortBy === "Even" ? "bg-blue-600 text-white" : ""
                }`}
              >
                Even
              </Button>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="not-visited">Not Visited</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="visited">Visited</SelectItem>
                <SelectItem value="callback">Callback</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="not-interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>

            {/* Data Source Filter */}
            <Select
              value={dataSourceFilter}
              onValueChange={setDataSourceFilter}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Sources">All Sources</SelectItem>
                <SelectItem value="AUTO">Auto-Detected</SelectItem>
                <SelectItem value="MANUAL">Manually Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scrollable Property List */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D1D5DB #F3F4F6",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `}</style>
            {filteredProperties.map((property, index) => (
              <div
                key={property._id}
                className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group ${
                  selectedProperty?._id === property._id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-sm xl:text-sm leading-tight break-words">
                          {property.address}
                        </h3>
                        {property.dataSource === "MANUAL" && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800 border-orange-300 text-[10px] px-1 py-0 h-4 flex-shrink-0"
                          >
                            Manual
                          </Badge>
                        )}
                        {property.dataSource === "AUTO" && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 border-gray-300 text-[10px] px-1 py-0 h-4 flex-shrink-0"
                          >
                            Auto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="text-[10px] flex-shrink-0 truncate px-2 py-1 rounded"
                          style={{
                            color: statusColors[property.status],
                            backgroundColor:
                              statusColors[property.status] + "20",
                          }}
                        >
                          {property.status === "not-visited"
                            ? "⏳ Not Visited"
                            : property.status === "interested"
                            ? "✓ Interested"
                            : property.status === "visited"
                            ? "✓ Visited"
                            : property.status === "callback"
                            ? "📞 Callback"
                            : property.status === "appointment"
                            ? "📅 Appointment"
                            : property.status === "follow-up"
                            ? "🔄 Follow-up"
                            : property.status === "not-interested"
                            ? "❌ Not Interested"
                            : "⏳ Not Visited"}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit
                            className="w-3 h-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProperty(property);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 truncate">
                      {property.houseNumber}{" "}
                      {property.address
                        .split(",")[0]
                        .split(" ")
                        .slice(1)
                        .join(" ")}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {/* Removed red dot */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Status Legend */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Status Legend
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(statusColors).map(([status, color]) => {
                const displayName =
                  {
                    "not-visited": "Not Visited",
                    interested: "Interested",
                    visited: "Visited",
                    callback: "Callback",
                    appointment: "Appointment",
                    "follow-up": "Follow-up",
                    "not-interested": "Not Interested",
                  }[status] || status;

                return (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-600 truncate">
                      {displayName} (
                      {statusCounts[status as keyof typeof statusCounts]})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Google Map */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              onClick={handleOpenAddModal}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Property
            </Button>
            {isAddModalOpen && (
              <div className="bg-blue-50 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg shadow-md text-xs">
                <strong>Click on map</strong> to set coordinates
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() =>
                mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) + 1)
              }
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md"
              onClick={() =>
                mapRef.current?.setZoom((mapRef.current?.getZoom() || 15) - 1)
              }
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>

          {/* Google Map */}
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={
              territory?.boundary?.coordinates
                ? undefined
                : { lat: 28.6358, lng: 77.2777 }
            }
            zoom={territory?.boundary?.coordinates ? undefined : 16}
            onLoad={onLoad}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {/* Map View Controls */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                <Button
                  variant={mapViewType === "roadmap" ? "default" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 ${
                    mapViewType === "roadmap"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
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
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleMapViewChange("hybrid")}
                  title="Hybrid View (Recommended)"
                >
                  <Layers className="h-5 w-5" />
                </Button>

                <Button
                  variant={mapViewType === "satellite" ? "default" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 ${
                    mapViewType === "satellite"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleMapViewChange("satellite")}
                  title="Satellite View"
                >
                  <Satellite className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Territory Boundary */}
            {territory?.boundary && (
              <Polygon
                paths={territory.boundary.coordinates[0].map(
                  ([lng, lat]: [number, number]) => ({
                    lat,
                    lng,
                  })
                )}
                options={{
                  fillColor: "#3B82F6",
                  fillOpacity: 0.1,
                  strokeColor: "#3B82F6",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Property Markers */}
            {properties.map((property) => (
              <Marker
                key={property._id}
                position={{
                  lat: property.coordinates[1],
                  lng: property.coordinates[0],
                }}
                onClick={() => handlePropertyClick(property)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: statusColors[property.status],
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#ffffff",
                }}
                title={`${property.address} - ${property.status}`}
              />
            ))}

            {/* Selected Property Info Window */}
            {selectedProperty && !isEditModalOpen && (
              <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg border-2 border-red-500 p-4 min-w-80 z-50">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </Button>
                {isLoadingPropertyDetails ? (
                  // Loading State
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-xs text-gray-600">
                        Loading property details...
                      </p>
                    </div>
                  </div>
                ) : detailedProperty ? (
                  // Property Details Content
                  <>
                    {/* Top Section - Header */}
                    <div className="border-b border-gray-200 pb-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {detailedProperty.resident?.address}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="text-xs font-medium"
                              style={{
                                color:
                                  detailedProperty.resident?.status ===
                                  "visited"
                                    ? "#10B981"
                                    : detailedProperty.resident?.status ===
                                      "not-visited"
                                    ? "#EF4444"
                                    : detailedProperty.resident?.status ===
                                      "interested"
                                    ? "#F59E0B"
                                    : detailedProperty.resident?.status ===
                                      "callback"
                                    ? "#8B5CF6"
                                    : detailedProperty.resident?.status ===
                                      "appointment"
                                    ? "#3B82F6"
                                    : detailedProperty.resident?.status ===
                                      "follow-up"
                                    ? "#EC4899"
                                    : detailedProperty.resident?.status ===
                                      "not-interested"
                                    ? "#6B7280"
                                    : "#EF4444",
                              }}
                            >
                              {detailedProperty.resident?.status === "visited"
                                ? "Visited"
                                : detailedProperty.resident?.status ===
                                  "not-visited"
                                ? "Not Visited"
                                : detailedProperty.resident?.status ===
                                  "interested"
                                ? "Interested"
                                : detailedProperty.resident?.status ===
                                  "callback"
                                ? "Callback"
                                : detailedProperty.resident?.status ===
                                  "appointment"
                                ? "Appointment"
                                : detailedProperty.resident?.status ===
                                  "follow-up"
                                ? "Follow-up"
                                : detailedProperty.resident?.status ===
                                  "not-interested"
                                ? "Not Interested"
                                : "Not Visited"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property Details Row - Only show when data exists */}
                      {/* Removed property age, occupancy, and score information as they're not collected in the form */}
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <h4 className="font-semibold text-gray-900 text-xs mb-2">
                        Contact Information
                      </h4>

                      {/* Contact Information */}
                      {detailedProperty.resident?.phone && (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-2.5 h-2.5 text-red-500" />
                          <span className="text-blue-600 font-medium text-xs">
                            {detailedProperty.resident.phone}
                          </span>
                        </div>
                      )}

                      {/* Property Data Information */}
                      {detailedProperty.propertyData && (
                        <div className="mb-2">
                          {detailedProperty.propertyData.ownerPhone && (
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="w-2.5 h-2.5 text-red-500" />
                              <span className="text-blue-600 font-medium text-xs">
                                Owner:{" "}
                                {detailedProperty.propertyData.ownerPhone}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Zone Information */}
                      {detailedProperty.zone && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-2.5 h-2.5 text-blue-500" />
                            <span className="text-blue-600 font-medium text-xs">
                              Zone: {detailedProperty.zone.name}
                            </span>
                          </div>
                          {detailedProperty.zoneStats && (
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-2.5 h-2.5 text-green-500" />
                              <span className="text-green-600 font-medium text-xs">
                                Progress:{" "}
                                {detailedProperty.zoneStats.visitedResidents}/
                                {detailedProperty.zoneStats.totalResidents}{" "}
                                visited
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resident Details Tags */}
                      <div className="flex flex-wrap gap-1">
                        {detailedProperty.resident?.houseNumber && (
                          <div className="text-xs text-gray-700 px-1 py-0">
                            House #{detailedProperty.resident.houseNumber}
                          </div>
                        )}

                        {detailedProperty.resident?.email && (
                          <div className="text-xs text-gray-700 px-1 py-0">
                            {detailedProperty.resident.email}
                          </div>
                        )}
                        {detailedProperty.resident?.lastVisited && (
                          <div className="text-xs text-gray-700 px-1 py-0">
                            Last:{" "}
                            {new Date(
                              detailedProperty.resident.lastVisited
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {detailedProperty.resident?.assignedAgentId && (
                          <div className="text-xs text-gray-700 px-1 py-0">
                            Assigned:{" "}
                            {
                              (detailedProperty.resident.assignedAgentId as any)
                                ?.name
                            }
                          </div>
                        )}

                        {/* Property Data Tags - Only show owner information that's collected in the form */}
                        {detailedProperty.propertyData?.ownerName && (
                          <div className="text-xs text-gray-700 px-1 py-0">
                            Owner: {detailedProperty.propertyData.ownerName}
                          </div>
                        )}
                        {/* Only show these if we have actual data, not static values */}
                        {/* Removed static "Homeowner" and "Office worker" tags */}
                      </div>
                    </div>

                    {/* Export Button Row */}
                    <div className="flex justify-between items-center">
                      {/* Updated By Info */}
                      {detailedProperty.resident?.lastUpdatedBy && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 px-2 py-1 flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            Updated by:{" "}
                            {typeof detailedProperty.resident.lastUpdatedBy ===
                            "string"
                              ? detailedProperty.resident.lastUpdatedBy
                              : (detailedProperty.resident.lastUpdatedBy as any)
                                  ?.name || "Unknown"}
                          </span>
                        </Badge>
                      )}

                      {/* Export CSV Button */}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export CSV
                      </Button>
                    </div>
                  </>
                ) : (
                  // Error State
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-xs text-red-600">
                        Failed to load property details
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          fetchPropertyDetails(selectedProperty._id)
                        }
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GoogleMap>
        </div>
      </div>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        isOpen={isDetailModalOpen && !isEditModalOpen}
        onClose={handleCloseDetailModal}
        property={selectedProperty}
        detailedProperty={detailedProperty}
        isLoading={isLoadingPropertyDetails}
        onExport={handleExportProperty}
      />

      {/* Edit Property Modal */}
      {isEditModalOpen && selectedProperty && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseEditModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Property
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Basic Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) =>
                          handleFormChange("address", e.target.value)
                        }
                        disabled={isUpdatingResident}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter full property address"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer disabled:cursor-not-allowed"
                        onClick={() => findExactCoordinates("edit")}
                        disabled={!editFormData.address || isUpdatingResident}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        House Number
                      </label>
                      <input
                        type="number"
                        value={editFormData.houseNumber}
                        onChange={(e) =>
                          handleFormChange("houseNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter house number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEditUseMyLocation}
                        disabled={isUpdatingResident || isEditGettingLocation}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {isEditGettingLocation
                          ? "Getting Location..."
                          : "Use My Current Location"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.longitude}
                      onChange={(e) =>
                        handleFormChange("longitude", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter longitude"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.latitude}
                      onChange={(e) =>
                        handleFormChange("latitude", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter latitude"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Validation Errors */}
              {editValidationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 text-sm">
                    <div className="font-medium mb-2">
                      Please fix the following errors:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {editValidationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Edit Validation Status */}
              {isEditValidating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Validating location and checking requirements...
                  </div>
                </div>
              )}

              {/* Status & Tracking Section */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Status & Tracking
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        handleFormChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="not-visited">Not Visited</option>
                      <option value="interested">Interested</option>
                      <option value="visited">Visited</option>
                      <option value="callback">Callback</option>
                      <option value="appointment">Appointment</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="not-interested">Not Interested</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Visited{" "}
                      {editFormData.status !== "not-visited" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <input
                        type="date"
                        value={editFormData.lastVisited}
                        onChange={(e) =>
                          handleFormChange("lastVisited", e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {editFormData.status !== "not-visited" &&
                      !editFormData.lastVisited && (
                        <p className="text-xs text-gray-500">
                          Required when status is not "Not Visited"
                        </p>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter agent notes about the visit/interaction..."
                  ></textarea>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        handleFormChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Owner Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.ownerName}
                      onChange={(e) =>
                        handleFormChange("ownerName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter owner name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.ownerPhone}
                      onChange={(e) =>
                        handleFormChange("ownerPhone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter owner phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.ownerEmail}
                      onChange={(e) =>
                        handleFormChange("ownerEmail", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter owner email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Mailing Address
                    </label>
                    <input
                      type="text"
                      value={editFormData.ownerMailingAddress}
                      onChange={(e) =>
                        handleFormChange("ownerMailingAddress", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter owner mailing address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseEditModal}
                  disabled={isUpdatingResident}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateResident}
                  disabled={isUpdatingResident || !isEditFormValid()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdatingResident && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isUpdatingResident
                    ? "Saving..."
                    : isEditValidating
                    ? "Validating..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseAddModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add New Property
                </h2>
                <button
                  onClick={handleCloseAddModal}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Use your GPS location, click on the map, or enter coordinates
                manually
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Basic Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addFormData.address}
                        onChange={(e) =>
                          handleAddFormChange("address", e.target.value)
                        }
                        disabled={isAddingResident}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter full property address"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer disabled:cursor-not-allowed"
                        onClick={() => findExactCoordinates("add")}
                        disabled={!addFormData.address || isAddingResident}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        House Number *
                      </label>
                      <input
                        type="number"
                        value={addFormData.houseNumber}
                        onChange={(e) =>
                          handleAddFormChange("houseNumber", e.target.value)
                        }
                        disabled={isAddingResident}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter house number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={isAddingResident || isGettingLocation}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {isGettingLocation
                          ? "Getting Location..."
                          : "Use My Current Location"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={addFormData.longitude}
                      onChange={(e) =>
                        handleAddFormChange("longitude", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Click map or enter manually"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={addFormData.latitude}
                      onChange={(e) =>
                        handleAddFormChange("latitude", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Click map or enter manually"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Tracking Section */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Status & Tracking
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      value={addFormData.status}
                      onChange={(e) =>
                        handleAddFormChange("status", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="not-visited">Not Visited</option>
                      <option value="interested">Interested</option>
                      <option value="visited">Visited</option>
                      <option value="callback">Callback</option>
                      <option value="appointment">Appointment</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="not-interested">Not Interested</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Visited{" "}
                      {addFormData.status !== "not-visited" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <input
                        type="date"
                        value={addFormData.lastVisited}
                        onChange={(e) =>
                          handleAddFormChange("lastVisited", e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={isAddingResident}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {addFormData.status !== "not-visited" &&
                      !addFormData.lastVisited && (
                        <p className="text-xs text-gray-500">
                          Required when status is not "Not Visited"
                        </p>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={addFormData.notes}
                    onChange={(e) =>
                      handleAddFormChange("notes", e.target.value)
                    }
                    disabled={isAddingResident}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter notes about the property..."
                  ></textarea>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={addFormData.phone}
                      onChange={(e) =>
                        handleAddFormChange("phone", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={addFormData.email}
                      onChange={(e) =>
                        handleAddFormChange("email", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Owner Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={addFormData.ownerName}
                      onChange={(e) =>
                        handleAddFormChange("ownerName", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter owner name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Phone
                    </label>
                    <input
                      type="tel"
                      value={addFormData.ownerPhone}
                      onChange={(e) =>
                        handleAddFormChange("ownerPhone", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter owner phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={addFormData.ownerEmail}
                      onChange={(e) =>
                        handleAddFormChange("ownerEmail", e.target.value)
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter owner email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Owner Mailing Address
                    </label>
                    <input
                      type="text"
                      value={addFormData.ownerMailingAddress}
                      onChange={(e) =>
                        handleAddFormChange(
                          "ownerMailingAddress",
                          e.target.value
                        )
                      }
                      disabled={isAddingResident}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter owner mailing address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                <div className="text-red-800 text-sm">
                  <div className="font-medium mb-2">
                    Please fix the following errors:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Validation Status */}
            {isValidating && (
              <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Validating location and checking requirements...
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseAddModal}
                  disabled={isAddingResident}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResident}
                  disabled={isAddingResident || !isFormValid()}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingResident && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isAddingResident
                    ? "Adding..."
                    : isValidating
                    ? "Validating..."
                    : "Add Property"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
