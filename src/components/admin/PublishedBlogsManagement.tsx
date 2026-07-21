import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, User, Calendar, Edit } from "lucide-react";
import { deleteBlogWithImage } from "@/utils/blogUtils";

interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image: string;
  author_id: string;
  created_at: string;
  status: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

const PublishedBlogsManagement = () => {
  const queryClient = useQueryClient();
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch only published blogs
  const { data: blogs, isLoading, error } = useQuery<Blog[]>({
    queryKey: ["admin-blogs-final"], // Final stable key
    queryFn: async (): Promise<Blog[]> => {
      console.log("🔄 Fetching admin blogs...");
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          id,
          title,
          content,
          cover_image,
          author_id,
          created_at,
          status
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching admin blogs:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }
      
      // Fetch author profiles separately to show profile pictures
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(blog => blog.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", authorIds);
        
        // Map profiles to blogs
        const blogsWithAuthors: Blog[] = data.map(blog => {
          const profile = profiles?.find(p => p.id === blog.author_id);
          return {
            ...blog,
            profiles: {
              full_name: profile?.full_name || "BLOTIC Author",
              avatar_url: profile?.avatar_url || null
            }
          };
        });
        
        return blogsWithAuthors;
      }
      
      console.log("✅ Admin blogs loaded:", data?.length || 0, "blogs");
      return [];
    },
    retry: 3,
    retryDelay: 1000,
  });


  // Delete blog mutation
  const deleteMutation = useMutation({
    mutationFn: async (blogId: string) => {
      await deleteBlogWithImage(blogId);
    },
    onSuccess: () => {
      // Invalidate the correct query keys to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ["admin-blogs-final"] });
      queryClient.invalidateQueries({ queryKey: ["blogs-final"] });
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-count-v2"] });
      setDeleteDialogOpen(false);
      setSelectedBlog(null);
      toast.success("Blog deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete blog");
    },
  });


  const handleDelete = () => {
    if (!selectedBlog) return;
    deleteMutation.mutate(selectedBlog.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // All blogs are approved since we only fetch approved ones
  const publishedBlogs = blogs || [];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Published Blogs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Published Blogs</h2>
          <div className="px-3 py-1 bg-green-600/20 rounded-full text-sm font-medium">
            {publishedBlogs.length} Live
          </div>
        </div>

        {publishedBlogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No published blogs</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {publishedBlogs.map((blog) => (
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
                        {blog.profiles?.avatar_url ? (
                          <img
                            src={blog.profiles.avatar_url}
                            alt={blog.profiles.full_name}
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
                          {blog.profiles?.full_name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(blog.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold line-clamp-2">{blog.title}</h3>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {truncateContent(blog.content, 200)}
                    </p>
                  </div>

                  {/* Actions - Fixed at bottom */}
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.location.href = `/admin?tab=edit-blog&id=${blog.id}`}
                    >
                      <Edit className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedBlog(blog);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-2 border-blue-500/50">
          <DialogHeader>
            <DialogTitle>Delete Blog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to permanently delete this blog? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublishedBlogsManagement;
