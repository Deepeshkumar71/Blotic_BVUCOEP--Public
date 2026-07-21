import React from 'react';
import './NavHero.css';

const NavHero = () => {
    return (
        <div className="nav-video-background">
            <video autoPlay loop muted playsInline>
                <source src="/blotic-video-web.webm" type="video/webm" />
                <source src="/blotic-video-compressed.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default NavHero;
