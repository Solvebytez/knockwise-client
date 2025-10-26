/**
 * GeoNames API Service
 *
 * Handles all interactions with the GeoNames API for Canadian location data
 */

import { GEONAMES_CONFIG, RATE_LIMITS } from "./geoNamesConfig";

export interface GeoNamesResult {
  geonameId: number;
  name: string;
  countryName: string;
  adminName1: string; // Province
  adminName2?: string; // County/Region
  lat: string;
  lng: string;
  population?: number;
  fcode: string; // Feature code
  fcl: string; // Feature class
}

export interface MunicipalitySearchResult {
  name: string;
  province: string;
  lat: number;
  lng: number;
  geonameId: number;
  population?: number;
  type: string;
}

class GeoNamesService {
  private baseUrl = GEONAMES_CONFIG.BASE_URL;
  private username = GEONAMES_CONFIG.USERNAME;
  private lastRequestTime = 0;

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMITS.GEONAMES.REQUEST_DELAY) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          RATE_LIMITS.GEONAMES.REQUEST_DELAY - timeSinceLastRequest
        )
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for Canadian municipalities by name
   */
  async searchMunicipalities(
    query: string
  ): Promise<MunicipalitySearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    await this.rateLimit();

    try {
      const params = new URLSearchParams({
        name_startsWith: query,
        country: GEONAMES_CONFIG.SEARCH_PARAMS.COUNTRY,
        featureClass: GEONAMES_CONFIG.SEARCH_PARAMS.FEATURE_CLASS,
        maxRows: GEONAMES_CONFIG.SEARCH_PARAMS.MAX_ROWS.toString(),
        orderby: GEONAMES_CONFIG.SEARCH_PARAMS.ORDER_BY,
        style: GEONAMES_CONFIG.SEARCH_PARAMS.STYLE,
        username: this.username,
      });

      const url = `${this.baseUrl}${GEONAMES_CONFIG.ENDPOINTS.SEARCH}?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            `GeoNames API authentication failed. Please check your username: ${this.username}`
          );
        }
        throw new Error(
          `GeoNames API error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.geonames) {
        return [];
      }

      // Filter and format results
      return data.geonames
        .filter(
          (place: GeoNamesResult) =>
            place.countryName === "Canada" &&
            place.adminName1 && // Must have province
            (place.fcode === "PPL" ||
              place.fcode === "PPLA" ||
              place.fcode === "PPLA2") // Cities, towns, villages
        )
        .map((place: GeoNamesResult) => ({
          name: place.name,
          province: place.adminName1,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lng),
          geonameId: place.geonameId,
          population: place.population,
          type: this.getPlaceType(place.fcode),
        }))
        .sort((a, b) => (b.population || 0) - (a.population || 0)); // Sort by population
    } catch (error) {
      console.error("GeoNames search error:", error);
      return [];
    }
  }

  /**
   * Get municipalities by province
   */
  async getMunicipalitiesByProvince(
    provinceName: string
  ): Promise<MunicipalitySearchResult[]> {
    await this.rateLimit();

    try {
      const params = new URLSearchParams({
        country: GEONAMES_CONFIG.SEARCH_PARAMS.COUNTRY,
        adminName1: provinceName,
        featureClass: GEONAMES_CONFIG.SEARCH_PARAMS.FEATURE_CLASS,
        maxRows: "50", // More results for province-wide search
        orderby: GEONAMES_CONFIG.SEARCH_PARAMS.ORDER_BY,
        style: GEONAMES_CONFIG.SEARCH_PARAMS.STYLE,
        username: this.username,
      });

      const url = `${this.baseUrl}${GEONAMES_CONFIG.ENDPOINTS.SEARCH}?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            `GeoNames API authentication failed. Please check your username: ${this.username}`
          );
        }
        throw new Error(
          `GeoNames API error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.geonames) {
        return [];
      }

      return data.geonames
        .filter(
          (place: GeoNamesResult) =>
            place.countryName === "Canada" &&
            place.adminName1 === provinceName &&
            (place.fcode === "PPL" ||
              place.fcode === "PPLA" ||
              place.fcode === "PPLA2")
        )
        .map((place: GeoNamesResult) => ({
          name: place.name,
          province: place.adminName1,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lng),
          geonameId: place.geonameId,
          population: place.population,
          type: this.getPlaceType(place.fcode),
        }))
        .sort((a, b) => (b.population || 0) - (a.population || 0));
    } catch (error) {
      console.error("GeoNames province search error:", error);
      return [];
    }
  }

  /**
   * Get place type from feature code
   */
  private getPlaceType(fcode: string): string {
    const typeMap: { [key: string]: string } = {
      PPL: "Town",
      PPLA: "City",
      PPLA2: "City",
      PPLA3: "Village",
      PPLA4: "Hamlet",
      PPLC: "Capital",
    };

    return typeMap[fcode] || "Place";
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.searchMunicipalities("Toronto");
      return result.length > 0;
    } catch (error) {
      console.error("GeoNames connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const geoNamesService = new GeoNamesService();
