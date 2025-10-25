"use client";

import { useParams } from "next/navigation";
import { TerritoryMapView } from "@/components/territory-map-view";

export default function AgentTerritoryMapViewPage() {
  const params = useParams();
  const territoryId = params.territory_id as string;

  return <TerritoryMapView territoryId={territoryId} />;
}

















