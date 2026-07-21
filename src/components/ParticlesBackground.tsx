import { useEffect, useRef } from 'react';

interface ParticlesBackgroundProps {
  forceRestart?: boolean;
}

const ParticlesBackground = ({ forceRestart = false }: ParticlesBackgroundProps) => {
  const isInitialized = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const initializeParticles = () => {
    console.log('Initializing particles...');
    
    // Clean up existing particles first
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Clear existing container
    const existingContainer = document.getElementById('particles-js');
    if (existingContainer) {
      existingContainer.innerHTML = '';
    }

    // Create or get the particles container
    let particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) {
      particlesContainer = document.createElement('div');
      particlesContainer.id = 'particles-js';
      particlesContainer.style.position = 'fixed';
      particlesContainer.style.top = '0';
      particlesContainer.style.left = '0';
      particlesContainer.style.width = '100%';
      particlesContainer.style.height = '100%';
      particlesContainer.style.zIndex = '-1';
      particlesContainer.style.pointerEvents = 'none';
      document.body.insertBefore(particlesContainer, document.body.firstChild);
    }

    // Remove existing scripts to avoid conflicts
    const existingParticlesScript = document.querySelector('script[src="/particles.js"]');
    const existingAppScript = document.querySelector('script[src="/app.js"]');
    if (existingParticlesScript) existingParticlesScript.remove();
    if (existingAppScript) existingAppScript.remove();

    // Load particles.js and app.js scripts
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    // Load scripts sequentially
    loadScript('/particles.js')
      .then(() => loadScript('/app.js'))
      .then(() => {
        console.log('Particles scripts loaded successfully');
        // Force particles to start if window.particlesJS exists
        if (typeof window !== 'undefined' && (window as any).particlesJS) {
          setTimeout(() => {
            try {
              (window as any).particlesJS.load('particles-js', '/particles.json');
            } catch (error) {
              console.warn('Failed to load particles config:', error);
            }
          }, 100);
        }
      })
      .catch((error) => {
        console.error('Failed to load particles:', error);
      });

    // Return cleanup function
    cleanupRef.current = () => {
      const particlesScript = document.querySelector('script[src="/particles.js"]');
      const appScript = document.querySelector('script[src="/app.js"]');
      if (particlesScript) particlesScript.remove();
      if (appScript) appScript.remove();
      
      if (particlesContainer && particlesContainer.parentElement) {
        particlesContainer.innerHTML = '';
      }
    };
  };

  useEffect(() => {
    // Initialize particles when component mounts or when forceRestart changes
    const timer = setTimeout(() => {
      initializeParticles();
      isInitialized.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [forceRestart]);

  return null;
};

export default ParticlesBackground;