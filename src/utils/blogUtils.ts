import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a blog and its associated cover image from storage
 * @param blogId - The ID of the blog to delete
 * @returns Promise that resolves when both blog and image are deleted
 */
export const deleteBlogWithImage = async (blogId: string): Promise<void> => {
  try {
    // First, get the blog to retrieve the cover image URL
    const { data: blog, error: fetchError } = await supabase
      .from("blogs")
      .select("cover_image")
      .eq("id", blogId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch blog: ${fetchError.message}`);
    }

    // Delete the cover image from storage if it exists
    if (blog?.cover_image) {
      try {
        // Extract filename from the URL
        const urlParts = blog.cover_image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        
        // Delete from blog-images bucket
        const { error: storageError } = await supabase.storage
          .from("blog-images")
          .remove([fileName]);
          
        if (storageError) {
          console.error("Failed to delete blog image from storage:", storageError);
          // Continue with blog deletion even if image deletion fails
        } else {
          console.log(`Successfully deleted blog image: ${fileName}`);
        }
      } catch (imageError) {
        console.error("Error processing blog image deletion:", imageError);
        // Continue with blog deletion even if image processing fails
      }
    }

    // Delete the blog record from database
    const { error: deleteError } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId);

    if (deleteError) {
      throw new Error(`Failed to delete blog: ${deleteError.message}`);
    }

    console.log(`Successfully deleted blog: ${blogId}`);
  } catch (error) {
    console.error("Error in deleteBlogWithImage:", error);
    throw error;
  }
};

/**
 * Extracts the filename from a Supabase storage URL
 * @param url - The full storage URL
 * @returns The filename or null if extraction fails
 */
export const extractFilenameFromStorageUrl = (url: string): string | null => {
  try {
    const urlParts = url.split("/");
    return urlParts[urlParts.length - 1] || null;
  } catch {
    return null;
  }
};

/**
 * Deletes multiple files from the blog-images storage bucket
 * @param filenames - Array of filenames to delete
 * @returns Promise that resolves when all files are deleted
 */
export const deleteBlogImages = async (filenames: string[]): Promise<void> => {
  if (filenames.length === 0) return;

  try {
    const { error } = await supabase.storage
      .from("blog-images")
      .remove(filenames);

    if (error) {
      throw new Error(`Failed to delete blog images: ${error.message}`);
    }

    console.log(`Successfully deleted ${filenames.length} blog images`);
  } catch (error) {
    console.error("Error deleting blog images:", error);
    throw error;
  }
};
