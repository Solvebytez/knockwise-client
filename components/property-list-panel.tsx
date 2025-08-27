"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Home, 
  CheckCircle, 
  Clock, 
  Calendar,
  Phone,
  Heart,
  User,
  MapPin,
  Eye
} from "lucide-react"

interface Property {
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
}

interface PropertyListPanelProps {
  properties: Property[]
  onPropertyClick: (property: Property) => void
  onStatusFilterChange: (status: string) => void
  onSortChange: (sortBy: string) => void
  currentStatusFilter: string
  currentSortBy: string
}

const statusConfig = {
  'not-visited': { label: 'Not Visited', color: 'bg-red-100 text-red-800', icon: Clock, dotColor: 'bg-red-500' },
  'interested': { label: 'Interested', color: 'bg-yellow-100 text-yellow-800', icon: Heart, dotColor: 'bg-yellow-500' },
  'visited': { label: 'Visited', color: 'bg-green-100 text-green-800', icon: CheckCircle, dotColor: 'bg-green-500' },
  'callback': { label: 'Callback', color: 'bg-purple-100 text-purple-800', icon: Phone, dotColor: 'bg-purple-500' },
  'appointment': { label: 'Appointment', color: 'bg-blue-100 text-blue-800', icon: Calendar, dotColor: 'bg-blue-500' },
  'follow-up': { label: 'Follow-up', color: 'bg-pink-100 text-pink-800', icon: Clock, dotColor: 'bg-pink-500' },
  'not-interested': { label: 'Not Interested', color: 'bg-gray-100 text-gray-800', icon: User, dotColor: 'bg-gray-500' }
}

export function PropertyListPanel({
  properties,
  onPropertyClick,
  onStatusFilterChange,
  onSortChange,
  currentStatusFilter,
  currentSortBy
}: PropertyListPanelProps) {
  const [statusCounts, setStatusCounts] = useState(() => {
    const counts: Record<string, number> = {}
    properties.forEach(prop => {
      counts[prop.status] = (counts[prop.status] || 0) + 1
    })
    return counts
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const total = properties.length
    const visited = statusCounts['visited'] || 0
    const remaining = total - visited
    
    return {
      total,
      visited,
      remaining
    }
  }, [properties, statusCounts])

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties

    // Apply status filter
    if (currentStatusFilter !== 'All Status') {
      filtered = properties.filter(prop => prop.status === currentStatusFilter)
    }

    // Apply sorting
    switch (currentSortBy) {
      case 'Sequential':
        return filtered.sort((a, b) => a.houseNumber - b.houseNumber)
      case 'Odd':
        return filtered.filter(prop => prop.houseNumber % 2 === 1).sort((a, b) => a.houseNumber - b.houseNumber)
      case 'Even':
        return filtered.filter(prop => prop.houseNumber % 2 === 0).sort((a, b) => a.houseNumber - b.houseNumber)
      default:
        return filtered
    }
  }, [properties, currentStatusFilter, currentSortBy])

  const handleSortChange = (value: string) => {
    onSortChange(value)
  }

  const handleStatusFilterChange = (value: string) => {
    onStatusFilterChange(value)
  }

  return (
    <div className="w-full max-w-md bg-white border-r border-gray-200 flex flex-col h-full max-h-screen">
      {/* Properties Header */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Properties</h2>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-base font-bold text-purple-900">{stats.total}</div>
                  <div className="text-xs text-purple-600">Total Homes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-base font-bold text-green-900">{stats.visited}</div>
                  <div className="text-xs text-green-600">Visited</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="text-base font-bold text-orange-900">{stats.remaining}</div>
                  <div className="text-xs text-orange-600">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="space-y-3">
          {/* Sort Buttons */}
          <div className="flex gap-1">
            <Button
              variant={currentSortBy === 'Sequential' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('Sequential')}
              className="flex-1 text-xs"
            >
              Sequential
            </Button>
            <Button
              variant={currentSortBy === 'Odd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('Odd')}
              className="flex-1 text-xs"
            >
              Odd
            </Button>
            <Button
              variant={currentSortBy === 'Even' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('Even')}
              className="flex-1 text-xs"
            >
              Even
            </Button>
          </div>

          {/* Status Filter */}
          <Select value={currentStatusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className="w-4 h-4" />
                    {config.label} ({statusCounts[key] || 0})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Property List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {filteredAndSortedProperties.map((property) => {
            const statusInfo = statusConfig[property.status]
            const StatusIcon = statusInfo?.icon || Clock

            return (
              <Card 
                key={property._id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                onClick={() => onPropertyClick(property)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Main Address */}
                      <div className="font-medium text-gray-900 truncate text-[4px]">
                        {property.address}
                      </div>
                      
                      {/* Short Address */}
                      <div className="text-[3px] text-gray-500 truncate">
                        {property.houseNumber} {property.address.split(',')[0].split(' ').slice(1).join(' ')}
                      </div>

                      {/* Assigned Rep */}
                      {property.assignedRep && (
                        <div className="text-[3px] text-blue-600 mt-1">
                          Assigned Rep: {property.assignedRep.name} (#{property.assignedRep.id})
                        </div>
                      )}
                    </div>

                                         {/* Status Badge */}
                     <div className="flex items-center gap-1 ml-2">
                       <Badge className={`${statusInfo?.color} text-[3px] px-1 py-0.5`}>
                         {statusInfo?.label}
                       </Badge>
                       <div className={`w-0.5 h-0.5 rounded-full ${statusInfo?.dotColor}`}></div>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredAndSortedProperties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No properties found</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Status Legend</h3>
                 <div className="grid grid-cols-2 gap-1">
           {Object.entries(statusConfig).map(([key, config]) => {
             const Icon = config.icon
             return (
               <div key={key} className="flex items-center gap-1 text-[3px]">
                 <div className={`w-0.5 h-0.5 rounded-full ${config.dotColor}`}></div>
                 <Icon className="w-1 h-1 text-gray-500" />
                 <span className="text-gray-600 truncate">{config.label}</span>
                 <span className="text-gray-400">({statusCounts[key] || 0})</span>
               </div>
             )
           })}
         </div>
      </div>
    </div>
  )
}
