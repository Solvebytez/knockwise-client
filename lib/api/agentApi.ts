import { useQuery } from "@tanstack/react-query";
import { apiInstance } from "@/lib/apiInstance";

// Types for territory data
export interface TerritoryStatistics {
  totalHouses: number;
  visitedCount: number;
  notVisitedCount: number;
  interestedCount: number;
  notInterestedCount: number;
  completionPercentage: number;
}

export interface Territory {
  _id: string;
  name: string;
  description?: string;
  status: string;
  assignmentType: "individual" | "team";
  isScheduled: boolean;
  isPrimary: boolean;
  teamName: string | null;
  teamId?: string | null;
  scheduledDate?: string | null;
  statistics: TerritoryStatistics;
  boundary?: any;
  buildingData?: {
    totalBuildings: number;
    residentialHomes: number;
    addresses: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  lastActivity?: string | null;
  totalResidents?: number;
  activeResidents?: number;
  completionRate?: number;
  averageKnocks?: number;
}

export interface TerritorySummary {
  totalTerritories: number;
  activeTerritories: number;
  scheduledTerritories: number;
  totalHouses: number;
  visitedHouses: number;
  notVisitedHouses: number;
  completionPercentage: number;
}

export interface MyTerritoriesResponse {
  success: boolean;
  data: {
    territories: Territory[];
    summary: TerritorySummary;
  };
}

// API function to fetch territories
export const fetchMyTerritories = async (): Promise<MyTerritoriesResponse> => {
  const response = await apiInstance.get<MyTerritoriesResponse>(
    "/users/my-territories"
  );
  return response.data;
};

// React Query hook to fetch territories
export const useMyTerritories = () => {
  return useQuery<MyTerritoriesResponse, Error>({
    queryKey: ["myTerritories"],
    queryFn: fetchMyTerritories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
