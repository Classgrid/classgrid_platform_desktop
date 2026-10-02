import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { Settings, Save, AlertCircle } from "lucide-react";
import { Input } from "@/components/marketing_ui/input";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/apiClient";
import { Skeleton } from "@/components/marketing_ui/skeleton";

export function GlobalAiConfigPanel() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    defaultOrgProPoolLimit: 500000,
    defaultUserWeeklyFreeLimit: 100000,
    defaultUserWeeklyImageLimit: 20
  });

  const { data, isLoading } = useQuery({
    queryKey: ["globalAiConfig"],
    queryFn: async () => {
      // Create an endpoint in the super-admin ai usage controller to get config
      const res = await api.get("/api/v1/super-admin/ai/config");
      return res.data?.data;
    }
  });

  useEffect(() => {
    if (data) {
      setConfig({
        defaultOrgProPoolLimit: data.default_org_pro_pool_limit || 500000,
        defaultUserWeeklyFreeLimit: data.default_user_weekly_free_limit || 100000,
        defaultUserWeeklyImageLimit: data.default_user_weekly_image_limit || 20
      });
    }
  }, [data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      const res = await api.put("/api/v1/super-admin/ai/config", newConfig);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Global AI Limits updated successfully");
      queryClient.invalidateQueries({ queryKey: ["globalAiConfig"] });
    },
    onError: () => {
      toast.error("Failed to update global config");
    }
  });

  const handleSave = () => {
    updateConfigMutation.mutate({
      default_org_pro_pool_limit: config.defaultOrgProPoolLimit,
      default_user_weekly_free_limit: config.defaultUserWeeklyFreeLimit,
      default_user_weekly_image_limit: config.defaultUserWeeklyImageLimit
    });
  };

  const handleNumberChange = (field: string, value: string) => {
    const num = parseInt(value.replace(/,/g, ''), 10);
    if (!isNaN(num)) {
      setConfig(prev => ({ ...prev, [field]: num }));
    } else if (value === "") {
      setConfig(prev => ({ ...prev, [field]: 0 }));
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-64 mb-6" />;
  }

  return (
    <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
          <Settings className="w-5 h-5" />
          Global AI Fallback Limits
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These limits act as the default across the entire platform for newly created organizations and users. 
          Custom overrides set on specific organizations will bypass these global limits.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Organization Monthly Pro Pool</label>
            <div className="relative">
              <Input 
                value={new Intl.NumberFormat('en-IN').format(config.defaultOrgProPoolLimit)} 
                onChange={(e) => handleNumberChange("defaultOrgProPoolLimit", e.target.value)}
                className="pl-4 font-mono font-bold text-amber-600 dark:text-amber-400"
              />
            </div>
            <p className="text-xs text-muted-foreground">Default shared pool for entire orgs</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">User Weekly Free Pool</label>
            <div className="relative">
              <Input 
                value={new Intl.NumberFormat('en-IN').format(config.defaultUserWeeklyFreeLimit)} 
                onChange={(e) => handleNumberChange("defaultUserWeeklyFreeLimit", e.target.value)}
                className="pl-4 font-mono font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
            <p className="text-xs text-muted-foreground">Weekly free tokens per individual user</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">User Weekly Free Images</label>
            <div className="relative">
              <Input 
                value={new Intl.NumberFormat('en-IN').format(config.defaultUserWeeklyImageLimit)} 
                onChange={(e) => handleNumberChange("defaultUserWeeklyImageLimit", e.target.value)}
                className="pl-4 font-mono font-bold text-purple-600 dark:text-purple-400"
              />
            </div>
            <p className="text-xs text-muted-foreground">Weekly free image generations</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md">
            <AlertCircle className="w-4 h-4" />
            Changes apply globally immediately.
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateConfigMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateConfigMutation.isPending ? "Saving..." : "Save Global Limits"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
