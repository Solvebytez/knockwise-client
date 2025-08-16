"use client"

export default function RoutesPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
        <p className="text-gray-600 mt-1">Manage and optimize sales routes for your team</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Routes Dashboard</h2>
          <p className="text-gray-600">
            This is the Routes page for SubAdmins. Here you can manage and optimize sales routes,
            assign territories to sales representatives, and track route performance.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Active Routes</h3>
              <p className="text-2xl font-bold text-blue-600">15</p>
              <p className="text-sm text-blue-700">Currently assigned</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Optimized Routes</h3>
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-green-700">Efficiency improved</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900">Pending Review</h3>
              <p className="text-2xl font-bold text-orange-600">3</p>
              <p className="text-sm text-orange-700">Need optimization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
