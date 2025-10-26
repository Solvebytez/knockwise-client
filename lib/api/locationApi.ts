import { apiInstance } from "@/lib/apiInstance";

// Types
export interface Area {
  _id: string;
  name: string;
  type: string;
  municipalities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Municipality {
  _id: string;
  name: string;
  type: string;
  areaId: string;
  communities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  _id: string;
  name: string;
  type: string;
  municipalityId: string;
  areaId: string;
  zoneIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ZoneLocationAssignment {
  communityId: string;
}

export interface ZoneLocationResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    communityId: {
      _id: string;
      name: string;
      type: string;
    };
    areaId: {
      _id: string;
      name: string;
      type: string;
    };
    municipalityId: {
      _id: string;
      name: string;
      type: string;
    };
  };
}

// API Response types
export interface AreasResponse {
  success: boolean;
  data: Area[];
}

export interface MunicipalitiesResponse {
  success: boolean;
  data: Municipality[];
}

export interface CommunitiesResponse {
  success: boolean;
  data: Community[];
}

// API Functions

/**
 * Fetch all areas
 */
export const fetchAreas = async (): Promise<AreasResponse> => {
  const response = await apiInstance.get<AreasResponse>("/areas");
  return response.data;
};

/**
 * Fetch municipalities by area ID
 */
export const fetchMunicipalitiesByArea = async (
  areaId: string
): Promise<MunicipalitiesResponse> => {
  const response = await apiInstance.get<MunicipalitiesResponse>(
    `/areas/${areaId}/municipalities`
  );
  return response.data;
};

/**
 * Fetch communities by municipality ID
 */
export const fetchCommunitiesByMunicipality = async (
  municipalityId: string
): Promise<CommunitiesResponse> => {
  const response = await apiInstance.get<CommunitiesResponse>(
    `/municipalities/${municipalityId}/communities`
  );
  return response.data;
};

/**
 * Fetch all municipalities
 */
export const fetchAllMunicipalities =
  async (): Promise<MunicipalitiesResponse> => {
    const response = await apiInstance.get<MunicipalitiesResponse>(
      "/municipalities"
    );
    return response.data;
  };

/**
 * Fetch all communities
 */
export const fetchAllCommunities = async (): Promise<CommunitiesResponse> => {
  const response = await apiInstance.get<CommunitiesResponse>("/communities");
  return response.data;
};

/**
 * Fetch community by ID
 */
export const fetchCommunityById = async (
  communityId: string
): Promise<{ success: boolean; data: Community }> => {
  const response = await apiInstance.get(`/communities/${communityId}`);
  return response.data;
};

/**
 * Assign zone to community
 */
export const assignZoneToCommunity = async (
  zoneId: string,
  assignment: ZoneLocationAssignment
): Promise<ZoneLocationResponse> => {
  const response = await apiInstance.put<ZoneLocationResponse>(
    `/zones/${zoneId}/location`,
    assignment
  );
  return response.data;
};

/**
 * Get zone location assignment
 */
export const getZoneLocation = async (
  zoneId: string
): Promise<ZoneLocationResponse> => {
  const response = await apiInstance.get<ZoneLocationResponse>(
    `/zones/${zoneId}/location`
  );
  return response.data;
};
