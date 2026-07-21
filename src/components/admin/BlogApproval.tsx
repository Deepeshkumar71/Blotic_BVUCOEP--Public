import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, User, Calendar, Eye } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  short_description: string;
  content: string;
  cover_image: string;
  author_id: string;
  created_at: string;
  submitted_for_approval_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  }[];
}

const BlogApproval = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending blogs
  const { data: pendingBlogs, isLoading } = useQuery({
    queryKey: ["pending-blogs-fast"],
    queryFn: async () => {
      console.log("🔄 Fetching pending blogs...");
      
      // First, get the blogs
      const { data: blogs, error: blogsError } = await supabase
        .from("blogs")
        .select(`
          id,
          title,
          short_description,
          content,
          cover_image,
          author_id,
          created_at,
          submitted_for_approval_at
        `)
        .eq("status", "pending_approval")
        .order("submitted_for_approval_at", { ascending: false });

      if (blogsError) {
        console.error("❌ Error fetching pending blogs:", blogsError);
        throw blogsError;
      }

      if (!blogs || blogs.length === 0) {
        console.log("✅ No pending blogs found");
        return [];
      }

      // Then get the profile data for each blog
      const authorIds = [...new Set(blogs.map(blog => blog.author_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", authorIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
        // Continue without profiles data rather than failing
      }

      // Combine blogs with their profile data
      const blogsWithProfiles = blogs.map(blog => ({
        ...blog,
        profiles: profiles ? [profiles.find(p => p.id === blog.author_id)].filter(Boolean) : []
      }));

      console.log("✅ Pending blogs loaded:", blogsWithProfiles.length);
      return blogsWithProfiles;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Approve blog mutation
  const approveMutation = useMutation({
    mutationFn: async (blogId: string) => {
      const { error } = await supabase
        .from("blogs")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", blogId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all blog-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-fast"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blogs-final"] });
      queryClient.invalidateQueries({ queryKey: ["blogs-final"] });
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-count-v2"] });
      toast.success("Blog approved and published!");
    },
    onError: () => {
      toast.error("Failed to approve blog");
    },
  });

  // Reject blog mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: { blogId: string; reason: string }) => {
      const { error } = await supabase
        .from("blogs")
        .update({
          status: "rejected",
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: data.reason,
        })
        .eq("id", data.blogId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate pending blogs query for real-time updates
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-fast"] });
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-count-v2"] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedBlog(null);
      toast.success("Blog rejected");
    },
    onError: () => {
      toast.error("Failed to reject blog");
    },
  });

  const handleApprove = (blogId: string) => {
    approveMutation.mutate(blogId);
  };

  const handleReject = () => {
    if (!selectedBlog) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({ blogId: selectedBlog.id, reason: rejectionReason });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Approvals</h2>
        <div className="px-3 py-1 bg-primary/20 rounded-full text-sm font-medium">
          {pendingBlogs?.length || 0} Pending
        </div>
      </div>

      {!pendingBlogs || pendingBlogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No blogs pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingBlogs.map((blog) => (
            <Card key={blog.id} className="overflow-hidden flex flex-col">
              {/* Cover Image */}
              <div className="relative h-48">
                <img
                  src={blog.cover_image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>

              <CardContent className="p-6 flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                      {blog.profiles?.[0]?.avatar_url ? (
                        <img
                          src={blog.profiles[0].avatar_url}
                          alt={blog.profiles[0].full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {blog.profiles?.[0]?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {blog.profiles?.[0]?.role}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold line-clamp-2">{blog.title}</h3>

                  {/* Content Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncateContent(blog.content)}
                  </p>

                  {/* Submitted Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Submitted {formatDate(blog.submitted_for_approval_at)}</span>
                  </div>
                </div>

                {/* Actions - Fixed at bottom */}
                <div className="flex gap-2 pt-4 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBlog(blog);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">View Full</span>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(blog.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Approve</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBlog(blog);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <X className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Reject</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Full Blog Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBlog?.title}</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="space-y-4">
              <img
                src={selectedBlog.cover_image}
                alt={selectedBlog.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedBlog.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Blog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide feedback to the author..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex-1"
              >
                Reject Blog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogApproval;
