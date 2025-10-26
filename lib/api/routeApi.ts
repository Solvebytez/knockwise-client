import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiInstance } from "@/lib/apiInstance";

// Types
export interface RouteStop {
  propertyId?: string; // Optional for address-based stops
  address?: string; // For address-based stops
  order: number;
  estimatedDuration: number;
  notes?: string;
  status?: "PENDING" | "COMPLETED" | "SKIPPED" | "RESCHEDULED";
  actualDuration?: number;
  completedAt?: string;
}

export interface RouteOptimizationSettings {
  maxStops?: number;
  maxDistance?: number;
  preferredTimeWindow?: {
    start: string;
    end: string;
  };
  optimizationType?: "FASTEST" | "SHORTEST" | "BALANCED";
  avoidFerries?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidTraffic?: boolean;
  startFromOffice?: boolean;
  returnToOffice?: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  startLocation: [number, number]; // [lng, lat]
  endLocation: [number, number]; // [lng, lat]
  maneuver?: string;
  polyline?: string;
}

export interface RouteLeg {
  startAddress: string;
  endAddress: string;
  startLocation: [number, number]; // [lng, lat]
  endLocation: [number, number]; // [lng, lat]
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
}

export interface RouteAlternative {
  summary: string;
  distance: number; // miles
  duration: number; // minutes
  trafficCondition?: string;
  legs: RouteLeg[];
  overviewPolyline?: string;
  warnings?: string[];
  waypointOrder?: number[];
}

export interface RouteDetails {
  selectedAlternativeIndex: number; // Which route was chosen (0, 1, 2, etc.)
  alternatives: RouteAlternative[]; // All available route options
  bounds?: {
    northeast: [number, number]; // [lng, lat]
    southwest: [number, number]; // [lng, lat]
  };
  copyrights?: string;
  calculatedAt: string; // When the route was calculated
}

export interface Route {
  _id: string;
  name: string;
  description?: string;
  agentId: string;
  date: string;
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  status:
    | "DRAFT"
    | "PLANNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startLocation?: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  endLocation?: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  optimizationSettings?: RouteOptimizationSettings;
  analytics?: {
    totalStops: number;
    completedStops: number;
    skippedStops: number;
    totalDistance: number;
    estimatedDuration: number;
    efficiency: number;
    completionRate: number;
  };
  routeDetails?: RouteDetails; // Detailed turn-by-turn directions and alternatives
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteRequest {
  name: string;
  description?: string;
  date: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  endLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  stops?: RouteStop[]; // Route stops array
  totalDistance?: number;
  totalDuration?: number;
  optimizationSettings?: RouteOptimizationSettings;
  analytics?: {
    totalStops: number;
    completedStops: number;
    skippedStops: number;
    totalDistance: number;
    estimatedDuration: number;
    efficiency: number;
    completionRate: number;
  };
  routeDetails?: RouteDetails; // Detailed turn-by-turn directions and alternatives
  tags?: string[];
}

export interface UpdateRouteRequest {
  name?: string;
  description?: string;
  date?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?:
    | "DRAFT"
    | "PLANNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED";
  startLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  endLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  stops?: RouteStop[];
  totalDistance?: number;
  totalDuration?: number;
  optimizationSettings?: RouteOptimizationSettings;
  analytics?: {
    totalStops: number;
    completedStops: number;
    skippedStops: number;
    totalDistance: number;
    estimatedDuration: number;
    efficiency: number;
    completionRate: number;
  };
  routeDetails?: RouteDetails;
  tags?: string[];
}

export interface MyRoutesResponse {
  routes: Route[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Functions
export const createRoute = async (data: CreateRouteRequest): Promise<Route> => {
  const response = await apiInstance.post<Route>("/routes/create", data);
  return response.data;
};

export const getMyRoutes = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  date?: string;
}): Promise<MyRoutesResponse> => {
  const response = await apiInstance.get<MyRoutesResponse>("/routes/my", {
    params,
  });
  return response.data;
};

export const getRouteById = async (id: string): Promise<Route> => {
  const response = await apiInstance.get<Route>(`/routes/${id}`);
  return response.data;
};

export const updateRoute = async (
  id: string,
  data: UpdateRouteRequest
): Promise<Route> => {
  const response = await apiInstance.put<Route>(`/routes/${id}`, data);
  return response.data;
};

export const deleteRoute = async (id: string): Promise<void> => {
  await apiInstance.delete(`/routes/${id}`);
};

// React Query Hooks
export const useMyRoutes = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  date?: string;
}) => {
  return useQuery<MyRoutesResponse, Error>({
    queryKey: ["myRoutes", params],
    queryFn: () => getMyRoutes(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

export const useRoute = (id: string) => {
  return useQuery<Route, Error>({
    queryKey: ["route", id],
    queryFn: () => getRouteById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation<Route, Error, CreateRouteRequest>({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRoutes"] });
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation<Route, Error, { id: string; data: UpdateRouteRequest }>({
    mutationFn: ({ id, data }) => updateRoute(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myRoutes"] });
      queryClient.invalidateQueries({ queryKey: ["route", variables.id] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRoutes"] });
    },
  });
};
