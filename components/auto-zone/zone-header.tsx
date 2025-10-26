"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  MapPin,
  Filter,
  Download,
  Upload,
  Plus,
  MoreHorizontal,
} from "lucide-react";

interface ZoneHeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
}

export function ZoneHeader({ onSearch, onFilterChange }: ZoneHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsumer, setSelectedConsumer] = useState("Consumer");
  const [selectedSearches, setSelectedSearches] = useState("Searches");
  const [selectedActions, setSelectedActions] = useState("Actions");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleRemoveShapes = () => {
    // Handle remove shapes action
    console.log("Remove shapes clicked");
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">KNOCKWISE</span>
          </div>

          <nav className="flex items-center space-x-6">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600"
            >
              Search
            </Button>
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600"
            >
              Contacts
            </Button>
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600"
            >
              Documents
            </Button>
          </nav>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search zones, properties, or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Right Section - Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Dropdown Menus */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {selectedConsumer}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setSelectedConsumer("Consumer")}
                >
                  Consumer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedConsumer("Agent")}>
                  Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedConsumer("Admin")}>
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {selectedSearches}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setSelectedSearches("Searches")}
                >
                  All Searches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedSearches("Recent")}>
                  Recent Searches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedSearches("Saved")}>
                  Saved Searches
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {selectedActions}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedActions("Actions")}>
                  All Actions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedActions("Create")}>
                  Create Zone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedActions("Edit")}>
                  Edit Zone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedActions("Delete")}>
                  Delete Zone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveShapes}
              className="flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              Remove shapes
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Zone
            </Button>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Help</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Secondary Actions Bar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Auto Zone Creation
          </Badge>
          <span className="text-sm text-gray-600">
            Create and manage sales territories automatically
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4 mr-1" />
            More Options
          </Button>
        </div>
      </div>
    </div>
  );
}
