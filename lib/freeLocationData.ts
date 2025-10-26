/**
 * Free Canadian Location Data
 *
 * Mimics TRREB structure using open data sources:
 * - Statistics Canada boundaries
 * - OpenStreetMap neighbourhoods
 * - Free GeoNames data
 */

export interface FreeLocationResult {
  name: string;
  type: "region" | "area" | "municipality" | "community";
  code?: string;
  parent?: string;
  lat?: number;
  lng?: number;
  source: "stats_can" | "osm" | "geonames" | "static";
}

// Canadian Regions (Provinces/Territories)
export const CANADIAN_REGIONS: FreeLocationResult[] = [
  { name: "Ontario", type: "region", code: "ON", source: "static" },
  { name: "Quebec", type: "region", code: "QC", source: "static" },
  { name: "British Columbia", type: "region", code: "BC", source: "static" },
  { name: "Alberta", type: "region", code: "AB", source: "static" },
  { name: "Manitoba", type: "region", code: "MB", source: "static" },
  { name: "Saskatchewan", type: "region", code: "SK", source: "static" },
  { name: "Nova Scotia", type: "region", code: "NS", source: "static" },
  { name: "New Brunswick", type: "region", code: "NB", source: "static" },
  {
    name: "Newfoundland and Labrador",
    type: "region",
    code: "NL",
    source: "static",
  },
  {
    name: "Prince Edward Island",
    type: "region",
    code: "PE",
    source: "static",
  },
  {
    name: "Northwest Territories",
    type: "region",
    code: "NT",
    source: "static",
  },
  { name: "Nunavut", type: "region", code: "NU", source: "static" },
  { name: "Yukon", type: "region", code: "YT", source: "static" },
];

// Areas by Region (Regional Municipalities/Counties)
export const AREAS_BY_REGION: { [regionCode: string]: FreeLocationResult[] } = {
  ON: [
    {
      name: "Greater Toronto Area",
      type: "area",
      code: "GTA",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Peel Region",
      type: "area",
      code: "PEEL",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "York Region",
      type: "area",
      code: "YORK",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Durham Region",
      type: "area",
      code: "DURHAM",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Halton Region",
      type: "area",
      code: "HALTON",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Hamilton-Wentworth",
      type: "area",
      code: "HAMILTON",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Niagara Region",
      type: "area",
      code: "NIAGARA",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Waterloo Region",
      type: "area",
      code: "WATERLOO",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Wellington County",
      type: "area",
      code: "WELLINGTON",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Simcoe County",
      type: "area",
      code: "SIMCOE",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Ottawa",
      type: "area",
      code: "OTTAWA",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "London",
      type: "area",
      code: "LONDON",
      parent: "Ontario",
      source: "static",
    },
    {
      name: "Windsor-Essex",
      type: "area",
      code: "WINDSOR",
      parent: "Ontario",
      source: "static",
    },
  ],
  QC: [
    {
      name: "Montreal",
      type: "area",
      code: "MONTREAL",
      parent: "Quebec",
      source: "static",
    },
    {
      name: "Quebec City",
      type: "area",
      code: "QUEBEC",
      parent: "Quebec",
      source: "static",
    },
    {
      name: "Laval",
      type: "area",
      code: "LAVAL",
      parent: "Quebec",
      source: "static",
    },
    {
      name: "Gatineau",
      type: "area",
      code: "GATINEAU",
      parent: "Quebec",
      source: "static",
    },
    {
      name: "Longueuil",
      type: "area",
      code: "LONGUEUIL",
      parent: "Quebec",
      source: "static",
    },
    {
      name: "Sherbrooke",
      type: "area",
      code: "SHERBROOKE",
      parent: "Quebec",
      source: "static",
    },
  ],
  BC: [
    {
      name: "Greater Vancouver",
      type: "area",
      code: "VANCOUVER",
      parent: "British Columbia",
      source: "static",
    },
    {
      name: "Victoria",
      type: "area",
      code: "VICTORIA",
      parent: "British Columbia",
      source: "static",
    },
    {
      name: "Kelowna",
      type: "area",
      code: "KELOWNA",
      parent: "British Columbia",
      source: "static",
    },
    {
      name: "Abbotsford",
      type: "area",
      code: "ABBOTSFORD",
      parent: "British Columbia",
      source: "static",
    },
  ],
  AB: [
    {
      name: "Calgary",
      type: "area",
      code: "CALGARY",
      parent: "Alberta",
      source: "static",
    },
    {
      name: "Edmonton",
      type: "area",
      code: "EDMONTON",
      parent: "Alberta",
      source: "static",
    },
    {
      name: "Red Deer",
      type: "area",
      code: "REDDEER",
      parent: "Alberta",
      source: "static",
    },
    {
      name: "Lethbridge",
      type: "area",
      code: "LETHBRIDGE",
      parent: "Alberta",
      source: "static",
    },
  ],
};

// Municipalities by Area (Statistics Canada Census Subdivisions)
export const MUNICIPALITIES_BY_AREA: {
  [areaCode: string]: FreeLocationResult[];
} = {
  GTA: [
    {
      name: "Toronto",
      type: "municipality",
      code: "TOR",
      parent: "GTA",
      lat: 43.6532,
      lng: -79.3832,
      source: "stats_can",
    },
    {
      name: "Mississauga",
      type: "municipality",
      code: "MISS",
      parent: "PEEL",
      lat: 43.589,
      lng: -79.6441,
      source: "stats_can",
    },
    {
      name: "Brampton",
      type: "municipality",
      code: "BRAM",
      parent: "PEEL",
      lat: 43.6834,
      lng: -79.7663,
      source: "stats_can",
    },
    {
      name: "Markham",
      type: "municipality",
      code: "MARK",
      parent: "YORK",
      lat: 43.8668,
      lng: -79.2663,
      source: "stats_can",
    },
    {
      name: "Vaughan",
      type: "municipality",
      code: "VAUG",
      parent: "YORK",
      lat: 43.8361,
      lng: -79.4983,
      source: "stats_can",
    },
    {
      name: "Richmond Hill",
      type: "municipality",
      code: "RICH",
      parent: "YORK",
      lat: 43.8828,
      lng: -79.4403,
      source: "stats_can",
    },
    {
      name: "Oakville",
      type: "municipality",
      code: "OAK",
      parent: "HALTON",
      lat: 43.4675,
      lng: -79.6877,
      source: "stats_can",
    },
    {
      name: "Burlington",
      type: "municipality",
      code: "BURL",
      parent: "HALTON",
      lat: 43.3255,
      lng: -79.799,
      source: "stats_can",
    },
    {
      name: "Ajax",
      type: "municipality",
      code: "AJAX",
      parent: "DURHAM",
      lat: 43.8501,
      lng: -79.0329,
      source: "stats_can",
    },
    {
      name: "Pickering",
      type: "municipality",
      code: "PICK",
      parent: "DURHAM",
      lat: 43.8361,
      lng: -79.0863,
      source: "stats_can",
    },
  ],
  PEEL: [
    {
      name: "Mississauga",
      type: "municipality",
      code: "MISS",
      parent: "PEEL",
      lat: 43.589,
      lng: -79.6441,
      source: "stats_can",
    },
    {
      name: "Brampton",
      type: "municipality",
      code: "BRAM",
      parent: "PEEL",
      lat: 43.6834,
      lng: -79.7663,
      source: "stats_can",
    },
    {
      name: "Caledon",
      type: "municipality",
      code: "CAL",
      parent: "PEEL",
      lat: 43.8668,
      lng: -79.8663,
      source: "stats_can",
    },
  ],
  YORK: [
    {
      name: "Markham",
      type: "municipality",
      code: "MARK",
      parent: "YORK",
      lat: 43.8668,
      lng: -79.2663,
      source: "stats_can",
    },
    {
      name: "Vaughan",
      type: "municipality",
      code: "VAUG",
      parent: "YORK",
      lat: 43.8361,
      lng: -79.4983,
      source: "stats_can",
    },
    {
      name: "Richmond Hill",
      type: "municipality",
      code: "RICH",
      parent: "YORK",
      lat: 43.8828,
      lng: -79.4403,
      source: "stats_can",
    },
    {
      name: "Newmarket",
      type: "municipality",
      code: "NEW",
      parent: "YORK",
      lat: 44.0501,
      lng: -79.4663,
      source: "stats_can",
    },
    {
      name: "Aurora",
      type: "municipality",
      code: "AUR",
      parent: "YORK",
      lat: 44.0001,
      lng: -79.4663,
      source: "stats_can",
    },
    {
      name: "Whitchurch-Stouffville",
      type: "municipality",
      code: "WS",
      parent: "YORK",
      lat: 43.9668,
      lng: -79.2663,
      source: "stats_can",
    },
  ],
  HALTON: [
    {
      name: "Oakville",
      type: "municipality",
      code: "OAK",
      parent: "HALTON",
      lat: 43.4675,
      lng: -79.6877,
      source: "stats_can",
    },
    {
      name: "Burlington",
      type: "municipality",
      code: "BURL",
      parent: "HALTON",
      lat: 43.3255,
      lng: -79.799,
      source: "stats_can",
    },
    {
      name: "Milton",
      type: "municipality",
      code: "MIL",
      parent: "HALTON",
      lat: 43.5168,
      lng: -79.8663,
      source: "stats_can",
    },
    {
      name: "Halton Hills",
      type: "municipality",
      code: "HH",
      parent: "HALTON",
      lat: 43.6168,
      lng: -79.9663,
      source: "stats_can",
    },
  ],
  DURHAM: [
    {
      name: "Ajax",
      type: "municipality",
      code: "AJAX",
      parent: "DURHAM",
      lat: 43.8501,
      lng: -79.0329,
      source: "stats_can",
    },
    {
      name: "Pickering",
      type: "municipality",
      code: "PICK",
      parent: "DURHAM",
      lat: 43.8361,
      lng: -79.0863,
      source: "stats_can",
    },
    {
      name: "Whitby",
      type: "municipality",
      code: "WHIT",
      parent: "DURHAM",
      lat: 43.8975,
      lng: -78.9441,
      source: "stats_can",
    },
    {
      name: "Oshawa",
      type: "municipality",
      code: "OSH",
      parent: "DURHAM",
      lat: 43.8975,
      lng: -78.8663,
      source: "stats_can",
    },
    {
      name: "Clarington",
      type: "municipality",
      code: "CLAR",
      parent: "DURHAM",
      lat: 43.9168,
      lng: -78.6663,
      source: "stats_can",
    },
  ],
};

// Communities by Municipality (OpenStreetMap neighbourhoods)
export const COMMUNITIES_BY_MUNICIPALITY: {
  [municipalityCode: string]: FreeLocationResult[];
} = {
  TOR: [
    // Downtown Toronto
    {
      name: "Downtown Toronto",
      type: "community",
      parent: "Toronto",
      lat: 43.6532,
      lng: -79.3832,
      source: "osm",
    },
    {
      name: "Financial District",
      type: "community",
      parent: "Toronto",
      lat: 43.65,
      lng: -79.38,
      source: "osm",
    },
    {
      name: "Entertainment District",
      type: "community",
      parent: "Toronto",
      lat: 43.65,
      lng: -79.39,
      source: "osm",
    },
    {
      name: "Distillery District",
      type: "community",
      parent: "Toronto",
      lat: 43.66,
      lng: -79.36,
      source: "osm",
    },
    {
      name: "St. Lawrence",
      type: "community",
      parent: "Toronto",
      lat: 43.65,
      lng: -79.37,
      source: "osm",
    },

    // East Toronto
    {
      name: "Leslieville",
      type: "community",
      parent: "Toronto",
      lat: 43.6615,
      lng: -79.3277,
      source: "osm",
    },
    {
      name: "The Beaches",
      type: "community",
      parent: "Toronto",
      lat: 43.6715,
      lng: -79.2977,
      source: "osm",
    },
    {
      name: "East York",
      type: "community",
      parent: "Toronto",
      lat: 43.6905,
      lng: -79.3277,
      source: "osm",
    },
    {
      name: "Riverdale",
      type: "community",
      parent: "Toronto",
      lat: 43.66,
      lng: -79.33,
      source: "osm",
    },
    {
      name: "Danforth",
      type: "community",
      parent: "Toronto",
      lat: 43.68,
      lng: -79.32,
      source: "osm",
    },

    // West Toronto
    {
      name: "High Park",
      type: "community",
      parent: "Toronto",
      lat: 43.6515,
      lng: -79.4677,
      source: "osm",
    },
    {
      name: "Roncesvalles",
      type: "community",
      parent: "Toronto",
      lat: 43.6515,
      lng: -79.4377,
      source: "osm",
    },
    {
      name: "Etobicoke",
      type: "community",
      parent: "Toronto",
      lat: 43.6435,
      lng: -79.5656,
      source: "osm",
    },
    {
      name: "Bloor West Village",
      type: "community",
      parent: "Toronto",
      lat: 43.66,
      lng: -79.45,
      source: "osm",
    },
    {
      name: "Junction",
      type: "community",
      parent: "Toronto",
      lat: 43.66,
      lng: -79.47,
      source: "osm",
    },

    // North Toronto
    {
      name: "North York",
      type: "community",
      parent: "Toronto",
      lat: 43.7615,
      lng: -79.4111,
      source: "osm",
    },
    {
      name: "York",
      type: "community",
      parent: "Toronto",
      lat: 43.6855,
      lng: -79.4561,
      source: "osm",
    },
    {
      name: "Yorkville",
      type: "community",
      parent: "Toronto",
      lat: 43.67,
      lng: -79.39,
      source: "osm",
    },
    {
      name: "Annex",
      type: "community",
      parent: "Toronto",
      lat: 43.67,
      lng: -79.4,
      source: "osm",
    },
    {
      name: "Casa Loma",
      type: "community",
      parent: "Toronto",
      lat: 43.68,
      lng: -79.41,
      source: "osm",
    },

    // Scarborough
    {
      name: "Scarborough",
      type: "community",
      parent: "Toronto",
      lat: 43.7731,
      lng: -79.2578,
      source: "osm",
    },
    {
      name: "Scarborough Village",
      type: "community",
      parent: "Toronto",
      lat: 43.77,
      lng: -79.26,
      source: "osm",
    },
    {
      name: "Agincourt",
      type: "community",
      parent: "Toronto",
      lat: 43.78,
      lng: -79.28,
      source: "osm",
    },
    {
      name: "Malvern",
      type: "community",
      parent: "Toronto",
      lat: 43.8,
      lng: -79.25,
      source: "osm",
    },
    {
      name: "Rouge",
      type: "community",
      parent: "Toronto",
      lat: 43.82,
      lng: -79.2,
      source: "osm",
    },
  ],
  BRAM: [
    // North Brampton Communities
    {
      name: "Sandringham-Wellington North",
      type: "community",
      parent: "Brampton",
      lat: 43.8,
      lng: -79.8,
      source: "osm",
    },
    {
      name: "Heart Lake East",
      type: "community",
      parent: "Brampton",
      lat: 43.75,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Downtown Brampton",
      type: "community",
      parent: "Brampton",
      lat: 43.6834,
      lng: -79.7663,
      source: "osm",
    },
    {
      name: "Bramalea",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Heart Lake West",
      type: "community",
      parent: "Brampton",
      lat: 43.75,
      lng: -79.85,
      source: "osm",
    },
    {
      name: "Brampton Central Park",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Westgate",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.8,
      source: "osm",
    },
    {
      name: "Southgate",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.8,
      source: "osm",
    },
    {
      name: "Madoc",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Queen Street Avondale",
      type: "community",
      parent: "Brampton",
      lat: 43.68,
      lng: -79.76,
      source: "osm",
    },
    {
      name: "Brampton North",
      type: "community",
      parent: "Brampton",
      lat: 43.8,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Brampton West",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.9,
      source: "osm",
    },

    // Central Brampton Communities
    {
      name: "Fletcher's Meadow",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Fletcher's Creek Village",
      type: "community",
      parent: "Brampton",
      lat: 43.68,
      lng: -79.73,
      source: "osm",
    },
    {
      name: "Fletcher's West",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Fletcher's Creek South",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.73,
      source: "osm",
    },
    {
      name: "Gage P. Brampton",
      type: "community",
      parent: "Brampton",
      lat: 43.68,
      lng: -79.78,
      source: "osm",
    },
    {
      name: "Downtown Brampton",
      type: "community",
      parent: "Brampton",
      lat: 43.6834,
      lng: -79.7663,
      source: "osm",
    },
    {
      name: "Northwood Park",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.76,
      source: "osm",
    },
    {
      name: "Brampton East",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.65,
      source: "osm",
    },
    {
      name: "Brampton South",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Bram West",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.85,
      source: "osm",
    },

    // South Brampton Communities
    {
      name: "Bramalea",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Springdale",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Sandalwood",
      type: "community",
      parent: "Brampton",
      lat: 43.6,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Castlemore",
      type: "community",
      parent: "Brampton",
      lat: 43.75,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Gore Meadows",
      type: "community",
      parent: "Brampton",
      lat: 43.8,
      lng: -79.6,
      source: "osm",
    },

    // Industrial Areas
    {
      name: "West Wood Industrial",
      type: "community",
      parent: "Brampton",
      lat: 43.8,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Gore Industrial North",
      type: "community",
      parent: "Brampton",
      lat: 43.8,
      lng: -79.65,
      source: "osm",
    },
    {
      name: "Bramalea North Industrial",
      type: "community",
      parent: "Brampton",
      lat: 43.75,
      lng: -79.55,
      source: "osm",
    },
    {
      name: "Gore Industrial South",
      type: "community",
      parent: "Brampton",
      lat: 43.75,
      lng: -79.5,
      source: "osm",
    },
    {
      name: "Bramalea Parkway South Industrial",
      type: "community",
      parent: "Brampton",
      lat: 43.7,
      lng: -79.5,
      source: "osm",
    },
    {
      name: "Steeles Industrial",
      type: "community",
      parent: "Brampton",
      lat: 43.65,
      lng: -79.5,
      source: "osm",
    },
  ],
  MISS: [
    {
      name: "Erin Mills",
      type: "community",
      parent: "Mississauga",
      lat: 43.589,
      lng: -79.6441,
      source: "osm",
    },
    {
      name: "Port Credit",
      type: "community",
      parent: "Mississauga",
      lat: 43.55,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Malton",
      type: "community",
      parent: "Mississauga",
      lat: 43.7,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Meadowvale",
      type: "community",
      parent: "Mississauga",
      lat: 43.6,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Streetsville",
      type: "community",
      parent: "Mississauga",
      lat: 43.6,
      lng: -79.75,
      source: "osm",
    },
    {
      name: "Clarkson",
      type: "community",
      parent: "Mississauga",
      lat: 43.55,
      lng: -79.65,
      source: "osm",
    },
    {
      name: "Lorne Park",
      type: "community",
      parent: "Mississauga",
      lat: 43.55,
      lng: -79.7,
      source: "osm",
    },
    {
      name: "Applewood",
      type: "community",
      parent: "Mississauga",
      lat: 43.6,
      lng: -79.65,
      source: "osm",
    },
  ],
  MARK: [
    {
      name: "Unionville",
      type: "community",
      parent: "Markham",
      lat: 43.8668,
      lng: -79.2663,
      source: "osm",
    },
    {
      name: "Thornhill",
      type: "community",
      parent: "Markham",
      lat: 43.8,
      lng: -79.4,
      source: "osm",
    },
    {
      name: "Milliken",
      type: "community",
      parent: "Markham",
      lat: 43.85,
      lng: -79.3,
      source: "osm",
    },
    {
      name: "Markham Village",
      type: "community",
      parent: "Markham",
      lat: 43.8668,
      lng: -79.2663,
      source: "osm",
    },
    {
      name: "Cornell",
      type: "community",
      parent: "Markham",
      lat: 43.9,
      lng: -79.2,
      source: "osm",
    },
    {
      name: "Buttonville",
      type: "community",
      parent: "Markham",
      lat: 43.85,
      lng: -79.4,
      source: "osm",
    },
  ],
  VAUG: [
    {
      name: "Maple",
      type: "community",
      parent: "Vaughan",
      lat: 43.8361,
      lng: -79.4983,
      source: "osm",
    },
    {
      name: "Kleinburg",
      type: "community",
      parent: "Vaughan",
      lat: 43.8,
      lng: -79.6,
      source: "osm",
    },
    {
      name: "Woodbridge",
      type: "community",
      parent: "Vaughan",
      lat: 43.8,
      lng: -79.5,
      source: "osm",
    },
    {
      name: "Thornhill",
      type: "community",
      parent: "Vaughan",
      lat: 43.8,
      lng: -79.4,
      source: "osm",
    },
    {
      name: "Concord",
      type: "community",
      parent: "Vaughan",
      lat: 43.8,
      lng: -79.45,
      source: "osm",
    },
    {
      name: "Vellore Village",
      type: "community",
      parent: "Vaughan",
      lat: 43.85,
      lng: -79.5,
      source: "osm",
    },
  ],
};

/**
 * Get all regions (provinces/territories)
 */
export function getRegions(): FreeLocationResult[] {
  return CANADIAN_REGIONS;
}

/**
 * Get areas by region
 */
export function getAreasByRegion(regionCode: string): FreeLocationResult[] {
  return AREAS_BY_REGION[regionCode] || [];
}

/**
 * Get municipalities by area
 */
export function getMunicipalitiesByArea(
  areaCode: string
): FreeLocationResult[] {
  return MUNICIPALITIES_BY_AREA[areaCode] || [];
}

/**
 * Get communities by municipality (Dynamic - fetches from Overpass API)
 */
export async function getCommunitiesByMunicipality(
  municipalityCode: string
): Promise<FreeLocationResult[]> {
  // Try to fetch from Overpass API first
  try {
    const communities = await fetchCommunitiesFromOverpass(municipalityCode);
    if (communities.length > 0) {
      return communities;
    }
  } catch (error) {
    console.warn(
      `Failed to fetch communities for ${municipalityCode} from Overpass API:`,
      error
    );
  }

  // Fallback to static data if API fails
  return COMMUNITIES_BY_MUNICIPALITY[municipalityCode] || [];
}

/**
 * Fetch communities from Overpass API
 */
async function fetchCommunitiesFromOverpass(
  municipalityCode: string
): Promise<FreeLocationResult[]> {
  const municipalityName = getMunicipalityNameByCode(municipalityCode);
  if (!municipalityName) return [];

  // Overpass API query to get neighbourhoods/suburbs in the municipality
  const query = `
    [out:json][timeout:25];
    (
      relation["admin_level"="10"]["name"~"${municipalityName}",i];
      way["place"="suburb"]["name"~"${municipalityName}",i];
      way["place"="neighbourhood"]["name"~"${municipalityName}",i];
      way["place"="quarter"]["name"~"${municipalityName}",i];
    );
    out geom;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  return data.elements
    .filter((element: any) => element.tags && element.tags.name)
    .map((element: any) => ({
      name: element.tags.name,
      type: "community" as const,
      parent: municipalityName,
      lat: element.lat || (element.center && element.center.lat),
      lng: element.lon || (element.center && element.center.lon),
      source: "osm" as const,
    }))
    .slice(0, 50); // Limit to 50 results
}

/**
 * Get municipality name by code (helper function)
 */
function getMunicipalityNameByCode(code: string): string | null {
  const municipalityMap: { [key: string]: string } = {
    TOR: "Toronto",
    BRAM: "Brampton",
    MISS: "Mississauga",
    MARK: "Markham",
    VAUG: "Vaughan",
    RICH: "Richmond Hill",
    OAK: "Oakville",
    BURL: "Burlington",
    AJAX: "Ajax",
    PICK: "Pickering",
    WHIT: "Whitby",
    OSH: "Oshawa",
    CLAR: "Clarington",
    NEW: "Newmarket",
    AUR: "Aurora",
    WS: "Whitchurch-Stouffville",
    MIL: "Milton",
    HH: "Halton Hills",
    CAL: "Caledon",
  };

  return municipalityMap[code] || null;
}

/**
 * Fetch community boundary using Google Places API
 */
export async function fetchCommunityBoundary(
  communityName: string,
  municipalityName?: string
): Promise<CommunityBoundary | null> {
  try {
    // First, search for the place using Google Places API
    const place = await searchPlaceWithGoogle(communityName, municipalityName);

    if (!place) {
      console.warn(`No place found for community: ${communityName}`);
      return null;
    }

    console.log(`Found place for "${communityName}":`, {
      placeId: place.place_id,
      name: place.name,
      types: place.types,
      geometry: place.geometry,
    });

    // Get detailed place information including geometry
    const placeDetails = await getPlaceDetails(place.place_id);

    if (!placeDetails || !placeDetails.geometry) {
      console.warn(`No geometry found for place: ${communityName}`);
      return null;
    }

    // Convert Google Places geometry to our boundary format
    const boundary = convertGooglePlaceToBoundary(placeDetails, communityName);

    if (!boundary) {
      console.warn(`No actual boundary coordinates found for ${communityName}`);
      return null;
    }

    return boundary;
  } catch (error) {
    console.error(`Failed to fetch boundary for ${communityName}:`, error);

    // Fallback: Create a simple polygon around municipality center
    if (municipalityName) {
      console.log(
        `Creating fallback boundary for ${communityName} in ${municipalityName}`
      );
      return createFallbackBoundary(communityName, municipalityName);
    }

    return null;
  }
}

/**
 * Search for a place using our Next.js API route
 */
async function searchPlaceWithGoogle(
  communityName: string,
  municipalityName?: string
): Promise<any | null> {
  try {
    const response = await fetch("/api/places/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        communityName,
        municipalityName,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`Google Places search response:`, {
      status: data.status,
      resultsCount: data.results?.length || 0,
      results:
        data.results?.map((result: any) => ({
          name: result.name,
          place_id: result.place_id,
          types: result.types,
          formatted_address: result.formatted_address,
        })) || [],
    });

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return null;
    }

    // Find the best match (prioritize neighbourhood, sublocality, etc.)
    const bestMatch = findBestGooglePlaceMatch(data.results, communityName);

    return bestMatch;
  } catch (error) {
    console.error("Error searching places:", error);
    return null;
  }
}

/**
 * Get detailed place information using our Next.js API route
 */
async function getPlaceDetails(placeId: string): Promise<any | null> {
  try {
    const response = await fetch("/api/places/details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        placeId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

/**
 * Find the best Google Places match for a community
 */
function findBestGooglePlaceMatch(
  results: any[],
  communityName: string
): any | null {
  // Prioritize results by type relevance
  const typePriority = [
    "neighborhood",
    "sublocality",
    "sublocality_level_1",
    "sublocality_level_2",
    "locality",
    "administrative_area_level_3",
    "administrative_area_level_2",
  ];

  // Sort results by type priority and name similarity
  const sortedResults = results.sort((a, b) => {
    const aTypeScore = getTypeScore(a.types, typePriority);
    const bTypeScore = getTypeScore(b.types, typePriority);

    if (aTypeScore !== bTypeScore) {
      return bTypeScore - aTypeScore; // Higher score first
    }

    // If same type score, prioritize exact name matches
    const aNameMatch = a.name
      .toLowerCase()
      .includes(communityName.toLowerCase());
    const bNameMatch = b.name
      .toLowerCase()
      .includes(communityName.toLowerCase());

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    return 0;
  });

  return sortedResults[0] || null;
}

/**
 * Get type score for Google Places result
 */
function getTypeScore(types: string[], priority: string[]): number {
  if (!types) return 0;

  for (let i = 0; i < priority.length; i++) {
    if (types.includes(priority[i])) {
      return priority.length - i; // Higher score for higher priority
    }
  }

  return 0;
}

/**
 * Convert Google Places result to CommunityBoundary format
 */
function convertGooglePlaceToBoundary(
  placeDetails: any,
  communityName: string
): CommunityBoundary | null {
  const geometry = placeDetails.geometry;

  if (!geometry || !geometry.location) {
    throw new Error("No geometry found in place details");
  }

  // Try to get actual boundary from Google Places geometry
  let coordinates: { lat: number; lng: number }[] = [];
  const center = {
    lat: geometry.location.lat,
    lng: geometry.location.lng,
  };

  // Check if we have viewport bounds (approximate boundary)
  if (geometry.viewport) {
    const viewport = geometry.viewport;

    // Handle both Google Maps API objects and plain JavaScript objects
    let northeast, southwest;

    if (typeof viewport.getNorthEast === "function") {
      // Google Maps API object
      northeast = viewport.getNorthEast();
      southwest = viewport.getSouthWest();
    } else {
      // Plain JavaScript object from API response
      northeast = viewport.northeast || viewport.north_east;
      southwest = viewport.southwest || viewport.south_west;
    }

    // Create a rectangle from viewport bounds (5 points to close the polygon)
    coordinates = [
      { lat: southwest.lat, lng: southwest.lng }, // Southwest
      { lat: northeast.lat, lng: southwest.lng }, // Northwest
      { lat: northeast.lat, lng: northeast.lng }, // Northeast
      { lat: southwest.lat, lng: northeast.lng }, // Southeast
      { lat: southwest.lat, lng: southwest.lng }, // Back to Southwest (closes polygon)
    ];

    console.log(`Using viewport bounds for ${communityName}:`, {
      northeast: { lat: northeast.lat, lng: northeast.lng },
      southwest: { lat: southwest.lat, lng: southwest.lng },
    });
  }
  // Check if we have bounds (more precise than viewport)
  else if (geometry.bounds) {
    const bounds = geometry.bounds;

    // Handle both Google Maps API objects and plain JavaScript objects
    let northeast, southwest;

    if (typeof bounds.getNorthEast === "function") {
      // Google Maps API object
      northeast = bounds.getNorthEast();
      southwest = bounds.getSouthWest();
    } else {
      // Plain JavaScript object from API response
      northeast = bounds.northeast || bounds.north_east;
      southwest = bounds.southwest || bounds.south_west;
    }

    coordinates = [
      { lat: southwest.lat, lng: southwest.lng }, // Southwest
      { lat: northeast.lat, lng: southwest.lng }, // Northwest
      { lat: northeast.lat, lng: northeast.lng }, // Northeast
      { lat: southwest.lat, lng: northeast.lng }, // Southeast
      { lat: southwest.lat, lng: southwest.lng }, // Back to Southwest (closes polygon)
    ];

    console.log(`Using bounds for ${communityName}:`, {
      northeast: { lat: northeast.lat, lng: northeast.lng },
      southwest: { lat: southwest.lat, lng: southwest.lng },
    });
  }
  // No actual boundary data available - return null instead of creating fallback
  else {
    console.log(
      `No bounds/viewport available for ${communityName} - no actual boundary coordinates found`
    );
    return null;
  }

  // Calculate actual polygon dimensions for debugging
  const bounds = calculateBounds(coordinates);
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const areaKm2 =
    latDiff * 111 * (lngDiff * 111 * Math.cos((center.lat * Math.PI) / 180)); // Rough area calculation

  console.log(`Google Places boundary for ${communityName}:`, {
    center,
    coordinates,
    coordinateCount: coordinates.length,
    placeTypes: placeDetails.types || [],
    placeName: placeDetails.name,
    hasViewport: !!geometry.viewport,
    hasBounds: !!geometry.bounds,
    bounds: bounds,
    dimensions: {
      latSpan: latDiff.toFixed(6),
      lngSpan: lngDiff.toFixed(6),
      estimatedAreaKm2: areaKm2.toFixed(2),
    },
  });

  return {
    name: communityName,
    coordinates,
    center,
    bounds: calculateBounds(coordinates),
    source: "google",
  };
}

/**
 * Create a fallback boundary when no specific boundary is found
 */
function createFallbackBoundary(
  communityName: string,
  municipalityName: string
): CommunityBoundary {
  // Get municipality center coordinates
  const municipalityMap: { [key: string]: { lat: number; lng: number } } = {
    Brampton: { lat: 43.6834, lng: -79.7663 },
    Mississauga: { lat: 43.589, lng: -79.6441 },
    Toronto: { lat: 43.6532, lng: -79.3832 },
    Markham: { lat: 43.8668, lng: -79.2663 },
    Vaughan: { lat: 43.8361, lng: -79.4983 },
    "Richmond Hill": { lat: 43.8828, lng: -79.4403 },
    Oakville: { lat: 43.4675, lng: -79.6877 },
    Burlington: { lat: 43.3255, lng: -79.799 },
    Ajax: { lat: 43.8501, lng: -79.0329 },
    Pickering: { lat: 43.8361, lng: -79.0863 },
    Whitby: { lat: 43.8975, lng: -78.9428 },
    Oshawa: { lat: 43.8971, lng: -78.8658 },
    Clarington: { lat: 43.9361, lng: -78.6075 },
    Newmarket: { lat: 44.0501, lng: -79.4663 },
    Aurora: { lat: 44.0001, lng: -79.4663 },
    "Whitchurch-Stouffville": { lat: 44.0001, lng: -79.25 },
    Milton: { lat: 43.5083, lng: -79.8833 },
    "Halton Hills": { lat: 43.5833, lng: -79.9167 },
    Caledon: { lat: 43.8667, lng: -79.8667 },
  };

  const center = municipalityMap[municipalityName] || {
    lat: 43.6532,
    lng: -79.3832,
  };

  // Create a simple square polygon around the center (approximately 2km x 2km)
  const offset = 0.01; // Roughly 1km
  const coordinates = [
    { lat: center.lat - offset, lng: center.lng - offset },
    { lat: center.lat + offset, lng: center.lng - offset },
    { lat: center.lat + offset, lng: center.lng + offset },
    { lat: center.lat - offset, lng: center.lng + offset },
    { lat: center.lat - offset, lng: center.lng - offset }, // Close the polygon
  ];

  const bounds = calculateBounds(coordinates);
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const areaKm2 =
    latDiff * 111 * (lngDiff * 111 * Math.cos((center.lat * Math.PI) / 180));

  console.log(`Fallback boundary for ${communityName}:`, {
    center,
    coordinates,
    bounds: bounds,
    dimensions: {
      latSpan: latDiff.toFixed(6),
      lngSpan: lngDiff.toFixed(6),
      estimatedAreaKm2: areaKm2.toFixed(2),
      offset: offset,
    },
  });

  return {
    name: communityName,
    coordinates,
    center,
    bounds: bounds,
    source: "fallback",
  };
}

/**
 * Calculate center point from coordinates
 */
function calculateCenter(coordinates: { lat: number; lng: number }[]): {
  lat: number;
  lng: number;
} {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

/**
 * Calculate bounds from coordinates
 */
function calculateBounds(coordinates: { lat: number; lng: number }[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = coordinates.map((coord) => coord.lat);
  const lngs = coordinates.map((coord) => coord.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/**
 * Community boundary interface
 */
export interface CommunityBoundary {
  name: string;
  coordinates: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  source: string;
}

/**
 * Test function to check if a community exists in Google Places
 * This can be called from the browser console for debugging
 */
export async function testCommunityBoundary(
  communityName: string,
  municipalityName: string = "Brampton"
) {
  console.log(
    `Testing Google Places boundary for: ${communityName} in ${municipalityName}`
  );
  const result = await fetchCommunityBoundary(communityName, municipalityName);
  console.log("Result:", result);
  return result;
}

/**
 * Search regions by name
 */
export function searchRegions(query: string): FreeLocationResult[] {
  if (!query || query.length < 1) return CANADIAN_REGIONS;

  return CANADIAN_REGIONS.filter(
    (region) =>
      region.name.toLowerCase().includes(query.toLowerCase()) ||
      region.code?.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Search areas by name (across all regions)
 */
export function searchAreas(query: string): FreeLocationResult[] {
  if (!query || query.length < 2) return [];

  const allAreas: FreeLocationResult[] = [];
  Object.values(AREAS_BY_REGION).forEach((areas) => {
    allAreas.push(...areas);
  });

  return allAreas.filter(
    (area) =>
      area.name.toLowerCase().includes(query.toLowerCase()) ||
      area.code?.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Search municipalities by name (across all areas)
 */
export function searchMunicipalities(query: string): FreeLocationResult[] {
  if (!query || query.length < 2) return [];

  const allMunicipalities: FreeLocationResult[] = [];
  Object.values(MUNICIPALITIES_BY_AREA).forEach((municipalities) => {
    allMunicipalities.push(...municipalities);
  });

  return allMunicipalities.filter((municipality) =>
    municipality.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Search communities by name (across all municipalities)
 */
export function searchCommunities(query: string): FreeLocationResult[] {
  if (!query || query.length < 2) return [];

  const allCommunities: FreeLocationResult[] = [];
  Object.values(COMMUNITIES_BY_MUNICIPALITY).forEach((communities) => {
    allCommunities.push(...communities);
  });

  return allCommunities.filter((community) =>
    community.name.toLowerCase().includes(query.toLowerCase())
  );
}
