"use client";

import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TeamPerformance {
  teamName: string;
  completionRate: number;
  avgKnocks: number;
  memberCount: number;
}

interface TeamPerformanceCardProps {
  teamPerformance: TeamPerformance[];
}

export function TeamPerformanceCard({
  teamPerformance,
}: TeamPerformanceCardProps) {
  // Function to get progress bar color based on completion rate
  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return "bg-gradient-to-r from-green-500 to-emerald-600";
    if (rate >= 60) return "bg-gradient-to-r from-blue-500 to-cyan-600";
    if (rate >= 40) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    if (rate >= 20) return "bg-gradient-to-r from-orange-500 to-red-500";
    return "bg-gradient-to-r from-red-500 to-rose-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Team Performance
        </CardTitle>
        <CardDescription>Performance metrics for all teams</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamPerformance.map((team, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{team.teamName}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{team.memberCount} members</Badge>
                <span className="text-sm text-gray-500">
                  {team.avgKnocks} avg knocks
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{team.completionRate}%</span>
              </div>
              {/* Custom colored progress bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-500 ${getProgressBarColor(
                    team.completionRate
                  )}`}
                  style={{ width: `${team.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
