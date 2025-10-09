"use client";

import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecentAgent {
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  zone: string;
  addedDate: string;
}

interface RecentMembersCardProps {
  recentAgents: RecentAgent[];
}

export function RecentMembersCard({ recentAgents }: RecentMembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Recent Team Members
        </CardTitle>
        <CardDescription>Latest additions to your teams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAgents.map((agent, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-500">{agent.zone}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={agent.status === "ACTIVE" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {agent.status}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  {agent.addedDate}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
