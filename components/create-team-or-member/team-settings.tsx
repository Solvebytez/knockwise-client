"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Shield,
  Users,
  MapPin,
  Clock,
  Bell,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Building,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import { apiInstance } from "@/lib/apiInstance";
import { toast } from "sonner";

interface TeamSettings {
  general: {
    teamName: string;
    description: string;
    maxMembers: number;
    autoAssignZones: boolean;
    allowCrossZoneWork: boolean;
  };
  permissions: {
    canCreateMembers: boolean;
    canDeleteMembers: boolean;
    canAssignZones: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
    canManageSettings: boolean;
  };
  notifications: {
    newMemberAlert: boolean;
    performanceAlerts: boolean;
    zoneAssignmentAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  performance: {
    dailyKnockTarget: number;
    weeklyKnockTarget: number;
    monthlyKnockTarget: number;
    minimumConversionRate: number;
    responseTimeThreshold: number;
  };
  zones: {
    maxZonesPerMember: number;
    allowZoneOverlap: boolean;
    autoReassignInactive: boolean;
  };
}

const fetchTeamSettings = async (): Promise<TeamSettings> => {
  try {
    const response = await apiInstance.get("/teams/settings");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching team settings:", error);
    // Fallback data
    return {
      general: {
        teamName: "Sales Team Alpha",
        description: "Primary sales team for residential properties",
        maxMembers: 10,
        autoAssignZones: true,
        allowCrossZoneWork: false,
      },
      permissions: {
        canCreateMembers: true,
        canDeleteMembers: true,
        canAssignZones: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageSettings: true,
      },
      notifications: {
        newMemberAlert: true,
        performanceAlerts: true,
        zoneAssignmentAlerts: true,
        weeklyReports: true,
        monthlyReports: false,
      },
      performance: {
        dailyKnockTarget: 50,
        weeklyKnockTarget: 250,
        monthlyKnockTarget: 1000,
        minimumConversionRate: 5.0,
        responseTimeThreshold: 2.0,
      },
      zones: {
        maxZonesPerMember: 3,
        allowZoneOverlap: false,
        autoReassignInactive: true,
      },
    };
  }
};

const updateTeamSettings = async (
  settings: Partial<TeamSettings>
): Promise<void> => {
  try {
    await apiInstance.put("/teams/settings", settings);
  } catch (error) {
    console.error("Error updating team settings:", error);
    throw error;
  }
};

export function TeamSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<TeamSettings | null>(null);

  const {
    data: currentSettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["team-settings"],
    queryFn: fetchTeamSettings,
  });

  // Handle data updates with useEffect
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateTeamSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      toast.success("Team settings updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update team settings");
    },
  });

  const handleSave = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  const handleCancel = () => {
    setSettings(currentSettings || null);
    setIsEditing(false);
  };

  const updateSetting = (
    section: keyof TeamSettings,
    key: string,
    value: any
  ) => {
    if (settings) {
      setSettings({
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading team settings...</div>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Failed to load team settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure team policies, permissions, and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!isEditing ? (
            <Button
              size="sm"
              className="bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* General Settings */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Building className="w-5 h-5 mr-2 text-blue-600" />
            General Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Basic team configuration and preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="teamName"
                className="text-sm font-medium text-gray-700"
              >
                Team Name
              </Label>
              <Input
                id="teamName"
                value={settings.general.teamName}
                onChange={(e) =>
                  updateSetting("general", "teamName", e.target.value)
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div>
              <Label
                htmlFor="maxMembers"
                className="text-sm font-medium text-gray-700"
              >
                Maximum Members
              </Label>
              <Input
                id="maxMembers"
                type="number"
                value={settings.general.maxMembers}
                onChange={(e) =>
                  updateSetting(
                    "general",
                    "maxMembers",
                    parseInt(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
          </div>
          <div>
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={settings.general.description}
              onChange={(e) =>
                updateSetting("general", "description", e.target.value)
              }
              disabled={!isEditing}
              className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Auto-assign Zones
                </Label>
                <p className="text-xs text-gray-500">
                  Automatically assign zones to new members
                </p>
              </div>
              <Switch
                checked={settings.general.autoAssignZones}
                onCheckedChange={(checked) =>
                  updateSetting("general", "autoAssignZones", checked)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Allow Cross-Zone Work
                </Label>
                <p className="text-xs text-gray-500">
                  Allow members to work in multiple zones
                </p>
              </div>
              <Switch
                checked={settings.general.allowCrossZoneWork}
                onCheckedChange={(checked) =>
                  updateSetting("general", "allowCrossZoneWork", checked)
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Permissions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure what team members can do
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Create Members
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow creating new team members
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canCreateMembers}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canCreateMembers", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Delete Members
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow removing team members
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canDeleteMembers}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canDeleteMembers", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Assign Zones
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow zone assignments
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canAssignZones}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canAssignZones", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    View Analytics
                  </Label>
                  <p className="text-xs text-gray-500">
                    Access performance data
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canViewAnalytics}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canViewAnalytics", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Export Data
                  </Label>
                  <p className="text-xs text-gray-500">
                    Download reports and data
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canExportData}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canExportData", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Manage Settings
                  </Label>
                  <p className="text-xs text-gray-500">
                    Modify team configuration
                  </p>
                </div>
                <Switch
                  checked={settings.permissions.canManageSettings}
                  onCheckedChange={(checked) =>
                    updateSetting("permissions", "canManageSettings", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Targets */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-600" />
            Performance Targets
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set performance goals and thresholds
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="dailyTarget"
                className="text-sm font-medium text-gray-700"
              >
                Daily Knock Target
              </Label>
              <Input
                id="dailyTarget"
                type="number"
                value={settings.performance.dailyKnockTarget}
                onChange={(e) =>
                  updateSetting(
                    "performance",
                    "dailyKnockTarget",
                    parseInt(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div>
              <Label
                htmlFor="weeklyTarget"
                className="text-sm font-medium text-gray-700"
              >
                Weekly Knock Target
              </Label>
              <Input
                id="weeklyTarget"
                type="number"
                value={settings.performance.weeklyKnockTarget}
                onChange={(e) =>
                  updateSetting(
                    "performance",
                    "weeklyKnockTarget",
                    parseInt(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div>
              <Label
                htmlFor="monthlyTarget"
                className="text-sm font-medium text-gray-700"
              >
                Monthly Knock Target
              </Label>
              <Input
                id="monthlyTarget"
                type="number"
                value={settings.performance.monthlyKnockTarget}
                onChange={(e) =>
                  updateSetting(
                    "performance",
                    "monthlyKnockTarget",
                    parseInt(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div>
              <Label
                htmlFor="conversionRate"
                className="text-sm font-medium text-gray-700"
              >
                Minimum Conversion Rate (%)
              </Label>
              <Input
                id="conversionRate"
                type="number"
                step="0.1"
                value={settings.performance.minimumConversionRate}
                onChange={(e) =>
                  updateSetting(
                    "performance",
                    "minimumConversionRate",
                    parseFloat(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div>
              <Label
                htmlFor="responseTime"
                className="text-sm font-medium text-gray-700"
              >
                Response Time Threshold (hours)
              </Label>
              <Input
                id="responseTime"
                type="number"
                step="0.1"
                value={settings.performance.responseTimeThreshold}
                onChange={(e) =>
                  updateSetting(
                    "performance",
                    "responseTimeThreshold",
                    parseFloat(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Settings */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-purple-600" />
            Zone Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure zone assignment and management
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label
                htmlFor="maxZones"
                className="text-sm font-medium text-gray-700"
              >
                Max Zones per Member
              </Label>
              <Input
                id="maxZones"
                type="number"
                value={settings.zones.maxZonesPerMember}
                onChange={(e) =>
                  updateSetting(
                    "zones",
                    "maxZonesPerMember",
                    parseInt(e.target.value)
                  )
                }
                disabled={!isEditing}
                className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Allow Zone Overlap
                  </Label>
                  <p className="text-xs text-gray-500">
                    Multiple members can work in same zone
                  </p>
                </div>
                <Switch
                  checked={settings.zones.allowZoneOverlap}
                  onCheckedChange={(checked) =>
                    updateSetting("zones", "allowZoneOverlap", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Auto-reassign Inactive
                  </Label>
                  <p className="text-xs text-gray-500">
                    Reassign zones from inactive members
                  </p>
                </div>
                <Switch
                  checked={settings.zones.autoReassignInactive}
                  onCheckedChange={(checked) =>
                    updateSetting("zones", "autoReassignInactive", checked)
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-red-600" />
            Notifications
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure alert and notification preferences
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  New Member Alerts
                </Label>
                <p className="text-xs text-gray-500">
                  Notify when new members join
                </p>
              </div>
              <Switch
                checked={settings.notifications.newMemberAlert}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "newMemberAlert", checked)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Performance Alerts
                </Label>
                <p className="text-xs text-gray-500">
                  Alert for low performance
                </p>
              </div>
              <Switch
                checked={settings.notifications.performanceAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "performanceAlerts", checked)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Zone Assignment Alerts
                </Label>
                <p className="text-xs text-gray-500">Notify of zone changes</p>
              </div>
              <Switch
                checked={settings.notifications.zoneAssignmentAlerts}
                onCheckedChange={(checked) =>
                  updateSetting(
                    "notifications",
                    "zoneAssignmentAlerts",
                    checked
                  )
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Weekly Reports
                </Label>
                <p className="text-xs text-gray-500">
                  Send weekly performance reports
                </p>
              </div>
              <Switch
                checked={settings.notifications.weeklyReports}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "weeklyReports", checked)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Monthly Reports
                </Label>
                <p className="text-xs text-gray-500">
                  Send monthly performance reports
                </p>
              </div>
              <Switch
                checked={settings.notifications.monthlyReports}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "monthlyReports", checked)
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicator */}
      {isEditing && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-800">
            You are currently editing team settings. Click "Save Changes" to
            apply your modifications.
          </span>
        </div>
      )}
    </div>
  );
}
