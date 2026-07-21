import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Share2 } from "@/components/icons";
import { motion } from "framer-motion";

interface Blog {
  id: string;
  title: string;
  short_description: string;
  content: string;
  cover_image: string;
  author_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const BlogView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ["blog-view", id],
    queryFn: async () => {
      console.log("🔄 Fetching blog:", id);
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          id,
          title,
          short_description,
          content,
          cover_image,
          author_id,
          created_at
        `)
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) {
        console.error("❌ Error fetching blog:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          blogId: id
        });
        throw error;
      }
      // Fetch author profile separately to show profile picture
      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.author_id)
          .single();
        
        const blogWithAuthor = {
          ...data,
          profiles: {
            full_name: profile?.full_name || "BLOTIC Author",
            avatar_url: profile?.avatar_url || null
          }
        };
        
        console.log("✅ Blog loaded:", blogWithAuthor?.title);
        return blogWithAuthor;
      }
      
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Blog Not Found</h2>
          <Button onClick={() => navigate("/blogs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/blogs")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Button>
        </motion.div>

        {/* Header Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Mobile Layout - Stack vertically */}
          <div className="block lg:hidden space-y-4">
            {/* Cover Image - Mobile */}
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-white/20">
              <img
                src={blog.cover_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Content - Mobile */}
            <div className="p-4 rounded-lg border border-white/20 bg-card/20 flex flex-col justify-between min-h-[200px]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                  {blog.title}
                </h1>
                
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-h-[120px] overflow-y-auto line-clamp-6">
                  {blog.short_description}
                </p>
              </div>

              {/* Profile and Action Buttons - Bottom */}
              <div className="flex items-center justify-between pt-4">
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
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {blog.profiles?.full_name || "BLOTIC Author"}
                    </p>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">{formatDate(blog.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: blog.title,
                          text: `Check out this blog post: ${blog.title}`,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="gap-2 bg-primary/20 border-primary/30 text-white hover:bg-primary/30 px-3 py-2"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Reduced Size */}
          <div className="hidden lg:grid grid-cols-5 gap-6 p-4 rounded-xl border border-white/10 bg-card/30 backdrop-blur-sm">
            {/* Left: Cover Image - Smaller */}
            <div className="col-span-2 relative aspect-[4/3] rounded-lg overflow-hidden border border-white/20">
              <img
                src={blog.cover_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Right: Content - Compact */}
            <div className="col-span-3 relative p-4 rounded-lg border border-white/20 bg-card/20 flex flex-col justify-between">
              {/* Title & Description */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                  {blog.title}
                </h1>
                <p className="text-gray-300 text-base lg:text-lg leading-relaxed max-h-[120px] overflow-y-auto line-clamp-6">
                  {blog.short_description}
                </p>
              </div>

              {/* Author & Buttons - Bottom */}
              <div className="flex items-center justify-between pt-4">
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
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {blog.profiles?.full_name || "BLOTIC Author"}
                      </p>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">{formatDate(blog.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: blog.title,
                            text: `Check out this blog post: ${blog.title}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      className="gap-2 bg-primary/20 border-primary/30 text-white hover:bg-primary/30 px-3 py-2"
                    >
                      <Share2 className="w-3 h-3" />
                      Share
                    </Button>
                  </div>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="prose prose-invert prose-lg max-w-none p-4 sm:p-6 lg:p-8 rounded-xl border border-white/10 bg-card/20 backdrop-blur-sm"
        >
          <div 
            className="text-gray-200 leading-relaxed text-base sm:text-lg"
            dangerouslySetInnerHTML={{
              __html: blog.content
                .split('\n')
                .map(line => {
                  // Check if line starts with bullet markers (-, *, •)
                  const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
                  if (bulletMatch) {
                    return `<li class="ml-4 mb-2">${bulletMatch[1]}</li>`;
                  }
                  // Regular line
                  return line ? `<p class="mb-4">${line}</p>` : '<br/>';
                })
                .join('')
                .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => `<ul class="list-disc ml-6 mb-4 space-y-2">${match}</ul>`)
            }}
          />
        </motion.article>

      </div>
    </div>
  );
};

export default BlogView;
