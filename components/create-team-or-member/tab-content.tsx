"use client";

import { CreateMemberForm } from "./create-member-form";
import { MembersTable } from "./members-table";
import { QuickStats } from "./quick-stats";
import { TeamManagementDashboard } from "./team-management-dashboard";
import { TeamMembersTable } from "./team-members-table";
import { TeamAnalytics } from "./team-analytics";
import { TeamSettings } from "./team-settings";
import { useTabContext } from "./tab-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Activity,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TabContent() {
  const { activeTab } = useTabContext()
  const [manageView, setManageView] = useState<'dashboard' | 'members' | 'analytics' | 'settings'>('dashboard')

  if (activeTab === "create") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreateMemberForm />
          <QuickStats />
        </div>
        <MembersTable />
      </div>
    )
  }

  if (activeTab === "manage") {
    return (
      <div className="space-y-6">
        {/* Manage Tab Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#42A5F5] mb-2">Team Management</h2>
            <p className="text-lg text-gray-700 font-medium">Comprehensive team management and analytics</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-300">
                <Settings className="w-4 h-4 mr-2" />
                View Options
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setManageView('dashboard')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManageView('members')}>
                <Users className="w-4 h-4 mr-2" />
                Members
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setManageView('analytics')}>
                <Activity className="w-4 h-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManageView('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Manage Tab Content */}
        {manageView === 'dashboard' && <TeamManagementDashboard />}
        {manageView === 'members' && <TeamMembersTable />}
        {manageView === 'analytics' && <TeamAnalytics />}
        {manageView === 'settings' && <TeamSettings />}
      </div>
    )
  }

  return null
}
