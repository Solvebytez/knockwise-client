import { apiInstance } from './apiInstance'

// Unified territory update function
export const updateTerritoryUnified = async ({ 
  id, 
  data 
}: { 
  id: string; 
  data: { 
    updateType: 'basic' | 'boundary' | 'residents' | 'all';
    name?: string;
    description?: string;
    boundary?: any;
    buildingData?: any;
    residents?: any[];
  } 
}) => {
  console.log('Sending unified update data:', { id, data })
  const response = await apiInstance.put(`/zones/update-unified/${id}`, data)
  console.log('Unified update response:', response.data)
  return response.data.data
}

// Legacy functions for backward compatibility
export const updateTerritoryBasic = async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
  return updateTerritoryUnified({ id, data: { ...data, updateType: 'basic' } })
}

export const updateTerritoryBoundary = async ({ id, data }: { id: string; data: { boundary: any; buildingData?: any } }) => {
  return updateTerritoryUnified({ id, data: { ...data, updateType: 'boundary' } })
}

export const updateTerritoryResidents = async ({ id, data }: { id: string; data: { residents: any[] } }) => {
  return updateTerritoryUnified({ id, data: { ...data, updateType: 'residents' } })
}

// Legacy update function (for backward compatibility)
export const updateTerritory = async ({ id, data }: { id: string; data: any }) => {
  console.log('Sending legacy update data:', { id, data })
  const response = await apiInstance.put(`/zones/update/${id}`, data)
  console.log('Legacy update response:', response.data)
  return response.data.data
}
