/**
 * Combined Location Service
 *
 * Integrates GeoNames and Overpass APIs for comprehensive Canadian location search
 */

import { geoNamesService, MunicipalitySearchResult } from "./geoNamesService";
import { overpassService, CommunityResult } from "./overpassService";
import { CANADIAN_PROVINCES } from "./geoNamesConfig";

export interface LocationSearchResult {
  name: string;
  type: "province" | "municipality" | "community";
  province?: string;
  lat?: number;
  lng?: number;
  id?: number;
  population?: number;
  placeType?: string;
}

export interface CascadingSearchState {
  selectedProvince: string;
  selectedMunicipality: string;
  selectedCommunity: string;
  municipalities: MunicipalitySearchResult[];
  communities: CommunityResult[];
}

class LocationService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or fetch if expired
   */
  private getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return Promise.resolve(cached.data);
    }

    return fetchFn().then((data) => {
      this.cache.set(key, {
        data,
        timestamp: now,
      });
      return data;
    });
  }

  /**
   * Get all Canadian provinces (static data)
   */
  getProvinces(): LocationSearchResult[] {
    return CANADIAN_PROVINCES.map((province) => ({
      name: province.name,
      type: "province" as const,
      id: parseInt(province.code, 36), // Simple hash
    }));
  }

  /**
   * Search municipalities by query
   */
  async searchMunicipalities(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `municipalities:${query}`;

    return this.getCachedData(cacheKey, async () => {
      const results = await geoNamesService.searchMunicipalities(query);

      return results.map((municipality) => ({
        name: municipality.name,
        type: "municipality" as const,
        province: municipality.province,
        lat: municipality.lat,
        lng: municipality.lng,
        id: municipality.geonameId,
        population: municipality.population,
        placeType: municipality.type,
      }));
    });
  }

  /**
   * Get municipalities by province
   */
  async getMunicipalitiesByProvince(
    provinceName: string
  ): Promise<LocationSearchResult[]> {
    const cacheKey = `municipalities:province:${provinceName}`;

    return this.getCachedData(cacheKey, async () => {
      const results = await geoNamesService.getMunicipalitiesByProvince(
        provinceName
      );

      return results.map((municipality) => ({
        name: municipality.name,
        type: "municipality" as const,
        province: municipality.province,
        lat: municipality.lat,
        lng: municipality.lng,
        id: municipality.geonameId,
        population: municipality.population,
        placeType: municipality.type,
      }));
    });
  }

  /**
   * Get communities within a municipality
   */
  async getCommunitiesInMunicipality(
    municipalityName: string
  ): Promise<LocationSearchResult[]> {
    const cacheKey = `communities:municipality:${municipalityName}`;

    return this.getCachedData(cacheKey, async () => {
      const results = await overpassService.getCommunitiesInMunicipality(
        municipalityName
      );

      return results.map((community) => ({
        name: community.name,
        type: "community" as const,
        lat: community.lat,
        lng: community.lng,
        id: community.id,
        placeType: community.placeType,
      }));
    });
  }

  /**
   * Search communities by query (fallback)
   */
  async searchCommunities(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `communities:search:${query}`;

    return this.getCachedData(cacheKey, async () => {
      const results = await overpassService.searchPlaces(
        query,
        "neighbourhood"
      );

      return results.map((community) => ({
        name: community.name,
        type: "community" as const,
        lat: community.lat,
        lng: community.lng,
        id: community.id,
        placeType: community.placeType,
      }));
    });
  }

  /**
   * Get cascading search results
   */
  async getCascadingResults(
    province?: string,
    municipality?: string,
    communityQuery?: string
  ): Promise<CascadingSearchState> {
    const state: CascadingSearchState = {
      selectedProvince: province || "",
      selectedMunicipality: municipality || "",
      selectedCommunity: "",
      municipalities: [],
      communities: [],
    };

    // Get municipalities if province is selected
    if (province) {
      const municipalities = await this.getMunicipalitiesByProvince(province);
      state.municipalities = municipalities.map((m) => ({
        name: m.name,
        province: m.province!,
        lat: m.lat!,
        lng: m.lng!,
        geonameId: m.id!,
        population: m.population,
        type: m.placeType!,
      }));
    }

    // Get communities if municipality is selected
    if (municipality) {
      const communities = await this.getCommunitiesInMunicipality(municipality);
      state.communities = communities.map((c) => ({
        id: c.id!,
        name: c.name,
        type: "node" as const,
        lat: c.lat!,
        lng: c.lng!,
        placeType: c.placeType!,
      }));
    }

    return state;
  }

  /**
   * Test all API connections
   */
  async testConnections(): Promise<{
    geoNames: boolean;
    overpass: boolean;
  }> {
    const [geoNames, overpass] = await Promise.all([
      geoNamesService.testConnection(),
      overpassService.testConnection(),
    ]);

    return { geoNames, overpass };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const locationService = new LocationService();
