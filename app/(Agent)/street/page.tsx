"use client"

import { MapPin, Users, Target, TrendingUp, Navigation, Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function StreetPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-[#42A5F5]/10 rounded-full">
              <Navigation className="h-8 w-8 text-[#42A5F5]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Street View
            </h1>
            <p className="text-gray-600 mt-2 text-base leading-relaxed">
              Navigate through streets and view detailed lead information
            </p>
          </div>
        </div>
      </div>

      {/* Street Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Route</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Houses to visit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Visits done
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Still pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Street List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#42A5F5] mb-2 tracking-tight">
            Street Overview
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Your assigned streets and current progress
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Street 1 */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gandhi Street</h3>
                  <p className="text-sm text-gray-600">8 houses • 4 completed today</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last visit: 2 hours ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </div>

          {/* Street 2 */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Janipur Road</h3>
                  <p className="text-sm text-gray-600">6 houses • 3 completed today</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last visit: 1 hour ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </div>

          {/* Street 3 */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Satwari Lane</h3>
                  <p className="text-sm text-gray-600">10 houses • 5 completed today</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last visit: 30 min ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  In Progress
                </Badge>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
