"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for metric cards
export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for metrics overview
export function MetricsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Loading skeleton for team performance card
export function TeamPerformanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for activity summary card
export function ActivitySummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for recent members card
export function RecentMembersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for territory status card
export function TerritoryStatusSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex justify-between text-sm">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for assignment status card
export function AssignmentStatusSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for chart placeholders
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Skeleton className="h-12 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Full dashboard loading skeleton
export function DashboardLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Metrics Grid Skeleton */}
      <MetricsOverviewSkeleton />

      {/* Performance Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformanceSkeleton />
        <ActivitySummarySkeleton />
      </div>

      {/* Recent Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentMembersSkeleton />
      </div>

      {/* Territory & Assignment Status Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerritoryStatusSkeleton />
        <AssignmentStatusSkeleton />
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
