import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, ArrowRight } from "@/components/icons";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  title: string;
  short_description: string;
  content: string;
  cover_image: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const Blogs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Ref for blogs grid scroll animation
  const blogsGridRef = useRef(null);
  const blogsGridInView = useInView(blogsGridRef, { once: true, margin: "-100px" });

  // Animation variants for blog cards
  const blogsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const blogCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Fetch approved blogs
  const { data: blogs, isLoading, error } = useQuery({
    queryKey: ["blogs-final"], // Final stable key
    queryFn: async () => {
      console.log("🔄 Fetching blogs...");
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          id,
          title,
          short_description,
          content,
          cover_image,
          author_id,
          created_at,
          updated_at
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching blogs:", error);
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
        const blogsWithAuthors = data.map(blog => {
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
      
      console.log("✅ Blogs loaded:", data?.length || 0, "blogs");
      return data || [];
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Real-time subscription for blog updates
  useEffect(() => {
    console.log("🔔 Setting up real-time blog subscription...");
    
    const channel = supabase
      .channel('blogs-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'blogs',
          filter: 'status=eq.approved' // Only listen to approved blogs
        },
        (payload) => {
          console.log('🔔 Blog change detected:', payload);
          
          // Invalidate and refetch blogs when any change happens
          queryClient.invalidateQueries({ queryKey: ["blogs-final"] });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log("🔕 Cleaning up blog subscription...");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filter blogs based on search
  const filteredBlogs = blogs?.filter((blog) =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-12">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-7xl md:text-8xl font-bold mb-6 text-white">
              Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Blogs</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
              Insights, tutorials, and stories from the BLOTIC community. Explore blockchain technology, Web3 innovations, and learn from our experiences in the decentralized world.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 z-10 pointer-events-none" />
                <Input
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-16 sm:py-20 -mt-32" ref={blogsGridRef}>
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg text-gray-200">Loading blogs...</p>
            </div>
          ) : filteredBlogs && filteredBlogs.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-2 text-white">No Blogs Found</h3>
              <p className="text-gray-300">
                {searchTerm ? "Try adjusting your search" : "Check back soon for new content!"}
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              variants={blogsContainerVariants}
              initial="hidden"
              animate={blogsGridInView ? "visible" : "hidden"}
            >
              {filteredBlogs?.map((blog) => (
                <motion.div
                  key={blog.id}
                  variants={blogCardVariants}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-white/10 h-full flex flex-col">
                    {/* Cover Image */}
                    <div className="relative aspect-[16/9] sm:aspect-[3/2] overflow-hidden">
                      <img
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
                      {/* Author Info */}
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-primary/20">
                          {blog.profiles?.avatar_url ? (
                            <img
                              src={blog.profiles.avatar_url}
                              alt={blog.profiles.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {blog.profiles?.full_name || "BLOTIC Author"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">{formatDate(blog.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 flex-grow leading-relaxed">
                        {blog.short_description}
                      </p>

                      {/* Read More Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-primary/10 transition-colors text-xs sm:text-sm"
                        onClick={() => navigate(`/blogs/${blog.id}`)}
                      >
                        Read More
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blogs;
