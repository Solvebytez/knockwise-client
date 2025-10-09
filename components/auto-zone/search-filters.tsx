"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2 } from "lucide-react";
import { locationService, LocationSearchResult } from "@/lib/locationService";
import {
  getAreas,
  getMunicipalitiesByArea,
  getCommunitiesByMunicipality,
  searchAreas,
  searchMunicipalities,
  searchCommunities,
  FreeLocationResult,
} from "@/lib/freeLocationData";

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [community, setCommunity] = useState("");
  const [provinceSuggestions, setProvinceSuggestions] = useState<
    LocationSearchResult[]
  >([]);
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<
    LocationSearchResult[]
  >([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<
    LocationSearchResult[]
  >([]);
  const [showProvinceSuggestions, setShowProvinceSuggestions] = useState(false);
  const [showMunicipalitySuggestions, setShowMunicipalitySuggestions] =
    useState(false);
  const [showCommunitySuggestions, setShowCommunitySuggestions] =
    useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);

  // Load provinces on component mount
  useEffect(() => {
    const provinces = locationService.getProvinces();
    setProvinceSuggestions(provinces);
  }, []);

  // Fallback municipalities data for when API fails
  const getFallbackMunicipalities = (
    provinceName: string
  ): LocationSearchResult[] => {
    const fallbackData: { [key: string]: string[] } = {
      Ontario: [
        "Toronto",
        "Ottawa",
        "Mississauga",
        "Brampton",
        "Hamilton",
        "London",
        "Markham",
        "Vaughan",
        "Kitchener",
        "Windsor",
      ],
      Quebec: [
        "Montreal",
        "Quebec City",
        "Laval",
        "Gatineau",
        "Longueuil",
        "Sherbrooke",
        "Saguenay",
        "Levis",
        "Trois-Rivieres",
        "Terrebonne",
      ],
      "British Columbia": [
        "Vancouver",
        "Surrey",
        "Burnaby",
        "Richmond",
        "Abbotsford",
        "Coquitlam",
        "Saanich",
        "Delta",
        "Kelowna",
        "Langley",
      ],
      Alberta: [
        "Calgary",
        "Edmonton",
        "Red Deer",
        "Lethbridge",
        "St. Albert",
        "Medicine Hat",
        "Grande Prairie",
        "Airdrie",
        "Spruce Grove",
        "Leduc",
      ],
      Manitoba: [
        "Winnipeg",
        "Brandon",
        "Steinbach",
        "Thompson",
        "Portage la Prairie",
        "Winkler",
        "Selkirk",
        "Morden",
        "Flin Flon",
        "Dauphin",
      ],
      Saskatchewan: [
        "Saskatoon",
        "Regina",
        "Prince Albert",
        "Moose Jaw",
        "Swift Current",
        "Yorkton",
        "North Battleford",
        "Estevan",
        "Weyburn",
        "Cranbrook",
      ],
    };

    const municipalities = fallbackData[provinceName] || [];
    return municipalities.map((name, index) => ({
      name,
      type: "municipality" as const,
      province: provinceName,
      id: index + 1,
      placeType: "City",
    }));
  };

  // Handle Canadian province search
  const handleProvinceSearch = (query: string) => {
    if (query.length < 1) {
      const provinces = locationService.getProvinces();
      setProvinceSuggestions(provinces);
      setShowProvinceSuggestions(true);
      return;
    }

    const provinces = locationService.getProvinces();
    const filtered = provinces.filter((prov) =>
      prov.name.toLowerCase().includes(query.toLowerCase())
    );

    setProvinceSuggestions(filtered);
    setShowProvinceSuggestions(true);
  };

  // Real GeoNames search for municipalities
  const handleMunicipalitySearch = async (query: string) => {
    if (query.length < 2) {
      setMunicipalitySuggestions([]);
      setShowMunicipalitySuggestions(false);
      return;
    }

    setIsLoadingMunicipalities(true);
    try {
      const results = await locationService.searchMunicipalities(query);
      setMunicipalitySuggestions(results);
      setShowMunicipalitySuggestions(true);
    } catch (error) {
      console.error("Municipality search error:", error);
      setMunicipalitySuggestions([]);
    } finally {
      setIsLoadingMunicipalities(false);
    }
  };

  // Real Overpass API search for communities
  const handleCommunitySearch = async (query: string) => {
    if (query.length < 2) {
      setCommunitySuggestions([]);
      setShowCommunitySuggestions(false);
      return;
    }

    setIsLoadingCommunities(true);
    try {
      const results = await locationService.searchCommunities(query);
      setCommunitySuggestions(results);
      setShowCommunitySuggestions(true);
    } catch (error) {
      console.error("Community search error:", error);
      setCommunitySuggestions([]);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Handle province selection - load municipalities for that province
  const handleProvinceSelect = async (selectedProvince: string) => {
    setProvince(selectedProvince);
    setMunicipality(""); // Clear municipality when province changes
    setCommunity(""); // Clear community when province changes
    setShowProvinceSuggestions(false);

    // Load municipalities for the selected province
    if (selectedProvince) {
      setIsLoadingMunicipalities(true);
      try {
        const municipalities =
          await locationService.getMunicipalitiesByProvince(selectedProvince);
        setMunicipalitySuggestions(municipalities);
      } catch (error) {
        console.error("Error loading municipalities:", error);

        // Fallback to static data if API fails
        const fallbackMunicipalities =
          getFallbackMunicipalities(selectedProvince);
        setMunicipalitySuggestions(fallbackMunicipalities);

        // Show error message to user
        console.warn(
          `GeoNames API failed, using fallback data for ${selectedProvince}`
        );
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
        const communities = await locationService.getCommunitiesInMunicipality(
          selectedMunicipality
        );
        setCommunitySuggestions(communities);
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
      province,
      municipality,
      community,
    };
    onFiltersChange(filters);
  };

  const handleClear = () => {
    setProvince("");
    setMunicipality("");
    setCommunity("");
    setProvinceSuggestions([]);
    setMunicipalitySuggestions([]);
    setCommunitySuggestions([]);
    setShowProvinceSuggestions(false);
    setShowMunicipalitySuggestions(false);
    setShowCommunitySuggestions(false);
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Zone Filters</h3>
          <Search className="w-5 h-5 text-gray-500" />
        </div>

        {/* Simple Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Province - Canada Only */}
          <div className="space-y-2">
            <Label htmlFor="province">Province (Canada Only)</Label>
            <div className="relative">
              <Input
                id="province"
                placeholder="Search Canadian provinces..."
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  handleProvinceSearch(e.target.value);
                }}
                onFocus={() => {
                  if (provinceSuggestions.length > 0) {
                    setShowProvinceSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicking on them
                  setTimeout(() => setShowProvinceSuggestions(false), 200);
                }}
                className="w-full"
              />
              {showProvinceSuggestions && provinceSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {provinceSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleProvinceSelect(suggestion.name)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-gray-500">
                          {suggestion.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Canadian provinces and territories only
            </p>
          </div>

          {/* Municipality (GeoNames search) */}
          <div className="space-y-2">
            <Label htmlFor="municipality">Municipality</Label>
            <div className="relative">
              <Input
                id="municipality"
                placeholder={
                  province
                    ? `Search municipalities in ${province}...`
                    : "Select a province first"
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
                  // Delay hiding suggestions to allow clicking on them
                  setTimeout(() => setShowMunicipalitySuggestions(false), 200);
                }}
                className="w-full"
                disabled={!province}
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
                            {suggestion.placeType}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <p className="text-xs text-gray-500">
              {province
                ? `GeoNames search results for ${province}`
                : "Select a province to search municipalities"}
            </p>
          </div>

          {/* Community (Overpass results) */}
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
                  // Delay hiding suggestions to allow clicking on them
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
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-gray-500">
                          {suggestion.placeType}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {municipality
                ? `Overpass API results for ${municipality}`
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
      </div>
    </div>
  );
}
