import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { ThumbsDown, MessageSquare, ExternalLink, Calendar, Search, Filter, Building, ChevronDown, ChevronUp, ChevronRight, Home, ArrowLeft } from "lucide-react";
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
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";

interface PathState {
  role?: string;
  org?: string;
  email?: string;
  date?: string;
}

const FolderIcon = ({ label, subtitle, onClick, badge }: { label: string, subtitle?: string, onClick: () => void, badge: number }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-start p-4 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border group h-36 relative"
  >
    <div className="relative mb-3">
      {/* Windows-style folder icon SVG */}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 group-hover:text-amber-500 transition-colors drop-shadow-sm">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
        {badge}
      </div>
    </div>
    <span className="text-sm font-medium text-foreground line-clamp-2 w-full text-center leading-tight px-1">{label}</span>
    {subtitle && <span className="text-xs text-muted-foreground truncate w-full text-center mt-1 px-1">{subtitle}</span>}
  </button>
);

export function AgentReviewsPage() {
  const { data, isLoading, error } = useAgentReviews();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "down">("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | undefined>();
  const [previewFile, setPreviewFile] = useState<FilePreviewSource | null>(null);

  // Navigation State
  const [path, setPath] = useState<PathState>({});

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewReview = (newReview: AgentReview) => {
      queryClient.setQueryData<{ reviews: AgentReview[] }>(["ai-agent-reviews"], (old) => {
        if (!old) return { reviews: [newReview] };
        return { reviews: [newReview, ...old.reviews] };
      });
    };
    socket.on("new_agent_review", handleNewReview);
    return () => {
      socket.off("new_agent_review", handleNewReview);
    };
  }, [queryClient]);

  const reviews = data?.reviews || [];
  const downvotesCount = reviews.filter((r) => r.type === "down").length;
  const withFeedbackCount = reviews.filter((r) => r.feedback_text).length;

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filterType !== "all" && review.type !== filterType) return false;
      
      if (selectedDateFilter) {
        const reviewDate = new Date(review.created_at);
        if (
          reviewDate.getFullYear() !== selectedDateFilter.getFullYear() ||
          reviewDate.getMonth() !== selectedDateFilter.getMonth() ||
          reviewDate.getDate() !== selectedDateFilter.getDate()
        ) {
          return false;
        }
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const textMatch = review.feedback_text?.toLowerCase().includes(term);
        const emailMatch = review.user_email?.toLowerCase().includes(term);
        const nameMatch = review.user_details?.name.toLowerCase().includes(term);
        const orgMatch = review.user_details?.orgName.toLowerCase().includes(term);
        if (!textMatch && !emailMatch && !nameMatch && !orgMatch) return false;
      }
      return true;
    });
  }, [reviews, filterType, searchTerm, selectedDateFilter]);

  // Build the deeply nested structure based on filtered results
  const tree = useMemo(() => {
    const root: Record<string, { count: number, orgs: Record<string, { count: number, users: Record<string, { name: string, count: number, dates: Record<string, { count: number, reviews: AgentReview[] }> }> }> }> = {};
    
    filteredReviews.forEach(review => {
      const role = review.user_details?.role || "unknown";
      const org = review.user_details?.orgName || "No Organization";
      const email = review.user_email || "unknown";
      const name = review.user_details?.name || "Unknown";
      const date = format(new Date(review.created_at), 'MMM dd, yyyy');

      if (!root[role]) root[role] = { count: 0, orgs: {} };
      root[role].count++;

      if (!root[role].orgs[org]) root[role].orgs[org] = { count: 0, users: {} };
      root[role].orgs[org].count++;

      if (!root[role].orgs[org].users[email]) root[role].orgs[org].users[email] = { name, count: 0, dates: {} };
      root[role].orgs[org].users[email].count++;

      if (!root[role].orgs[org].users[email].dates[date]) root[role].orgs[org].users[email].dates[date] = { count: 0, reviews: [] };
      root[role].orgs[org].users[email].dates[date].count++;
      root[role].orgs[org].users[email].dates[date].reviews.push(review);
    });
    
    return root;
  }, [filteredReviews]);

  const renderReviewContent = (review: AgentReview) => (
    <Card key={review.id} className="overflow-hidden mb-4">
      <div className={`flex flex-col md:flex-row border-l-4 bg-card hover:bg-muted/10 transition-colors`} style={{
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
        <div className="md:w-2/3 p-4 flex flex-col">
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
    </Card>
  );

  const renderBreadcrumbs = () => {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6 bg-muted/20 p-3 rounded-lg border border-border">
        <button onClick={() => setPath({})} className="hover:text-foreground flex items-center font-medium">
          <Home className="h-4 w-4 mr-1.5 text-amber-500" /> Root
        </button>
        {path.role && (
          <>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <button onClick={() => setPath({ role: path.role })} className="hover:text-foreground">
              {path.role.charAt(0).toUpperCase() + path.role.slice(1)}
            </button>
          </>
        )}
        {path.org && (
          <>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <button onClick={() => setPath({ role: path.role, org: path.org })} className="hover:text-foreground">
              {path.org}
            </button>
          </>
        )}
        {path.email && (
          <>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <button onClick={() => setPath({ role: path.role, org: path.org, email: path.email })} className="hover:text-foreground truncate max-w-[200px]">
              {tree[path.role!]?.orgs[path.org!]?.users[path.email!]?.name || path.email}
            </button>
          </>
        )}
        {path.date && (
          <>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <span className="text-foreground font-medium">{path.date}</span>
          </>
        )}
      </div>
    );
  };

  const renderFolders = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      );
    }
    if (error) return <div className="text-center py-12 text-rose-500">Failed to load reviews.</div>;

    // ROOT LEVEL (Roles)
    if (!path.role) {
      const roles = Object.keys(tree).sort();
      if (roles.length === 0) return <div className="text-center py-12 text-muted-foreground w-full">No folders found.</div>;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full">
          {roles.map(role => (
            <FolderIcon 
              key={role} 
              label={role.charAt(0).toUpperCase() + role.slice(1)} 
              badge={tree[role].count} 
              onClick={() => setPath({ role })} 
            />
          ))}
        </div>
      );
    }

    // LEVEL 1 (Organizations)
    if (path.role && !path.org) {
      const roleNode = tree[path.role];
      if (!roleNode) return null;
      const orgs = Object.keys(roleNode.orgs).sort();
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full">
          {orgs.map(org => (
            <FolderIcon 
              key={org} 
              label={org} 
              badge={roleNode.orgs[org].count} 
              onClick={() => setPath({ ...path, org })} 
            />
          ))}
        </div>
      );
    }

    // LEVEL 2 (Users)
    if (path.role && path.org && !path.email) {
      const orgNode = tree[path.role]?.orgs[path.org];
      if (!orgNode) return null;
      const emails = Object.keys(orgNode.users).sort();
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full">
          {emails.map(email => {
            const userNode = orgNode.users[email];
            return (
              <FolderIcon 
                key={email} 
                label={userNode.name} 
                subtitle={email}
                badge={userNode.count} 
                onClick={() => setPath({ ...path, email })} 
              />
            );
          })}
        </div>
      );
    }

    // LEVEL 3 (Dates)
    if (path.role && path.org && path.email && !path.date) {
      const userNode = tree[path.role]?.orgs[path.org]?.users[path.email];
      if (!userNode) return null;
      const dates = Object.keys(userNode.dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full">
          {dates.map(date => (
            <FolderIcon 
              key={date} 
              label={date} 
              badge={userNode.dates[date].count} 
              onClick={() => setPath({ ...path, date })} 
            />
          ))}
        </div>
      );
    }

    // LEVEL 4 (Reviews!)
    if (path.role && path.org && path.email && path.date) {
      const dateNode = tree[path.role]?.orgs[path.org]?.users[path.email]?.dates[path.date];
      if (!dateNode) return null;
      
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setPath({ role: path.role, org: path.org, email: path.email })}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dates
            </Button>
            <h3 className="text-lg font-semibold">{path.date} - {dateNode.reviews.length} Reviews</h3>
          </div>
          {dateNode.reviews.map(review => renderReviewContent(review))}
        </div>
      );
    }
  };

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

      {/* Global Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between bg-muted/40">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search globally by name, email, org, or text..."
              className="pl-8 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-64">
              <NikhilTimeCalendar 
                value={selectedDateFilter} 
                onChange={(d) => setSelectedDateFilter(d)} 
                showTime={false} 
                placeholder="Filter globally by date..." 
              />
            </div>
            
            <div className="flex items-center gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Folders Area */}
      <div className="w-full">
        {renderBreadcrumbs()}
        {renderFolders()}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
