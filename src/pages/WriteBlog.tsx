import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Send, CheckCircle } from "@/components/icons";
import { compressImage } from "@/utils/imageCompression";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";

const WriteBlog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useRoleCheck();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  // Check if we're in edit mode - check both 'edit' and 'id' parameters
  const editBlogId = searchParams.get("edit") || searchParams.get("id");
  const isEditMode = !!editBlogId;
  
  // Check if user is admin or core
  const canDirectPublish = hasRole("admin") || hasRole("core");

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Hide footer for this page
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = 'none';
    }
    return () => {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = '';
      }
    };
  }, []);

  // Fetch existing blog data if in edit mode
  const { data: existingBlog, isLoading: loadingBlog } = useQuery({
    queryKey: ["blog-edit", editBlogId],
    queryFn: async () => {
      if (!editBlogId) return null;
      
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, short_description, content, cover_image, author_id, status")
        .eq("id", editBlogId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!editBlogId,
  });

  // Load existing blog data into form OR clear form when switching modes
  useEffect(() => {
    if (existingBlog && isEditMode) {
      // Load existing blog data for editing
      setTitle(existingBlog.title);
      setShortDescription(existingBlog.short_description || "");
      setContent(existingBlog.content);
      if (existingBlog.cover_image) {
        setCoverImagePreview(existingBlog.cover_image);
      }
    } else if (!isEditMode && editBlogId === null) {
      // Clear form when explicitly on write-new-blog page (no edit or id params)
      setTitle("");
      setShortDescription("");
      setContent("");
      setCoverImagePreview("");
    }
  }, [existingBlog, isEditMode, editBlogId]);

  // Handle cover image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow supported formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a supported image format (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setCoverImage(file);
  };

  // Create/Update blog mutation
  const createBlogMutation = useMutation({
    mutationFn: async (data: { status: "draft" | "pending_approval" | "approved" }) => {
      if (!user) throw new Error("User not authenticated");
      if (!title.trim()) throw new Error("Title is required");
      if (!shortDescription.trim()) throw new Error("Short description is required");
      if (!content.trim()) throw new Error("Content is required");

      setIsUploading(true);

      try {
        let coverImageUrl = coverImagePreview; // Use existing image by default

        // Upload new cover image if selected
        if (coverImage) {
          const compressedImage = await compressImage(coverImage);
          const fileExt = coverImage.name.split(".").pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("blog-images")
            .upload(filePath, compressedImage);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("blog-images")
            .getPublicUrl(filePath);

          coverImageUrl = publicUrl;
        }

        // Validate cover image exists
        if (!coverImageUrl) throw new Error("Cover image is required");

        // Prepare blog data
        const blogData: any = {
          title: title.trim(),
          short_description: shortDescription.trim(),
          content: content.trim(),
          cover_image: coverImageUrl,
        };
        
        // Handle status logic for edit vs create
        if (isEditMode && editBlogId && existingBlog) {
          // For existing blogs, preserve the current status unless explicitly changing it
          const currentStatus = existingBlog.status;
          
          if (data.status === "approved" && currentStatus !== "approved") {
            // Explicitly publishing the blog
            blogData.status = "approved";
            blogData.approved_by = user.id;
            blogData.approved_at = new Date().toISOString();
          } else if (data.status === "draft" && currentStatus !== "draft") {
            // Explicitly changing to draft
            blogData.status = "draft";
          } else if (data.status === "pending_approval" && currentStatus !== "pending_approval") {
            // Explicitly submitting for approval
            blogData.status = "pending_approval";
            blogData.submitted_for_approval_at = new Date().toISOString();
          } else if (data.status === "draft" && currentStatus === "approved") {
            // Special case: "Save Changes" on published blog should keep it published
            // Don't change status, preserve existing approved status
            // Only update content, title, and image
          } else {
            // Default: preserve existing status for published blogs
            // This handles the "Save Changes" case for published blogs
            if (currentStatus === "approved") {
              blogData.status = "approved";
              // Keep existing approval metadata
            } else {
              blogData.status = data.status;
              if (data.status === "pending_approval") {
                blogData.submitted_for_approval_at = new Date().toISOString();
              }
            }
          }
        } else {
          // For new blogs, set the status as requested
          blogData.status = data.status;
          
          // Add timestamps based on status
          if (data.status === "pending_approval") {
            blogData.submitted_for_approval_at = new Date().toISOString();
          } else if (data.status === "approved") {
            blogData.approved_by = user.id;
            blogData.approved_at = new Date().toISOString();
          }
        }
        
        let result;
        
        if (isEditMode && editBlogId) {
          // Update existing blog
          const { data: blog, error: blogError } = await supabase
            .from("blogs")
            .update(blogData)
            .eq("id", editBlogId)
            .select()
            .single();
          
          if (blogError) throw blogError;
          result = blog;
        } else {
          // Create new blog
          blogData.author_id = user.id;
          
          const { data: blog, error: blogError } = await supabase
            .from("blogs")
            .insert(blogData)
            .select()
            .single();
          
          if (blogError) throw blogError;
          result = blog;
        }

        return result;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["my-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["pending-blogs-count"] });
      
      if (variables.status === "approved") {
        toast.success("Blog published successfully!");
      } else {
        toast.success("Blog submitted for approval!");
      }
      
      // Redirect based on user role and action
      if (canDirectPublish) {
        // Admin/core users - go to admin blog management
        navigate("/admin?tab=blogs");
      } else {
        // Regular users (members/co-heads) submitting for approval - go to dashboard
        navigate("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save blog");
    },
  });


  const handleSubmitForApproval = () => {
    createBlogMutation.mutate({ status: "pending_approval" });
  };
  
  const handlePublish = () => {
    createBlogMutation.mutate({ status: "approved" });
  };

  // If in edit mode (admin context), ensure user has admin/core permissions
  if (isEditMode && !canDirectPublish) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only admin and core team members can edit blogs.</p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is in admin context (came from admin dashboard)
  const isAdminContext = searchParams.get("id");

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Show breadcrumbs only when NOT in admin context (AdminLayout already shows them) */}
      {canDirectPublish && !isAdminContext && (
        <AdminBreadcrumbs 
          activeTab="write-blog"
          onTabChange={(tab) => navigate(`/admin?tab=${tab}`)}
        />
      )}
      
      <div className={`${isAdminContext ? 'space-y-6' : canDirectPublish ? 'pt-2 pb-4' : 'pt-20 pb-4'}`}>
        <div className="px-0 sm:px-4 lg:px-6">

        {/* Header */}
        <div className={`${isAdminContext ? 'mb-6' : 'mb-4'} p-4 sm:p-6 rounded-xl border border-white/10 bg-card/30 backdrop-blur-sm`}>
          <h1 className="text-3xl font-bold mb-2">
            {isEditMode ? "Edit Blog" : "Write a Blog"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? "Update your blog post with new content and insights" 
              : "Share your knowledge and insights with the BLOTIC community"
            }
          </p>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="space-y-6 mb-8">
          {/* Mobile Layout - Stack vertically */}
          <div className="block lg:hidden space-y-6">
            {/* Cover Image - Mobile */}
            <Card className="p-4 bg-card/30 backdrop-blur-sm border-white/10">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <input
                  id="cover-image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {coverImagePreview ? (
                  <div 
                    className="relative aspect-[16/9] rounded-lg overflow-hidden border border-white/20 cursor-pointer"
                    onClick={() => document.getElementById('cover-image')?.click()}
                  >
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white pointer-events-none"
                      >
                        <Upload className="w-4 h-4" />
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="aspect-[16/9] rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-card/20 cursor-pointer"
                    onClick={() => document.getElementById('cover-image')?.click()}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload cover image</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Fields - Mobile */}
            <Card className="p-4 bg-card/30 backdrop-blur-sm border-white/10">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg">Blog Details</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title-mobile">Title *</Label>
                  <Input
                    id="title-mobile"
                    placeholder="Enter blog title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <Label htmlFor="shortDescription-mobile">Short Description *</Label>
                  <Textarea
                    id="shortDescription-mobile"
                    placeholder="Write a brief description..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {shortDescription.length} characters
                  </p>
                </div>

                {/* Content Editor */}
                <div className="space-y-2">
                  <Label htmlFor="content-mobile">Content *</Label>
                  <Textarea
                    id="content-mobile"
                    placeholder="Write your blog content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Layout - Original */}
          <div className="hidden lg:grid grid-cols-2 gap-8">
            {/* Left: Image Preview */}
            <Card className="p-6 bg-card/30 backdrop-blur-sm border-white/10">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">Cover Image Preview</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 h-full flex flex-col">
                <input
                  id="cover-image-desktop"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {coverImagePreview ? (
                  <div 
                    className="relative aspect-[3/2] rounded-xl overflow-hidden border border-white/20 group cursor-pointer"
                    onClick={() => document.getElementById('cover-image-desktop')?.click()}
                  >
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 pointer-events-none"
                      >
                        <Upload className="w-4 h-4" />
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="aspect-[3/2] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-card/20 cursor-pointer hover:border-white/40 hover:bg-card/30 transition-all duration-300"
                    onClick={() => document.getElementById('cover-image-desktop')?.click()}
                  >
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Click to upload cover image</p>
                      <p className="text-sm text-muted-foreground/60">3:2 aspect ratio recommended</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Form Fields */}
            <Card className="p-6 bg-card/30 backdrop-blur-sm border-white/10">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">Blog Details</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 h-full flex flex-col space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter blog title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  placeholder="Write a brief description of your blog (2-3 sentences)..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {shortDescription.length} characters
                </p>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} characters
                </p>
              </div>

            </CardContent>
            </Card>
          </div>
        </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg mt-8 px-0 sm:px-4 lg:px-6 py-4 pb-safe mb-12 sm:mb-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground hidden sm:block">
              {isEditMode ? "Editing blog post" : "Creating new blog post"}
              {content && ` • ${content.length} characters`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {canDirectPublish ? (
                <Button
                  onClick={handlePublish}
                  disabled={createBlogMutation.isPending || isUploading}
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 order-1 sm:order-2"
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isEditMode ? "Update & Publish" : "Publish Blog"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={createBlogMutation.isPending || isUploading}
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 order-1 sm:order-2"
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isEditMode ? "Update & Submit" : "Submit for Approval"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteBlog;
