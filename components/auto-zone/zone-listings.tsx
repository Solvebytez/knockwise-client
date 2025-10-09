"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Grid3X3,
  MapPin,
  Building2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import {
  GridBlock,
  fetchBlockDetails,
  updateBlockWithData,
  setBlockLoading,
} from "@/lib/gridSubdivision";

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

interface ZoneListingsProps {
  zones: ZoneListing[];
  onZoneSelect: (zone: ZoneListing) => void;
  gridBlocks?: GridBlock[];
  onGridBlocksUpdate?: (blocks: GridBlock[]) => void;
  onBlockFocus?: (block: GridBlock) => void;
}

export function ZoneListings({
  zones,
  onZoneSelect,
  gridBlocks = [],
  onGridBlocksUpdate,
  onBlockFocus,
}: ZoneListingsProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [selectedBlockForModal, setSelectedBlockForModal] =
    useState<GridBlock | null>(null);

  const handleBlockDetails = async (block: GridBlock) => {
    if (block.isLoading || block.isDataLoaded) return;

    // Set loading state
    if (onGridBlocksUpdate) {
      const updatedBlocks = setBlockLoading(gridBlocks, block.id, true);
      onGridBlocksUpdate(updatedBlocks);
    }

    try {
      // Fetch block details
      const data = await fetchBlockDetails(block);

      // Update block with fetched data
      if (onGridBlocksUpdate) {
        const updatedBlocks = updateBlockWithData(gridBlocks, block.id, data);
        onGridBlocksUpdate(updatedBlocks);
      }

      // Expand the block to show data
      setExpandedBlocks((prev) => new Set(prev).add(block.id));
    } catch (error) {
      console.error(`Failed to fetch details for ${block.name}:`, error);
      // Reset loading state on error
      if (onGridBlocksUpdate) {
        const updatedBlocks = setBlockLoading(gridBlocks, block.id, false);
        onGridBlocksUpdate(updatedBlocks);
      }
    }
  };

  const toggleBlockExpansion = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const handleBlockClick = (block: GridBlock) => {
    if (onBlockFocus) {
      onBlockFocus(block);
    }
  };
  return (
    <div className="bg-white border-t border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Grid Blocks</h3>
          <div className="text-sm text-gray-500">
            {gridBlocks.length} blocks
          </div>
        </div>

        {/* Grid Blocks List */}
        {gridBlocks.length > 0 && (
          <div className="space-y-2">
            {gridBlocks.map((block) => {
              const isExpanded = expandedBlocks.has(block.id);
              const hasData =
                block.isDataLoaded && block.streets && block.buildings;

              return (
                <Card
                  key={block.id}
                  className="p-3 border-purple-200 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    {/* Block Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleBlockClick(block)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {block.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {block.area.toFixed(3)} km²
                        </div>
                        <div className="text-xs text-gray-400">
                          {block.center.lat.toFixed(4)},{" "}
                          {block.center.lng.toFixed(4)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-2">
                        {!block.isDataLoaded && !block.isLoading && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockDetails(block)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Get Details
                          </Button>
                        )}

                        {block.isLoading && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Loading...
                          </Button>
                        )}

                        {hasData && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleBlockExpansion(block.id)}
                              className="text-xs px-2 py-1 h-6"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    setSelectedBlockForModal(block)
                                  }
                                  className="text-xs px-2 py-1 h-6 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                    Block Details: {block.name}
                                  </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* Block Info */}
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                      Block Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Area:
                                        </span>{" "}
                                        {block.area.toFixed(3)} km²
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Center:
                                        </span>{" "}
                                        {block.center.lat.toFixed(4)},{" "}
                                        {block.center.lng.toFixed(4)}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Total Streets:
                                        </span>{" "}
                                        {block.streets?.length || 0}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Total Buildings:
                                        </span>{" "}
                                        {block.buildings?.length || 0}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Streets Details */}
                                  {block.streets &&
                                    block.streets.length > 0 && (
                                      <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                          <MapPin className="w-5 h-5 text-blue-500" />
                                          Streets ({block.streets.length})
                                        </h3>
                                        <div className="space-y-3">
                                          {block.streets.map(
                                            (street, index) => (
                                              <div
                                                key={index}
                                                className="border border-gray-200 rounded-lg p-4"
                                              >
                                                <div className="flex items-center justify-between mb-2">
                                                  <h4 className="font-medium text-gray-800">
                                                    {street.name}
                                                  </h4>
                                                  <Badge variant="secondary">
                                                    {street.totalBuildings}{" "}
                                                    buildings
                                                  </Badge>
                                                </div>
                                                {street.buildingNumbers.length >
                                                  0 && (
                                                  <div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                      Building Numbers:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                      {street.buildingNumbers.map(
                                                        (number, numIndex) => (
                                                          <Badge
                                                            key={numIndex}
                                                            variant="outline"
                                                            className="text-xs"
                                                          >
                                                            {number}
                                                          </Badge>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Buildings Details */}
                                  {block.buildings &&
                                    block.buildings.length > 0 && (
                                      <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                          <Building2 className="w-5 h-5 text-green-500" />
                                          Buildings ({block.buildings.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {block.buildings.map(
                                            (building, index) => (
                                              <div
                                                key={index}
                                                className="border border-gray-200 rounded-lg p-3"
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-medium text-gray-800">
                                                    {building.number}{" "}
                                                    {building.street}
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {building.type}
                                                  </Badge>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  {building.coordinates.lat.toFixed(
                                                    6
                                                  )}
                                                  ,{" "}
                                                  {building.coordinates.lng.toFixed(
                                                    6
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* No Data Message */}
                                  {(!block.streets ||
                                    block.streets.length === 0) &&
                                    (!block.buildings ||
                                      block.buildings.length === 0) && (
                                      <div className="text-center py-8 text-gray-500">
                                        <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>
                                          No street or building data detected
                                          for this block.
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Block Data (Expandable) */}
                    {isExpanded && hasData && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {/* Streets Summary */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Streets ({block.streets?.length || 0})
                            </span>
                          </div>

                          {block.streets && block.streets.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {block.streets.map((street, index) => (
                                <div
                                  key={index}
                                  className="text-xs bg-gray-50 p-2 rounded"
                                >
                                  <div className="font-medium text-gray-800">
                                    {street.name}
                                  </div>
                                  <div className="text-gray-600">
                                    {street.totalBuildings} buildings
                                  </div>
                                  {street.buildingNumbers.length > 0 && (
                                    <div className="text-gray-500 mt-1">
                                      Numbers:{" "}
                                      {street.buildingNumbers
                                        .slice(0, 10)
                                        .join(", ")}
                                      {street.buildingNumbers.length > 10 &&
                                        "..."}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Buildings Summary */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Buildings ({block.buildings?.length || 0})
                            </span>
                          </div>

                          {block.buildings && block.buildings.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Total buildings found in this block
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State - Only show if no grid blocks */}
        {gridBlocks.length === 0 && (
          <div className="text-center py-8">
            <Grid3X3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Grid Blocks
            </h3>
            <p className="text-gray-500 text-sm">
              Select a community and click "Split Blocks" to generate grid
              blocks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
