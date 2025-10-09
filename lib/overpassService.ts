/**
 * Overpass API Service
 *
 * Handles interactions with OpenStreetMap Overpass API for community/neighbourhood data
 */

import { OVERPASS_CONFIG, RATE_LIMITS } from "./geoNamesConfig";

export interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: {
    name?: string;
    place?: string;
    [key: string]: string | undefined;
  };
}

export interface CommunityResult {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  placeType: string;
}

class OverpassService {
  private baseUrl = OVERPASS_CONFIG.BASE_URL;
  private lastRequestTime = 0;

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMITS.OVERPASS.REQUEST_DELAY) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          RATE_LIMITS.OVERPASS.REQUEST_DELAY - timeSinceLastRequest
        )
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Find communities/neighbourhoods within a municipality
   */
  async getCommunitiesInMunicipality(
    municipalityName: string
  ): Promise<CommunityResult[]> {
    await this.rateLimit();

    try {
      // Replace placeholder in query template
      const query =
        OVERPASS_CONFIG.QUERIES.NEIGHBOURHOODS_IN_MUNICIPALITY.replace(
          "{{municipalityName}}",
          municipalityName
        );

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: query,
        signal: AbortSignal.timeout(RATE_LIMITS.OVERPASS.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements) {
        return [];
      }

      // Filter and format results
      return data.elements
        .filter(
          (element: OverpassElement) =>
            element.tags?.name &&
            element.tags?.place &&
            ["neighbourhood", "suburb", "quarter", "hamlet"].includes(
              element.tags.place
            )
        )
        .map((element: OverpassElement) => ({
          id: element.id,
          name: element.tags.name!,
          type: element.type,
          lat: element.lat || element.center?.lat || 0,
          lng: element.lon || element.center?.lon || 0,
          placeType: element.tags.place!,
        }))
        .sort((a: CommunityResult, b: CommunityResult) =>
          a.name.localeCompare(b.name)
        ); // Sort alphabetically
    } catch (error) {
      console.error("Overpass query error:", error);
      return [];
    }
  }

  /**
   * Find municipalities within a province
   */
  async getMunicipalitiesInProvince(
    provinceName: string
  ): Promise<CommunityResult[]> {
    await this.rateLimit();

    try {
      // Replace placeholder in query template
      const query = OVERPASS_CONFIG.QUERIES.MUNICIPALITIES_IN_PROVINCE.replace(
        "{{provinceName}}",
        provinceName
      );

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: query,
        signal: AbortSignal.timeout(RATE_LIMITS.OVERPASS.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements) {
        return [];
      }

      return data.elements
        .filter(
          (element: OverpassElement) =>
            element.tags?.name &&
            element.tags?.place &&
            ["city", "town", "village"].includes(element.tags.place)
        )
        .map((element: OverpassElement) => ({
          id: element.id,
          name: element.tags.name!,
          type: element.type,
          lat: element.lat || element.center?.lat || 0,
          lng: element.lon || element.center?.lon || 0,
          placeType: element.tags.place!,
        }))
        .sort((a: CommunityResult, b: CommunityResult) =>
          a.name.localeCompare(b.name)
        );
    } catch (error) {
      console.error("Overpass province query error:", error);
      return [];
    }
  }

  /**
   * Search for places by name (fallback search)
   */
  async searchPlaces(
    query: string,
    placeType: string = "neighbourhood"
  ): Promise<CommunityResult[]> {
    await this.rateLimit();

    try {
      const searchQuery = `
        [out:json][timeout:25];
        (
          node["name"~"${query}",i]["place"="${placeType}"];
          way["name"~"${query}",i]["place"="${placeType}"];
          relation["name"~"${query}",i]["place"="${placeType}"];
        );
        out center tags;
      `;

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: searchQuery,
        signal: AbortSignal.timeout(RATE_LIMITS.OVERPASS.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements) {
        return [];
      }

      return data.elements
        .filter((element: OverpassElement) => element.tags?.name)
        .map((element: OverpassElement) => ({
          id: element.id,
          name: element.tags.name!,
          type: element.type,
          lat: element.lat || element.center?.lat || 0,
          lng: element.lon || element.center?.lon || 0,
          placeType: element.tags.place || placeType,
        }))
        .slice(0, 10) // Limit results
        .sort((a: CommunityResult, b: CommunityResult) =>
          a.name.localeCompare(b.name)
        );
    } catch (error) {
      console.error("Overpass search error:", error);
      return [];
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getCommunitiesInMunicipality("Toronto");
      return Array.isArray(result);
    } catch (error) {
      console.error("Overpass connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const overpassService = new OverpassService();
