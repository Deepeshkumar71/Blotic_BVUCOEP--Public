import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PenSquare } from "lucide-react";
import BlogApproval from "./BlogApproval";
import PublishedBlogsManagement from "./PublishedBlogsManagement";

const BlogsManagement = () => {
  const [activeTab, setActiveTab] = useState("published");
  const navigate = useNavigate();

  // Get pending count for badge
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-blogs-count-v2"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blogs")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blogs Management</h1>
        <Button 
          onClick={() => navigate("/write-blog")}
          className="gap-2"
        >
          <PenSquare className="w-4 h-4" />
          Write Blog
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="published">Published Blogs</TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Pending Approvals
            {pendingCount && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-6">
          <PublishedBlogsManagement />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <BlogApproval />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogsManagement;
