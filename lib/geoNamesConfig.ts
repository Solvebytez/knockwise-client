/**
 * GeoNames API Configuration
 *
 * To get started:
 * 1. Register at: http://www.geonames.org/login
 * 2. Get your username from your account
 * 3. Add NEXT_PUBLIC_GEONAMES_USERNAME to your .env.local file
 *
 * Free tier: 1000 requests per day
 */

export const GEONAMES_CONFIG = {
  // Base URL for GeoNames API
  BASE_URL: "https://secure.geonames.org",

  // Your username (set in environment variables)
  // Note: Using 'demo' for free access (limited but works)
  USERNAME: process.env.NEXT_PUBLIC_GEONAMES_USERNAME || "demo",

  // API endpoints
  ENDPOINTS: {
    SEARCH: "/searchJSON",
    POSTAL_CODE: "/postalCodeSearchJSON",
    NEIGHBOURS: "/neighboursJSON",
    CHILDREN: "/childrenJSON",
  },

  // Search parameters for Canadian municipalities
  SEARCH_PARAMS: {
    COUNTRY: "CA", // Canada
    FEATURE_CLASS: "P", // Populated places (cities, towns, villages)
    MAX_ROWS: 10,
    ORDER_BY: "population",
    STYLE: "FULL",
  },
};

/**
 * Overpass API Configuration
 *
 * Public instance: https://overpass-api.de/api/interpreter
 * No registration required, but has rate limits
 */
export const OVERPASS_CONFIG = {
  // Base URL for Overpass API
  BASE_URL:
    process.env.NEXT_PUBLIC_OVERPASS_API_URL ||
    "https://overpass-api.de/api/interpreter",

  // Query templates for different searches
  QUERIES: {
    // Find neighbourhoods within a municipality
    NEIGHBOURHOODS_IN_MUNICIPALITY: `
      [out:json][timeout:25];
      area[name="{{municipalityName}}"][admin_level=8]->.a;
      (
        node["place"~"neighbourhood|suburb|quarter|hamlet"](area.a);
        way["place"~"neighbourhood|suburb|quarter|hamlet"](area.a);
        relation["place"~"neighbourhood|suburb|quarter|hamlet"](area.a);
      );
      out center tags;
    `,

    // Find municipalities in a province
    MUNICIPALITIES_IN_PROVINCE: `
      [out:json][timeout:25];
      area[name="{{provinceName}}"][admin_level=4]->.a;
      (
        node["place"~"city|town|village"](area.a);
        way["place"~"city|town|village"](area.a);
        relation["place"~"city|town|village"](area.a);
      );
      out center tags;
    `,
  },
};

/**
 * Canadian Provinces and Territories
 * Static data for initial dropdown
 */
export const CANADIAN_PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "QC", name: "Quebec" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "MB", name: "Manitoba" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "NT", name: "Northwest Territories" },
  { code: "YT", name: "Yukon" },
  { code: "NU", name: "Nunavut" },
];

/**
 * API Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  GEONAMES: {
    FREE_TIER: 1000, // requests per day
    REQUEST_DELAY: 100, // ms between requests
  },
  OVERPASS: {
    REQUEST_DELAY: 1000, // ms between requests
    TIMEOUT: 25000, // ms
  },
};
