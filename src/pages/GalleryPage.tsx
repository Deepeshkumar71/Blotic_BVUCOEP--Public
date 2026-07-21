import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import Gallery from "@/components/Gallery";

const GalleryPage = () => {
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="min-h-screen"
    >
      <motion.div variants={staggerItem}>
        <Gallery />
      </motion.div>
    </motion.div>
  );
};

export default GalleryPage;
