"use client";

import { BarChart3, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChartPlaceholderProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export function ChartPlaceholder({
  title,
  description,
  icon: Icon,
  iconColor,
}: ChartPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <Icon className="h-12 w-12 mx-auto mb-2" />
            <p>Chart will be implemented here</p>
            <p className="text-sm">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
