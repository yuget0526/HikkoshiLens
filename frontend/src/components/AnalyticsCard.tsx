// 駅または指定地点周辺の分析カードコンポーネント
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AnalyticsCard({
  title,
  description,
  children,
}: AnalyticsCardProps): React.ReactElement {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children || (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  );
}
