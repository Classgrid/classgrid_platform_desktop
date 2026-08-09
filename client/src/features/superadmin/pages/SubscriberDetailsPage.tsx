import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/marketing_ui/badge";
import { Switch } from "@/components/marketing_ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

import { useSubscribers, useUpdateSubscriberPreferences } from "../queries/useSubscribers";
import { formatDate } from "@/utils/dateUtils";

function formatSubscriberDate(value?: string | null) {
  return value ? formatDate(value, "dd MMM, yyyy hh:mm a") : "—";
}

export function SubscriberDetailsPage() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useSubscribers({ q: email }, true);
  const updatePreferences = useUpdateSubscriberPreferences();

  const subscriber = data?.data?.find((s) => s.email === email);

  const handlePreferenceChange = (key: 'receives_blog' | 'receives_changelog' | 'receives_legal', checked: boolean) => {
    if (!subscriber) return;

    updatePreferences.mutate(
      { email: subscriber.email, preferences: { [key]: checked } },
      {
        onSuccess: () => {
          toast.success("Preferences updated successfully.");
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update preferences.");
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!subscriber) {
    return <div className="p-8">Subscriber not found.</div>;
  }

  // Optimistic UI state from cache or real state
  const receivesBlog = subscriber.receives_blog !== false;
  const receivesChangelog = subscriber.receives_changelog !== false;
  const receivesLegal = subscriber.receives_legal !== false;

  React.useEffect(() => {
    if (subscriber) {
      useBreadcrumbStore.getState().setItems([
        { label: "Subscribers", href: "/superadmin/subscribers" },
        { label: subscriber.email }
      ]);
    }
    return () => {
      useBreadcrumbStore.getState().setItems([]);
    };
  }, [subscriber]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">{subscriber.email}</h1>
          <p className="text-sm text-muted-foreground">Subscriber details and preferences</p>
        </div>
        <div className="ml-auto">
          {subscriber.is_active ? (
            <Badge variant="success" dot className="w-fit text-sm py-1">Active</Badge>
          ) : (
            <Badge variant="warning" className="w-fit text-sm py-1">Paused</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Information</CardTitle>
            <CardDescription>Timestamps and general information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Subscribed Date</span>
              <span className="text-sm font-medium">{formatSubscriberDate(subscriber.created_at)}</span>
            </div>
            {!subscriber.is_active && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paused Date</span>
                <span className="text-sm font-medium">{formatSubscriberDate(subscriber.updated_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>Manage exactly what emails they receive</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium">Blog Posts</span>
                <span className="text-xs text-muted-foreground">Receive updates when new articles are published.</span>
              </div>
              <Switch 
                checked={receivesBlog} 
                onCheckedChange={(checked) => handlePreferenceChange('receives_blog', checked)} 
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium">Product Changelogs</span>
                <span className="text-xs text-muted-foreground">Receive updates about new platform features.</span>
              </div>
              <Switch 
                checked={receivesChangelog} 
                onCheckedChange={(checked) => handlePreferenceChange('receives_changelog', checked)} 
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium">Legal Notices</span>
                <span className="text-xs text-muted-foreground">Receive required terms and policy updates.</span>
              </div>
              <Switch 
                checked={receivesLegal} 
                onCheckedChange={(checked) => handlePreferenceChange('receives_legal', checked)} 
                disabled={updatePreferences.isPending}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
