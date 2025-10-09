"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ZoneListings, ZoneMap } from "@/components/auto-zone";
import { TRREBStyleFilters } from "@/components/auto-zone/trreb-style-filters";
import {
  fetchCommunityBoundary,
  CommunityBoundary,
} from "@/lib/freeLocationData";
import { GridBlock } from "@/lib/gridSubdivision";

interface ZoneListing {
  id: string;
  name: string;
  address: string;
  type: string;
  houses: number;
  area: number;
  price: string;
  daysOnMarket: number;
  mlsNumber: string;
  status: "active" | "sale" | "pending";
  image: string;
}

export default function AutoZoneCreationPage() {
  const [selectedZone, setSelectedZone] = useState<ZoneListing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [communityBoundary, setCommunityBoundary] =
    useState<CommunityBoundary | null>(null);
  const [isBoundaryLoading, setIsBoundaryLoading] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [gridBlocks, setGridBlocks] = useState<GridBlock[]>([]);

  // Dynamic zone data based on selected community and grid blocks
  const getDynamicZones = (): ZoneListing[] => {
    if (gridBlocks.length > 0) {
      // Show grid blocks as zones
      return gridBlocks.map((block, index) => ({
        id: block.id,
        name: block.name,
        address: `${
          communityBoundary?.name || "Community"
        }, ${block.center.lat.toFixed(4)}, ${block.center.lng.toFixed(4)}`,
        type: `Grid Block • ${block.area.toFixed(3)} km²`,
        houses: Math.floor(Math.random() * 20) + 5, // Random house count for demo
        area: block.area,
        price: `$${(Math.random() * 500 + 500).toFixed(0)}K`, // Random price for demo
        daysOnMarket: Math.floor(Math.random() * 30) + 1,
        mlsNumber: `G${(index + 1).toString().padStart(3, "0")}`,
        status: "active" as const,
        image: "/placeholder.jpg",
      }));
    } else if (communityBoundary) {
      // Show community info as a single zone
      return [
        {
          id: communityBoundary.name,
          name: communityBoundary.name,
          address: `${communityBoundary.name} Community`,
          type: `Community • ${(
            (communityBoundary.bounds.north - communityBoundary.bounds.south) *
            111 *
            (communityBoundary.bounds.east - communityBoundary.bounds.west) *
            111 *
            Math.cos((communityBoundary.center.lat * Math.PI) / 180)
          ).toFixed(2)} km²`,
          houses: Math.floor(Math.random() * 100) + 50, // Random house count for demo
          area:
            (communityBoundary.bounds.north - communityBoundary.bounds.south) *
            111 *
            (communityBoundary.bounds.east - communityBoundary.bounds.west) *
            111 *
            Math.cos((communityBoundary.center.lat * Math.PI) / 180),
          price: `$${(Math.random() * 300 + 600).toFixed(0)}K`, // Random price for demo
          daysOnMarket: Math.floor(Math.random() * 20) + 5,
          mlsNumber: `C${communityBoundary.name.substring(0, 3).toUpperCase()}`,
          status: "active" as const,
          image: "/placeholder.jpg",
        },
      ];
    } else {
      // No community selected - show empty state
      return [];
    }
  };

  const zones = getDynamicZones();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In real app, this would trigger API search
    console.log("Searching for:", query);
  };

  const handleFiltersChange = useCallback((filters: any) => {
    // In real app, this would update the search criteria
    console.log("Filters changed:", filters);
  }, []);

  const handleZoneSelect = (zone: ZoneListing) => {
    setSelectedZone(zone);
    toast.success(`Selected zone: ${zone.name}`);
  };

  const handleCommunityBoundaryRequest = useCallback(
    async (communityName: string, municipalityName?: string) => {
      setIsBoundaryLoading(true);
      setBoundaryError(null);

      try {
        const boundary = await fetchCommunityBoundary(
          communityName,
          municipalityName
        );

        if (boundary) {
          setCommunityBoundary(boundary);
          let sourceText = "";
          if (boundary.source === "fallback") {
            sourceText = " (approximate)";
          } else if (boundary.source === "google") {
            sourceText = " (Google Places)";
          }
          toast.success(
            `Community boundary loaded: ${communityName}${sourceText}`
          );
        } else {
          setBoundaryError(
            `No actual boundary coordinates found for ${communityName}. Google Places API did not provide viewport or bounds data for this location.`
          );
          toast.error(`No boundary coordinates available for ${communityName}`);
        }
      } catch (error) {
        const errorMessage = `Failed to load boundary for ${communityName}`;
        setBoundaryError(errorMessage);
        toast.error(errorMessage);
        console.error("Boundary fetch error:", error);
      } finally {
        setIsBoundaryLoading(false);
      }
    },
    []
  );

  const handleGridBlocksGenerated = useCallback((blocks: GridBlock[]) => {
    setGridBlocks(blocks);
    if (blocks.length > 0) {
      toast.success(`Generated ${blocks.length} grid blocks`);
    } else {
      toast.info("Grid blocks cleared");
    }
  }, []);

  const handleGridBlocksUpdate = useCallback((blocks: GridBlock[]) => {
    setGridBlocks(blocks);
  }, []);

  const handleBlockFocus = useCallback((block: GridBlock) => {
    // This will be handled by the ZoneMap component
    console.log(`Focusing on block: ${block.name}`);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters and Listings */}
        <div className="w-96 flex flex-col border-r border-gray-200 bg-white">
          {/* Search Filters */}
          <div className="flex-shrink-0">
            <TRREBStyleFilters
              onFiltersChange={handleFiltersChange}
              onCommunityBoundaryRequest={handleCommunityBoundaryRequest}
            />
          </div>

          {/* Zone Listings */}
          <div className="flex-1 overflow-hidden">
            <ZoneListings
              zones={zones}
              onZoneSelect={handleZoneSelect}
              gridBlocks={gridBlocks}
              onGridBlocksUpdate={handleGridBlocksUpdate}
              onBlockFocus={handleBlockFocus}
            />
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1">
          <ZoneMap
            selectedZone={selectedZone}
            onZoneSelect={handleZoneSelect}
            communityBoundary={communityBoundary}
            isBoundaryLoading={isBoundaryLoading}
            boundaryError={boundaryError}
            onGridBlocksGenerated={handleGridBlocksGenerated}
            gridBlocks={gridBlocks}
            onGridBlocksUpdate={handleGridBlocksUpdate}
          />
        </div>
      </div>
    </div>
  );
}
