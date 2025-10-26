"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  Calendar, 
  Home, 
  Gauge, 
  CheckCircle, 
  Download,
  X
} from "lucide-react"

interface PropertyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  property: {
    _id: string
    address: string
    houseNumber: number
    coordinates: [number, number]
    status: 'not-visited' | 'interested' | 'visited' | 'callback' | 'appointment' | 'follow-up' | 'not-interested'
    lastVisited?: string
    notes?: string
    phone?: string
    email?: string
    assignedRep?: {
      name: string
      id: string
    }
    residents?: {
      name: string
      phone?: string
      email?: string
      age?: number
      gender?: string
      maritalStatus?: string
      income?: string
      occupation?: string
      education?: string
      propertyOwnership?: string
    }[]
    propertyDetails?: {
      age: string
      occupancy: number
      score: string
    }
  } | null
  detailedProperty?: any
  isLoading?: boolean
  onStatusUpdate?: (propertyId: string, status: string, notes?: string) => void
  onExport?: () => void
}

export function PropertyDetailModal({ 
  isOpen, 
  onClose, 
  property, 
  detailedProperty,
  isLoading = false,
  onStatusUpdate,
  onExport 
}: PropertyDetailModalProps) {
  
  // Debug logging
  React.useEffect(() => {
    if (detailedProperty) {
      console.log('🔍 Modal - Detailed Property Data:', detailedProperty)
      console.log('🏠 Modal - Resident Data:', detailedProperty.resident)
      console.log('🏘️ Modal - Property Data:', detailedProperty.propertyData)
      console.log('🗺️ Modal - Zone Data:', detailedProperty.zone)
    }
  }, [detailedProperty])

  const handleExport = () => {
    if (onExport) {
      onExport()
    }
  }

  if (!property) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[600px] max-h-[90vh] overflow-y-auto p-0 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        
        <div className="bg-white rounded-lg">
          {isLoading ? (
            // Loading State
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Loading property details...</p>
              </div>
            </div>
          ) : detailedProperty ? (
            // Property Details Content
            <>
              {/* Top Section - Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {detailedProperty.resident?.address}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-100 text-green-800 text-sm">
                        {detailedProperty.resident?.status === 'visited' ? 'Visited' :
                         detailedProperty.resident?.status === 'not-visited' ? 'Not Visited' :
                         detailedProperty.resident?.status === 'interested' ? 'Interested' :
                         detailedProperty.resident?.status === 'callback' ? 'Callback' :
                         detailedProperty.resident?.status === 'appointment' ? 'Appointment' :
                         detailedProperty.resident?.status === 'follow-up' ? 'Follow-up' :
                         detailedProperty.resident?.status === 'not-interested' ? 'Not Interested' :
                         'Not Visited'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Property Details Row */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {(() => {
                        console.log('🏠 Modal - Property Data for Age:', detailedProperty.propertyData);
                        console.log('📅 Modal - Year Built:', detailedProperty.propertyData?.yearBuilt);
                        if (detailedProperty.propertyData?.yearBuilt) {
                          const age = new Date().getFullYear() - detailedProperty.propertyData.yearBuilt;
                          return `${age}+ years`;
                        }
                        return '20+ years';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>
                      {(() => {
                        console.log('🏠 Modal - Property Data for Occupancy:', detailedProperty.propertyData);
                        console.log('🛏️ Modal - Bedrooms:', detailedProperty.propertyData?.bedrooms);
                        return detailedProperty.propertyData?.bedrooms || 1;
                      })()} occupancy
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Gauge className="w-4 h-4" />
                    <span>
                      {(() => {
                        console.log('🏠 Modal - Property Data for Score:', detailedProperty.propertyData);
                        console.log('📊 Modal - Lead Score:', detailedProperty.propertyData?.leadScore);
                        console.log('💰 Modal - Estimated Value:', detailedProperty.propertyData?.estimatedValue);
                        
                        if (detailedProperty.propertyData?.leadScore) {
                          const base = Math.floor(detailedProperty.propertyData.leadScore/10)*10;
                          return `${base}-${base+9}`;
                        }
                        if (detailedProperty.propertyData?.estimatedValue) {
                          const base = Math.floor(detailedProperty.propertyData.estimatedValue/1000);
                          return `${base}-${base+59}`;
                        }
                        return '740-799';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Card */}
              <div className="p-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Contact Information
                  </h4>
                  
                  {/* Contact Information */}
                  {detailedProperty.resident?.phone && (
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-4 h-4 text-red-500" />
                      <span className="text-blue-600 font-medium">{detailedProperty.resident.phone}</span>
                    </div>
                  )}

                  {/* Property Data Information */}
                  {detailedProperty.propertyData && (
                    <div className="mb-3">
                      {detailedProperty.propertyData.ownerPhone && (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-red-500" />
                          <span className="text-blue-600 font-medium">Owner: {detailedProperty.propertyData.ownerPhone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resident Details Tags */}
                  <div className="flex flex-wrap gap-2">
                    {detailedProperty.resident?.houseNumber && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        House #{detailedProperty.resident.houseNumber}
                      </Badge>
                    )}
                    {detailedProperty.resident?.status && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {detailedProperty.resident.status}
                      </Badge>
                    )}
                    {detailedProperty.resident?.email && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {detailedProperty.resident.email}
                      </Badge>
                    )}
                    {detailedProperty.resident?.lastVisited && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        Last: {new Date(detailedProperty.resident.lastVisited).toLocaleDateString()}
                      </Badge>
                    )}
                    {detailedProperty.resident?.assignedAgentId && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        Assigned: {(detailedProperty.resident.assignedAgentId as any)?.name}
                      </Badge>
                    )}
                    
                    {/* Property Data Tags */}
                    {detailedProperty.propertyData?.propertyType && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {detailedProperty.propertyData.propertyType.replace('_', ' ')}
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.bedrooms && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {detailedProperty.propertyData.bedrooms} bed
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.estimatedValue && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        ${(detailedProperty.propertyData.estimatedValue/1000).toFixed(0)}k
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.leadScore && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        Score: {detailedProperty.propertyData.leadScore}
                      </Badge>
                    )}
                    
                    {/* Demographic Tags (from UI images) */}
                    {detailedProperty.propertyData?.ownerName && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {detailedProperty.propertyData.ownerName}
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.estimatedValue && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        ${(detailedProperty.propertyData.estimatedValue/1000).toFixed(0)}k income
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.propertyType && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        Homeowner
                      </Badge>
                    )}
                    {detailedProperty.propertyData?.ownerName && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        Office worker
                      </Badge>
                    )}
                  </div>

                  {/* Zone Information */}
                  {detailedProperty.zone && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Zone:</span> {detailedProperty.zone.name}
                      </div>
                      {detailedProperty.zoneStats && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Progress:</span> {detailedProperty.zoneStats.visitedResidents}/{detailedProperty.zoneStats.totalResidents} visited
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Export Button */}
                <div className="flex justify-end">
                  <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Error State
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-red-600">Failed to load property details</p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
                     )}
         </div>
       </DialogContent>
     </Dialog>
   )
}
