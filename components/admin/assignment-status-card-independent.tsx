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
import { useAssignmentStatus } from "@/hooks/use-admin-dashboard";
import { AssignmentStatusSkeleton } from "./skeleton-loading";

interface AssignmentStatus {
  activeAssignments: number;
  scheduledAssignments: number;
  completedThisWeek: number;
  pendingApproval: number;
  overdueAssignments: number;
}

export function AssignmentStatusCardIndependent() {
  const assignmentStatus = useAssignmentStatus();

  if (assignmentStatus.isLoading) {
    return <AssignmentStatusSkeleton />;
  }

  if (assignmentStatus.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Assignment Status
          </CardTitle>
          <CardDescription>Current assignment overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              Failed to load assignment status
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = assignmentStatus.data || {
    activeAssignments: 0,
    scheduledAssignments: 0,
    completedThisWeek: 0,
    pendingApproval: 0,
    overdueAssignments: 0,
  };

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
              {data.activeAssignments}
            </div>
            <div className="text-sm text-gray-600">Active Assignments</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {data.scheduledAssignments}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed This Week</span>
            <Badge variant="default">{data.completedThisWeek}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Pending Approval</span>
            <Badge variant="secondary">{data.pendingApproval}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Overdue Assignments</span>
            <Badge variant="destructive">{data.overdueAssignments}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
