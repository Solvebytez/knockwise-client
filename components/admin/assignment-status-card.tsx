"use client";

import { CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AssignmentStatus {
  activeAssignments: number;
  scheduledAssignments: number;
  completedThisWeek: number;
  pendingApproval: number;
  overdueAssignments: number;
}

interface AssignmentStatusCardProps {
  assignmentStatus: AssignmentStatus;
}

export function AssignmentStatusCard({
  assignmentStatus,
}: AssignmentStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Assignment Status
        </CardTitle>
        <CardDescription>Current assignment overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {assignmentStatus.activeAssignments}
            </div>
            <div className="text-sm text-gray-600">Active Assignments</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {assignmentStatus.scheduledAssignments}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed This Week</span>
            <Badge variant="default">
              {assignmentStatus.completedThisWeek}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Pending Approval</span>
            <Badge variant="secondary">
              {assignmentStatus.pendingApproval}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Overdue Assignments</span>
            <Badge variant="destructive">
              {assignmentStatus.overdueAssignments}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
