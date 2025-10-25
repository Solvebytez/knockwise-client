import { apiInstance } from "../apiInstance";

// Types for agent zone operations
export interface AgentZone {
  _id: string;
  name: string;
  description?: string;
  boundary: {
    type: "Polygon";
    coordinates: number[][][];
  };
  buildingData?: {
    totalBuildings: number;
    residentialHomes: number;
    addresses: string[];
    coordinates: number[][];
  };
  assignedAgentId?: {
    _id: string;
    name: string;
    email: string;
  };
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "SCHEDULED" | "COMPLETED";
  zoneType: "MANUAL" | "MAP";
  createdBy: string;
  areaId?: {
    _id: string;
    name: string;
    type: string;
  };
  municipalityId?: {
    _id: string;
    name: string;
    type: string;
  };
  communityId?: {
    _id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentZoneData {
  name: string;
  description?: string;
  boundary: {
    type: "Polygon";
    coordinates: number[][][];
  };
  buildingData?: {
    addresses: string[];
    coordinates: number[][];
  };
  communityId?: string;
  areaId?: string;
  municipalityId?: string;
}

export interface UpdateAgentZoneData {
  name?: string;
  description?: string;
  boundary?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  buildingData?: {
    addresses: string[];
    coordinates: number[][];
  };
  communityId?: string;
}

export interface AgentZonesResponse {
  success: boolean;
  data: AgentZone[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AgentZoneResponse {
  success: boolean;
  data: AgentZone;
}

// API functions for agent zone operations
export const agentZoneApi = {
  // Create a new zone and auto-assign it to the current agent
  createZone: async (
    zoneData: CreateAgentZoneData
  ): Promise<AgentZoneResponse> => {
    const response = await apiInstance.post("/agent-zones", zoneData);
    return response.data;
  },

  // Get zones created by the current agent
  getZones: async (page = 1, limit = 10): Promise<AgentZonesResponse> => {
    const response = await apiInstance.get(
      `/agent-zones?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get a specific zone created by the current agent
  getZoneById: async (zoneId: string): Promise<AgentZoneResponse> => {
    const response = await apiInstance.get(`/agent-zones/${zoneId}`);
    return response.data;
  },

  // Update a zone created by the current agent
  updateZone: async (
    zoneId: string,
    zoneData: UpdateAgentZoneData
  ): Promise<AgentZoneResponse> => {
    const response = await apiInstance.put(`/agent-zones/${zoneId}`, zoneData);
    return response.data;
  },

  // Delete a zone created by the current agent
  deleteZone: async (
    zoneId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiInstance.delete(`/agent-zones/${zoneId}`);
    return response.data;
  },
};
