import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './BackgroundVideo.css';

const BackgroundVideo = () => {
    const [isTextVisible, setIsTextVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Ensure constant playback speed
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Force constant playback rate
        video.playbackRate = 1.0;

        // Monitor and maintain playback rate
        const maintainPlaybackRate = () => {
            if (video.playbackRate !== 1.0) {
                video.playbackRate = 1.0;
            }
        };

        video.addEventListener('ratechange', maintainPlaybackRate);
        video.addEventListener('play', maintainPlaybackRate);
        
        return () => {
            video.removeEventListener('ratechange', maintainPlaybackRate);
            video.removeEventListener('play', maintainPlaybackRate);
        };
    }, []);

    const handleClick = () => {
        if (isMobile) {
            setIsTextVisible(!isTextVisible);
        }
    };

    // Animation variant for container fade-in only
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                duration: 1,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div 
            className={`video-background ${isMobile && isTextVisible ? 'mobile-text-visible' : ''}`}
            onClick={handleClick}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <video 
                ref={videoRef}
                autoPlay 
                loop 
                muted 
                playsInline
                preload="auto"
            >
                <source src="/blotic-video-web.webm" type="video/webm" />
                <source src="/blotic-video-compressed.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="video-overlay">
            </div>
            {/* Hover Text Animation - Emerges from bottom to right mid */}
            <div className="video-hover-text">
                <span className="hover-text-letter">L</span>
                <span className="hover-text-letter">O</span>
                <span className="hover-text-letter">T</span>
                <span className="hover-text-letter">I</span>
                <span className="hover-text-letter">C</span>
            </div>
        </motion.div>
    );
};

export default BackgroundVideo;