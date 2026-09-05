/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = "up",
}: {
  title: string;
  value: string | number;
  icon?: any;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          React.isValidElement(Icon) ? (
            <div className="text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">
              {Icon}
            </div>
          ) : (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
