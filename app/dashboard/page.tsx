"use client"

import { Users, UserCheck, MapPin, BarChart3 } from "lucide-react"
import { MetricCard } from "@/components/metric-card"
import { SalesRepTable } from "@/components/sales-rep-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
        <div className="text-center space-y-4">
          <Avatar className="w-20 h-20 mx-auto ring-4 ring-[#42A5F5]/10">
            <AvatarImage src="/business-person-avatar.png" />
            <AvatarFallback className="bg-[#42A5F5] text-white text-2xl font-semibold">SA</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome, Super Admin!
            </h1>
            <p className="text-gray-600 mt-2 text-base leading-relaxed">
              Here's what's happening today across your network
            </p>
          </div>
          <div className="pt-4">
            <Button 
              onClick={() => router.push("/territory-map")} 
              className="bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all duration-200"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Open Territory Map
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <MetricCard
          icon={Users}
          value="12"
          title="Active Clients"
          subtitle="Subadmins onboarded"
          buttonText="View Clients"
          changeText="+2 New this week"
        />
        <MetricCard
          icon={UserCheck}
          value="154"
          title="Sales Reps"
          subtitle="Across all clients"
          buttonText="View SalesRep"
          changeText="+20 Active this week"
        />
        <MetricCard
          icon={MapPin}
          value="28"
          title="Territories Active"
          subtitle="Mapped & assigned"
          buttonText="View Territories"
          changeText="+4 Area mapped this week"
          onClick={() => router.push("/territory-map")}
        />
        <MetricCard
          icon={BarChart3}
          value="6742"
          title="Total Leads"
          subtitle="All-time collected"
          buttonText="View Leads"
          changeText="+50 New this week"
        />
      </div>

      {/* Sales Rep Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#42A5F5] mb-2 tracking-tight">
            Sales Rep Management
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Manage, monitor, and analyze sales rep activity across all clients.
          </p>
        </div>
        <SalesRepTable />
      </div>
    </div>
  )
}
