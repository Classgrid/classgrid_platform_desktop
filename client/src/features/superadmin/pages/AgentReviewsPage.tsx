import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { ThumbsDown, MessageSquare, ExternalLink, Calendar, Search, Filter, Building, ChevronDown, ChevronUp } from "lucide-react";
import { useAgentReviews } from "../queries/useAgentReviews";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/marketing_ui/badge";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { getSocket } from "@/lib/socketClient";
import { useQueryClient } from "@tanstack/react-query";
import { AgentReview } from "../services/superAdminApi";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import FilePreviewModal, { FilePreviewSource } from "@/components/ai/components/FilePreviewModal";

export function AgentReviewsPage() {
  const { data, isLoading, error } = useAgentReviews();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "down">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [previewFile, setPreviewFile] = useState<FilePreviewSource | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewReview = (newReview: AgentReview) => {
      queryClient.setQueryData<{ reviews: AgentReview[] }>(["ai-agent-reviews"], (old) => {
        if (!old) return { reviews: [newReview] };
        // Avoid duplicates just in case
        if (old.reviews.some(r => r.id === newReview.id)) return old;
        return {
          ...old,
          reviews: [newReview, ...old.reviews]
        };
      });
    };

    socket.on("new_agent_review", handleNewReview);

    return () => {
      socket.off("new_agent_review", handleNewReview);
    };
  }, [queryClient]);

  const reviews = data?.reviews || [];

  const filteredReviews = reviews.filter((review) => {
    const email = review.user_email || "";
    const name = review.user_details?.name || "";
    const org = review.user_details?.orgName || "";
    const text = review.feedback_text || "";

    const searchStr = searchTerm.toLowerCase();

    const matchesSearch =
      email.toLowerCase().includes(searchStr) ||
      name.toLowerCase().includes(searchStr) ||
      org.toLowerCase().includes(searchStr) ||
      text.toLowerCase().includes(searchStr);

    const matchesFilter = filterType === "all" || review.type === filterType;

    return matchesSearch && matchesFilter;
  });


  const downvotesCount = reviews.filter((r) => r.type === "down").length;
  const withFeedbackCount = reviews.filter((r) => r.feedback_text).length;

  // Group similar feedback
  // Grouping logic: Group by exact text OR by user_email
  const groupedReviews: Record<string, AgentReview[]> = {};
  filteredReviews.forEach((review) => {
    // We group by user email to keep all feedback from one user together
    const emailKey = review.user_email?.trim().toLowerCase() || "unknown";
    const textKey = review.feedback_text?.trim().toLowerCase();
    
    // We'll create a composite key. If they submit the exact same text, it's grouped.
    // If they submit multiple things, they are grouped under their email.
    // Let's just group by email primarily for now to satisfy the user's request.
    const groupKey = `user_${emailKey}`;
    
    if (!groupedReviews[groupKey]) {
      groupedReviews[groupKey] = [];
    }
    groupedReviews[groupKey].push(review);
  });

  // Sort groups: most recent first (using the latest review in each group)
  const sortedGroups = Object.entries(groupedReviews).sort(([, groupA], [, groupB]) => {
    const latestA = new Date(Math.max(...groupA.map(r => new Date(r.created_at).getTime())));
    const latestB = new Date(Math.max(...groupB.map(r => new Date(r.created_at).getTime())));
    return latestB.getTime() - latestA.getTime();
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const renderReviewContent = (review: AgentReview, isGroupChild = false) => (
    <div key={review.id} className={`flex flex-col md:flex-row border-l-4 ${isGroupChild ? 'border-t border-border/50 bg-background/50' : 'bg-card'} hover:bg-muted/10 transition-colors`} style={{
      borderLeftColor: '#f43f5e'
    }}>
      {/* Left Side: Meta info & User Profile */}
      <div className={`md:w-1/3 p-4 bg-muted/20 border-b md:border-b-0 md:border-r border-border flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-0">
            <ThumbsDown className="h-3 w-3 mr-1" /> Negative Feedback
          </Badge>
          <div className="flex items-center text-muted-foreground text-xs font-medium">
            <Calendar className="h-3 w-3 mr-1" />
            <span title={format(new Date(review.created_at), 'PPpp')}>
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={review.user_details?.profilePicture} alt={review.user_details?.name || review.user_email} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {review.user_details?.name ? review.user_details.name.charAt(0).toUpperCase() : review.user_email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">
              {review.user_details?.name || "Unknown User"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {review.user_email}
            </span>
            {review.user_details && (
              <div className="flex items-center gap-1 mt-1">
                <Building className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {review.user_details.orgName}
                </span>
              </div>
            )}
          </div>
        </div>

        {review.user_details && (
          <div className="mt-auto pt-2 border-t border-border/50">
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">User ID</span>
            <code className="text-xs text-muted-foreground break-all">
              {review.user_details.id}
            </code>
          </div>
        )}

        <div className="pt-2">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">Message ID</span>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded break-all">
            {review.message_id}
          </code>
        </div>
      </div>

      {/* Right Side: Content */}
      <div className={`md:w-2/3 p-4 flex flex-col ${isGroupChild ? 'bg-transparent' : ''}`}>
        {review.feedback_text ? (
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
              Written Feedback
            </h4>
            <p className="text-sm bg-muted/30 p-3 rounded-md italic border border-muted/50 text-foreground/90 whitespace-pre-wrap">
              "{review.feedback_text}"
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic py-4">
            No written feedback provided.
          </div>
        )}

        {review.file_url && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            {review.file_url.split(',').map((url, i) => {
              const trimmedUrl = url.trim();
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(trimmedUrl) || trimmedUrl.includes('firebasestorage.googleapis.com');
              return (
                <div key={i}>
                  {isImage ? (
                    <img 
                      src={trimmedUrl} 
                      alt="Feedback attachment" 
                      onClick={() => setPreviewFile({ name: `Attachment ${i+1}`, src: trimmedUrl })}
                      className="max-w-xs max-h-48 rounded-md border border-border object-cover hover:opacity-80 transition-opacity cursor-pointer" 
                    />
                  ) : (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center" 
                      onClick={() => setPreviewFile({ name: `Attachment ${i+1}`, src: trimmedUrl })}
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      View Attached File {review.file_url!.split(',').length > 1 ? `(${i + 1})` : ''}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs items={[
        { label: "Agent Reviews" }
      ]} />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Negative Feedback</CardTitle>
            <ThumbsDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{downvotesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Written Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{withFeedbackCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Attachments</CardTitle>
            <ExternalLink className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{reviews.filter(r => r.file_url).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/40">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, org, or text..."
              className="pl-8 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground mr-2" />
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "down" ? "default" : "outline"}
              size="sm"
              className={filterType === "down" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
              onClick={() => setFilterType("down")}
            >
              <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
              Negative
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 bg-muted/20 p-4 border-b md:border-b-0 md:border-r border-border/50 flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                  <div className="md:w-2/3 p-4 flex flex-col space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-500">Failed to load reviews.</div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No reviews found matching your criteria.</div>
        ) : (
          sortedGroups.map(([groupKey, groupReviews]) => {
            const isGroup = groupReviews.length > 1;
            const primaryReview = groupReviews[0];
            const isExpanded = expandedGroups[groupKey];

            return (
              <Card key={groupKey} className="overflow-hidden hover:shadow-md transition-shadow">

                {/* Main Visible Item */}
                {renderReviewContent(primaryReview)}

                {/* Group Expansion Toggle */}
                {isGroup && (
                  <div className="border-t border-border bg-muted/20">
                    <Button
                      variant="ghost"
                      className="w-full rounded-none h-12 text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide {groupReviews.length - 1} other {groupReviews.length - 1 === 1 ? 'review' : 'reviews'} from this user
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show {groupReviews.length - 1} more {groupReviews.length - 1 === 1 ? 'review' : 'reviews'} from this user
                        </>
                      )}
                    </Button>

                    {/* Expanded Children */}
                    {isExpanded && (
                      <div className="flex flex-col bg-muted/10 border-t border-border">
                        {groupReviews.slice(1).map(childReview => renderReviewContent(childReview, true))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

