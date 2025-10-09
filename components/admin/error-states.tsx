"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
  description = "There was an error loading the data. Please try again.",
}: ErrorStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "An unexpected error occurred"}
          </AlertDescription>
        </Alert>
        {onRetry && (
          <div className="mt-4">
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardErrorState({
  error,
  onRetry,
}: {
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-16 w-16 mx-auto text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Failed to Load Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            We couldn't load your dashboard data. Please check your connection
            and try again.
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
