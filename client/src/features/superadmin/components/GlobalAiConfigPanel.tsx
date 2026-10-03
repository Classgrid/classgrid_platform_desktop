import React, { useState, useEffect } from "react";
import { Button } from "@/components/marketing_ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/marketing_ui/dialog";
import { Input } from "@/components/marketing_ui/input";
import { Label } from "@/components/marketing_ui/label";
import { BlueSlider } from "@/components/marketing_ui/BlueSlider";
import { toast } from "sonner";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/apiClient";
import { Skeleton } from "@/components/marketing_ui/skeleton";

export function GlobalAiConfigPanel({ grantCreditsNode }: { grantCreditsNode?: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // State for Pools
  const [individualUsage, setIndividualUsage] = useState(100000);
  const [orgPool, setOrgPool] = useState(500000);
  const [images, setImages] = useState(20);
  const [whatsapp, setWhatsapp] = useState(10); // Added for UI parity
  const [creditsPerInr, setCreditsPerInr] = useState(3000);
  const [imageCost, setImageCost] = useState(5000);

  // Loading States
  const [openIndividual, setOpenIndividual] = useState(false);
  const [openOrg, setOpenOrg] = useState(false);
  const [openImages, setOpenImages] = useState(false);
  const [openWhatsapp, setOpenWhatsapp] = useState(false);
  const [openCreditsPerInr, setOpenCreditsPerInr] = useState(false);
  const [openImageCost, setOpenImageCost] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["globalAiConfig"],
    queryFn: async () => {
      const res = await api.get("/api/super-admin/ai-global-config");
      return res.data?.config;
    }
  });

  useEffect(() => {
    if (data) {
      setOrgPool(data.global_pro_pool_limit ?? 500000);
      setIndividualUsage(data.global_user_weekly_limit ?? 100000);
      setImages(data.global_image_weekly_limit ?? 20);
      setWhatsapp(data.global_whatsapp_scheduling_limit ?? 10);
      if (data.credits_per_inr !== undefined) setCreditsPerInr(data.credits_per_inr);
      if (data.image_generation_token_cost !== undefined) setImageCost(data.image_generation_token_cost);
    }
  }, [data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      const res = await api.put("/api/super-admin/ai-global-config", newConfig);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalAiConfig"] });
    },
    onError: () => {
      toast.error("Failed to update global config");
    }
  });

  const handleSave = (
    setOpen: (v: boolean) => void,
    successMessage: string
  ) => {
    updateConfigMutation.mutate({
      global_pro_pool_limit: orgPool,
      global_user_weekly_limit: individualUsage,
      global_image_weekly_limit: images,
      global_whatsapp_scheduling_limit: whatsapp,
      credits_per_inr: creditsPerInr,
      image_generation_token_cost: imageCost
    }, {
      onSuccess: () => {
        toast.success(successMessage);
        setOpen(false);
      }
    });
  };

  if (isLoading) {
    return <Skeleton className="w-full h-64 mb-6" />;
  }

  return (
    <>
      <div className="flex flex-col gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Global AI Fallback Limits</h2>
          <p className="text-sm text-muted-foreground">Manage global default limits and quotas for all organizations.</p>
        </div>

        <div className="p-0 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border-b border-border">
            {/* Individual Usage */}
            <Dialog open={openIndividual} onOpenChange={setOpenIndividual}>
              <DialogTrigger asChild>
                <button className="bg-card hover:bg-muted/30 p-5 flex flex-col gap-2 text-left transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Individual Daily Usage</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {individualUsage.toLocaleString()} <span className="text-sm font-normal text-muted-foreground ml-1">Tokens</span>
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Global Individual Limit</DialogTitle>
                  <DialogDescription>Adjust the global 7-day token limit for individuals.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold">Individual 7-Day Usage</Label>
                    <span className="text-sm font-bold text-blue-600">{individualUsage.toLocaleString()}</span>
                  </div>
                  <BlueSlider min={1000} max={500000} step={1000} value={individualUsage} onValueChange={setIndividualUsage} disabled={updateConfigMutation.isPending} />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setOpenIndividual(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                  <Button type="button" onClick={() => handleSave(setOpenIndividual, "Global individual limit saved successfully!")} disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Organization Pool */}
            <Dialog open={openOrg} onOpenChange={setOpenOrg}>
              <DialogTrigger asChild>
                <button className="bg-card hover:bg-muted/30 p-5 flex flex-col gap-2 text-left transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Organization Pool</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {orgPool.toLocaleString()} <span className="text-sm font-normal text-muted-foreground ml-1">Tokens</span>
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Global Organization Pool</DialogTitle>
                  <DialogDescription>Adjust the global shared token limit for organizations.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold">Organization Shared Pool</Label>
                    <span className="text-sm font-bold text-blue-600">{orgPool.toLocaleString()}</span>
                  </div>
                  <BlueSlider min={10000} max={5000000} step={10000} value={orgPool} onValueChange={setOrgPool} disabled={updateConfigMutation.isPending} />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setOpenOrg(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                  <Button type="button" onClick={() => handleSave(setOpenOrg, "Global organization pool limit saved successfully!")} disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {/* Image Generations */}
            <Dialog open={openImages} onOpenChange={setOpenImages}>
              <DialogTrigger asChild>
                <button className="bg-card hover:bg-muted/30 p-5 flex flex-col gap-2 text-left transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Image Generations</span>
                  <span className="text-xl font-bold text-foreground">
                    {images} <span className="text-sm font-normal text-muted-foreground ml-1">Images</span>
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Global Image Limits</DialogTitle>
                  <DialogDescription>Make changes to the global Image generation limits.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-4">
                  <Label htmlFor="images" className="text-sm font-medium">Image Generations</Label>
                  <Input 
                    id="images" 
                    type="number"
                    min={0}
                    value={images} 
                    onChange={(e) => setImages(Number(e.target.value))} 
                    placeholder="e.g. 20" 
                    disabled={updateConfigMutation.isPending}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setOpenImages(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                  <Button type="button" onClick={() => handleSave(setOpenImages, "Global image limit saved successfully!")} disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* WhatsApp Scheduling */}
            <Dialog open={openWhatsapp} onOpenChange={setOpenWhatsapp}>
              <DialogTrigger asChild>
                <button className="bg-card hover:bg-muted/30 p-5 flex flex-col gap-2 text-left transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">WhatsApp Scheduling</span>
                  <span className="text-xl font-bold text-foreground">
                    {whatsapp} <span className="text-sm font-normal text-muted-foreground ml-1">Messages</span>
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Global WhatsApp Limits</DialogTitle>
                  <DialogDescription>Make changes to the global WhatsApp Scheduling limits.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-4">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp Scheduling</Label>
                  <Input 
                    id="whatsapp" 
                    type="number"
                    min={0}
                    value={whatsapp} 
                    onChange={(e) => setWhatsapp(Number(e.target.value))} 
                    placeholder="e.g. 10" 
                    disabled={updateConfigMutation.isPending}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setOpenWhatsapp(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                  <Button type="button" onClick={() => handleSave(setOpenWhatsapp, "Global WhatsApp limit saved successfully!")} disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {grantCreditsNode}
      </div>

      <div className="flex flex-col gap-6 mb-6">
      {/* Credits per INR Panel */}
      <div className="border border-border rounded-xl shadow-sm bg-card flex flex-col justify-between">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Credits per INR</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Define how many tokens users receive per ₹1 purchased. Current: <strong>{creditsPerInr} Tokens/₹1</strong>
          </p>
        </div>
        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Dialog open={openCreditsPerInr} onOpenChange={setOpenCreditsPerInr}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Rate</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Pricing: Credits per INR</DialogTitle>
                <DialogDescription>Define how many tokens users receive per ₹1 purchased.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Label htmlFor="creditsPerInr" className="text-sm font-medium">Credits per INR</Label>
                <Input 
                  id="creditsPerInr" 
                  type="number"
                  min={1}
                  value={creditsPerInr} 
                  onChange={(e) => setCreditsPerInr(Number(e.target.value))} 
                  placeholder="e.g. 3000" 
                  disabled={updateConfigMutation.isPending}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpenCreditsPerInr(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                <Button type="button" onClick={() => handleSave(setOpenCreditsPerInr, "Global Pricing updated successfully!")} disabled={updateConfigMutation.isPending}>
                  {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Image Generation Token Cost Panel */}
      <div className="border border-border rounded-xl shadow-sm bg-card flex flex-col justify-between">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Image Generation Cost</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set how many tokens are deducted per AI image generation. Current: <strong>{imageCost} Tokens/Image</strong>
          </p>
        </div>
        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Dialog open={openImageCost} onOpenChange={setOpenImageCost}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Cost</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Image Generation Cost</DialogTitle>
                <DialogDescription>Set how many tokens are deducted per AI image generation.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Label htmlFor="imageCost" className="text-sm font-medium">Token Cost per Image</Label>
                <Input 
                  id="imageCost" 
                  type="number"
                  min={0}
                  value={imageCost} 
                  onChange={(e) => setImageCost(Number(e.target.value))} 
                  placeholder="e.g. 5000" 
                  disabled={updateConfigMutation.isPending}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpenImageCost(false)} disabled={updateConfigMutation.isPending}>Cancel</Button>
                <Button type="button" onClick={() => handleSave(setOpenImageCost, "Global Image Cost updated successfully!")} disabled={updateConfigMutation.isPending}>
                  {updateConfigMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </div>
    </>
  );
}
