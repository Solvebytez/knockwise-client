"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TodayActivity {
  totalVisits: number;
  appointmentsSet: number;
  callbacks: number;
  notInterested: number;
  noAnswer: number;
  leads: number;
}

interface ActivitySummaryCardProps {
  todayActivity: TodayActivity;
}

export function ActivitySummaryCard({
  todayActivity,
}: ActivitySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Today's Activity
        </CardTitle>
        <CardDescription>Real-time activity summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {todayActivity.totalVisits}
            </div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {todayActivity.appointmentsSet}
            </div>
            <div className="text-sm text-gray-600">Appointments Set</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {todayActivity.callbacks}
            </div>
            <div className="text-sm text-gray-600">Callbacks</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {todayActivity.leads}
            </div>
            <div className="text-sm text-gray-600">New Leads</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
