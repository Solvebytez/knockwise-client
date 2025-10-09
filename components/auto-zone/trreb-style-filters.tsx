"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2 } from "lucide-react";
import {
  getRegions,
  getAreasByRegion,
  getMunicipalitiesByArea,
  getCommunitiesByMunicipality,
  searchRegions,
  searchAreas,
  searchMunicipalities,
  searchCommunities,
  FreeLocationResult,
} from "@/lib/freeLocationData";

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
  onCommunityBoundaryRequest?: (
    communityName: string,
    municipalityName?: string
  ) => void;
}

export function TRREBStyleFilters({
  onFiltersChange,
  onCommunityBoundaryRequest,
}: SearchFiltersProps) {
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [community, setCommunity] = useState("");
  const [regionSuggestions, setRegionSuggestions] = useState<
    FreeLocationResult[]
  >([]);
  const [areaSuggestions, setAreaSuggestions] = useState<FreeLocationResult[]>(
    []
  );
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<
    FreeLocationResult[]
  >([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<
    FreeLocationResult[]
  >([]);
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [showMunicipalitySuggestions, setShowMunicipalitySuggestions] =
    useState(false);
  const [showCommunitySuggestions, setShowCommunitySuggestions] =
    useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);

  // Load regions on component mount
  useEffect(() => {
    const regions = getRegions();
    setRegionSuggestions(regions);
  }, []);

  // Handle region search
  const handleRegionSearch = (query: string) => {
    if (query.length < 1) {
      const regions = getRegions();
      setRegionSuggestions(regions);
      setShowRegionSuggestions(true);
      return;
    }

    const filtered = searchRegions(query);
    setRegionSuggestions(filtered);
    setShowRegionSuggestions(true);
  };

  // Handle area search
  const handleAreaSearch = (query: string) => {
    if (query.length < 2) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      return;
    }

    setIsLoadingAreas(true);
    try {
      const results = searchAreas(query);
      setAreaSuggestions(results);
      setShowAreaSuggestions(true);
    } catch (error) {
      console.error("Area search error:", error);
      setAreaSuggestions([]);
    } finally {
      setIsLoadingAreas(false);
    }
  };

  // Handle municipality search
  const handleMunicipalitySearch = (query: string) => {
    if (query.length < 2) {
      setMunicipalitySuggestions([]);
      setShowMunicipalitySuggestions(false);
      return;
    }

    setIsLoadingMunicipalities(true);
    try {
      const results = searchMunicipalities(query);
      setMunicipalitySuggestions(results);
      setShowMunicipalitySuggestions(true);
    } catch (error) {
      console.error("Municipality search error:", error);
      setMunicipalitySuggestions([]);
    } finally {
      setIsLoadingMunicipalities(false);
    }
  };

  // Handle community search
  const handleCommunitySearch = async (query: string) => {
    if (query.length < 2) {
      setCommunitySuggestions([]);
      setShowCommunitySuggestions(false);
      return;
    }

    setIsLoadingCommunities(true);
    try {
      // If we have a selected municipality, search within its communities
      if (municipality) {
        const allMunicipalities = Object.values(getRegions()).flatMap(
          (region) =>
            getAreasByRegion(region.code || "").flatMap((area) =>
              getMunicipalitiesByArea(area.code || "")
            )
        );
        const selectedMunicipalityData = allMunicipalities.find(
          (m) => m.name === municipality
        );
        if (selectedMunicipalityData?.code) {
          const allCommunities = await getCommunitiesByMunicipality(
            selectedMunicipalityData.code
          );
          const filtered = allCommunities.filter((community) =>
            community.name.toLowerCase().includes(query.toLowerCase())
          );
          setCommunitySuggestions(filtered);
        }
      } else {
        // Fallback to static search if no municipality selected
        const results = searchCommunities(query);
        setCommunitySuggestions(results);
      }
      setShowCommunitySuggestions(true);
    } catch (error) {
      console.error("Community search error:", error);
      setCommunitySuggestions([]);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Handle region selection - load areas for that region
  const handleRegionSelect = (selectedRegion: string) => {
    setRegion(selectedRegion);
    setArea(""); // Clear area when region changes
    setMunicipality(""); // Clear municipality when region changes
    setCommunity(""); // Clear community when region changes
    setShowRegionSuggestions(false);

    // Load areas for the selected region
    if (selectedRegion) {
      setIsLoadingAreas(true);
      try {
        // Find the region code
        const regions = getRegions();
        const selectedRegionData = regions.find(
          (r) => r.name === selectedRegion
        );
        if (selectedRegionData?.code) {
          const areas = getAreasByRegion(selectedRegionData.code);
          setAreaSuggestions(areas);
        }
      } catch (error) {
        console.error("Error loading areas:", error);
        setAreaSuggestions([]);
      } finally {
        setIsLoadingAreas(false);
      }
    } else {
      setAreaSuggestions([]);
    }
  };

  // Handle area selection - load municipalities for that area
  const handleAreaSelect = (selectedArea: string) => {
    setArea(selectedArea);
    setMunicipality(""); // Clear municipality when area changes
    setCommunity(""); // Clear community when area changes
    setShowAreaSuggestions(false);

    // Load municipalities for the selected area
    if (selectedArea) {
      setIsLoadingMunicipalities(true);
      try {
        // Find the area code
        const allAreas = Object.values(getRegions()).flatMap((region) =>
          getAreasByRegion(region.code || "")
        );
        const selectedAreaData = allAreas.find((a) => a.name === selectedArea);
        if (selectedAreaData?.code) {
          const municipalities = getMunicipalitiesByArea(selectedAreaData.code);
          setMunicipalitySuggestions(municipalities);
        }
      } catch (error) {
        console.error("Error loading municipalities:", error);
        setMunicipalitySuggestions([]);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    } else {
      setMunicipalitySuggestions([]);
    }
  };

  // Handle municipality selection - load communities for that municipality
  const handleMunicipalitySelect = async (selectedMunicipality: string) => {
    setMunicipality(selectedMunicipality);
    setCommunity(""); // Clear community when municipality changes
    setShowMunicipalitySuggestions(false);

    // Load communities for the selected municipality
    if (selectedMunicipality) {
      setIsLoadingCommunities(true);
      try {
        // Find the municipality code
        const allMunicipalities = Object.values(getRegions()).flatMap(
          (region) =>
            getAreasByRegion(region.code || "").flatMap((area) =>
              getMunicipalitiesByArea(area.code || "")
            )
        );
        const selectedMunicipalityData = allMunicipalities.find(
          (m) => m.name === selectedMunicipality
        );
        if (selectedMunicipalityData?.code) {
          // Now this is async - fetches from Overpass API
          const communities = await getCommunitiesByMunicipality(
            selectedMunicipalityData.code
          );
          setCommunitySuggestions(communities);
        }
      } catch (error) {
        console.error("Error loading communities:", error);
        setCommunitySuggestions([]);
      } finally {
        setIsLoadingCommunities(false);
      }
    } else {
      setCommunitySuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filters = {
      region,
      area,
      municipality,
      community,
    };
    onFiltersChange(filters);
  };

  const handleClear = () => {
    setRegion("");
    setArea("");
    setMunicipality("");
    setCommunity("");
    setRegionSuggestions([]);
    setAreaSuggestions([]);
    setMunicipalitySuggestions([]);
    setCommunitySuggestions([]);
    setShowRegionSuggestions(false);
    setShowAreaSuggestions(false);
    setShowMunicipalitySuggestions(false);
    setShowCommunitySuggestions(false);
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            TRREB-Style Filters
          </h3>
          <Search className="w-5 h-5 text-gray-500" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Region (Province/Territory) */}
          <div className="space-y-2">
            <Label htmlFor="region">Region (Province/Territory)</Label>
            <div className="relative">
              <Input
                id="region"
                placeholder="Search regions (Ontario, Quebec, BC, etc.)..."
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  handleRegionSearch(e.target.value);
                }}
                onFocus={() => {
                  if (regionSuggestions.length > 0) {
                    setShowRegionSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowRegionSuggestions(false), 200);
                }}
                className="w-full"
              />
              {showRegionSuggestions && regionSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {regionSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleRegionSelect(suggestion.name)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-gray-500">
                          {suggestion.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Canadian provinces and territories
            </p>
          </div>

          {/* Area (Regional Municipality/County) */}
          <div className="space-y-2">
            <Label htmlFor="area">Area (Regional Municipality/County)</Label>
            <div className="relative">
              <Input
                id="area"
                placeholder={
                  region
                    ? `Search areas in ${region}...`
                    : "Select a region first"
                }
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  handleAreaSearch(e.target.value);
                }}
                onFocus={() => {
                  if (areaSuggestions.length > 0) {
                    setShowAreaSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowAreaSuggestions(false), 200);
                }}
                className="w-full"
                disabled={!region}
              />
              {isLoadingAreas && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {showAreaSuggestions && areaSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {areaSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleAreaSelect(suggestion.name)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-gray-500">
                          {suggestion.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {region
                ? `Areas in ${region}`
                : "Select a region to search areas"}
            </p>
          </div>

          {/* Municipality */}
          <div className="space-y-2">
            <Label htmlFor="municipality">Municipality</Label>
            <div className="relative">
              <Input
                id="municipality"
                placeholder={
                  area
                    ? `Search municipalities in ${area}...`
                    : "Select an area first"
                }
                value={municipality}
                onChange={(e) => {
                  setMunicipality(e.target.value);
                  handleMunicipalitySearch(e.target.value);
                }}
                onFocus={() => {
                  if (municipalitySuggestions.length > 0) {
                    setShowMunicipalitySuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowMunicipalitySuggestions(false), 200);
                }}
                className="w-full"
                disabled={!area}
              />
              {isLoadingMunicipalities && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {showMunicipalitySuggestions &&
                municipalitySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {municipalitySuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() =>
                          handleMunicipalitySelect(suggestion.name)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span>{suggestion.name}</span>
                          <span className="text-xs text-gray-500">
                            {suggestion.parent}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <p className="text-xs text-gray-500">
              {area
                ? `Municipalities in ${area}`
                : "Select an area to search municipalities"}
            </p>
          </div>

          {/* Community */}
          <div className="space-y-2">
            <Label htmlFor="community">Community</Label>
            <div className="relative">
              <Input
                id="community"
                placeholder={
                  municipality
                    ? `Search communities in ${municipality}...`
                    : "Select a municipality first"
                }
                value={community}
                onChange={(e) => {
                  setCommunity(e.target.value);
                  handleCommunitySearch(e.target.value);
                }}
                onFocus={() => {
                  if (communitySuggestions.length > 0) {
                    setShowCommunitySuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowCommunitySuggestions(false), 200);
                }}
                className="w-full"
                disabled={!municipality}
              />
              {isLoadingCommunities && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {showCommunitySuggestions && communitySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {communitySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        setCommunity(suggestion.name);
                        setShowCommunitySuggestions(false);

                        // Trigger boundary fetching
                        if (onCommunityBoundaryRequest) {
                          onCommunityBoundaryRequest(
                            suggestion.name,
                            municipality
                          );
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-gray-500">
                          {suggestion.parent}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {municipality
                ? `Communities in ${municipality}`
                : "Select a municipality to search communities"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </form>

        {/* Data Source Info */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            Data Sources
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              • <strong>Regions:</strong> Canadian provinces and territories
            </li>
            <li>
              • <strong>Areas:</strong> Regional municipalities and counties
            </li>
            <li>
              • <strong>Municipalities:</strong> Census subdivisions
            </li>
            <li>
              • <strong>Communities:</strong> OpenStreetMap neighbourhoods
            </li>
            <li>
              • <strong>Free alternative</strong> to TRREB MLS data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
