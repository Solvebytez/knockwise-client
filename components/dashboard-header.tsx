"use client";

import { Search, Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/store/userStore";
import { LogoutService } from "@/lib/logoutService";

export function DashboardHeader() {
  const { user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await LogoutService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback to force logout
      LogoutService.forceLogout();
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on user name
  const getAvatarColor = () => {
    if (!user?.name) return "bg-[#42A5F5]";

    const colors = [
      "bg-[#42A5F5]", // Blue
      "bg-[#10B981]", // Green
      "bg-[#F59E0B]", // Yellow
      "bg-[#EF4444]", // Red
      "bg-[#8B5CF6]", // Purple
      "bg-[#06B6D4]", // Cyan
      "bg-[#F97316]", // Orange
      "bg-[#EC4899]", // Pink
    ];

    const nameHash = user.name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  // Get display name
  const getDisplayName = () => {
    if (!user?.name) return "User";
    return user.name;
  };

  return (
    <header className="bg-white border-b border-gray-200/60 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Logo height={48} />
        </div>

        {/* Search Bar */}
        {/* <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <Input 
              placeholder="Search" 
              className="pl-10 bg-gray-50/50 border-gray-200/60 focus:border-[#42A5F5] focus:ring-1 focus:ring-[#42A5F5]/20 transition-all duration-200" 
            />
          </div>
        </div> */}

        {/* Right Side - Notifications, Settings, Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-gray-100/80 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 shadow-lg border-gray-100"
            >
              <div className="p-4">
                <h4 className="font-semibold mb-2 text-gray-900">
                  Notifications
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded text-sm border border-blue-100">
                    New sales rep added to Gandhi Nagar territory
                  </div>
                  <div className="p-2 bg-green-50 rounded text-sm border border-green-100">
                    154 leads collected today
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100/80 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg border-gray-100">
              <DropdownMenuItem className="hover:bg-gray-50">
                <User className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-50">Privacy Policy</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-2 hover:bg-gray-100/80 transition-colors"
              >
                <Avatar
                  className={`w-8 h-8 ring-2 ${getAvatarColor().replace(
                    "bg-",
                    "ring-"
                  )}/10`}
                >
                  <AvatarFallback
                    className={`${getAvatarColor()} text-white font-medium`}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {getDisplayName()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="shadow-lg border-gray-100"
            >
              <DropdownMenuItem className="hover:bg-gray-50">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem className="hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="hover:bg-gray-50 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
