// Enhanced location handler with device detection and user guidance

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationError {
  code: number;
  message: string;
  userMessage: string;
  action: 'retry' | 'enable_device' | 'enable_browser' | 'unavailable';
}

export class LocationHandler {
  private static instance: LocationHandler;
  
  static getInstance(): LocationHandler {
    if (!LocationHandler.instance) {
      LocationHandler.instance = new LocationHandler();
    }
    return LocationHandler.instance;
  }

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check browser permission status
   */
  async checkBrowserPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!('permissions' in navigator)) {
      return 'unsupported';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state;
    } catch (error) {
      console.warn('Permission API not fully supported:', error);
      return 'unsupported';
    }
  }

  /**
   * Request location with intelligent error handling
   */
  async requestLocation(): Promise<{ data?: LocationData; error?: LocationError }> {
    if (!this.isSupported()) {
      return {
        error: {
          code: -1,
          message: 'Geolocation not supported',
          userMessage: 'Your browser doesn\'t support location services.',
          action: 'unavailable'
        }
      };
    }

    // Step 1: Check browser permission first
    const browserPermission = await this.checkBrowserPermission();
    
    if (browserPermission === 'denied') {
      return {
        error: {
          code: 1,
          message: 'Browser permission denied',
          userMessage: 'Location access is blocked in your browser. Please click the location icon in the address bar and allow location access.',
          action: 'enable_browser'
        }
      };
    }

    // Step 2: Try to get location
    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            }
          });
        },
        (error) => {
          resolve({ error: this.handleGeolocationError(error) });
        },
        options
      );
    });
  }

  /**
   * Handle geolocation errors with user-friendly messages
   */
  private handleGeolocationError(error: GeolocationPositionError): LocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          code: 1,
          message: 'Permission denied',
          userMessage: 'Location access was denied. Please allow location access in your browser settings.',
          action: 'enable_browser'
        };

      case error.POSITION_UNAVAILABLE:
        return {
          code: 2,
          message: 'Position unavailable',
          userMessage: 'Location services appear to be disabled on your device. Please enable location services in your device settings.',
          action: 'enable_device'
        };

      case error.TIMEOUT:
        return {
          code: 3,
          message: 'Timeout',
          userMessage: 'Location request timed out. This might be because location services are disabled on your device.',
          action: 'enable_device'
        };

      default:
        return {
          code: error.code,
          message: error.message,
          userMessage: 'Unable to get your location. Please check your device and browser settings.',
          action: 'retry'
        };
    }
  }

  /**
   * Get device-specific instructions for enabling location
   */
  getDeviceInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return `📱 Android Instructions:
1. Open Settings app
2. Go to "Location" or "Privacy & Location"
3. Turn on "Use location"
4. Return to browser and try again`;
    }
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return `📱 iOS Instructions:
1. Open Settings app
2. Go to "Privacy & Security" → "Location Services"
3. Turn on "Location Services"
4. Scroll down and find your browser (Safari/Chrome)
5. Select "While Using App"
6. Return to browser and try again`;
    }
    
    if (userAgent.includes('windows')) {
      return `🖥️ Windows Instructions:
1. Open Settings (Windows key + I)
2. Go to "Privacy & security" → "Location"
3. Turn on "Location services"
4. Make sure your browser is allowed
5. Restart browser and try again`;
    }
    
    if (userAgent.includes('mac')) {
      return `🖥️ Mac Instructions:
1. Open System Preferences/Settings
2. Go to "Security & Privacy" → "Privacy" → "Location Services"
3. Enable Location Services
4. Check your browser in the list
5. Restart browser and try again`;
    }
    
    return `📱 Device Instructions:
1. Open your device Settings
2. Find "Location" or "Privacy" settings
3. Enable location services
4. Allow location access for your browser
5. Return to this page and try again`;
  }

  /**
   * Get browser-specific instructions for enabling location
   */
  getBrowserInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return `🌐 Chrome Instructions:
1. Click the location icon (🌐) in the address bar
2. Select "Always allow location access"
3. Or go to Settings → Privacy → Site Settings → Location
4. Add this site to "Allowed" list
5. Refresh the page`;
    }
    
    if (userAgent.includes('firefox')) {
      return `🦊 Firefox Instructions:
1. Click the shield icon in the address bar
2. Click "Allow Location Access"
3. Or go to Settings → Privacy → Permissions → Location
4. Remove this site from blocked list
5. Refresh the page`;
    }
    
    if (userAgent.includes('safari')) {
      return `🧭 Safari Instructions:
1. Go to Safari → Preferences → Websites → Location
2. Find this website and set to "Allow"
3. Or click "Allow" when prompted
4. Refresh the page`;
    }
    
    if (userAgent.includes('edge')) {
      return `🔷 Edge Instructions:
1. Click the location icon in the address bar
2. Select "Allow"
3. Or go to Settings → Site permissions → Location
4. Add this site to allowed list
5. Refresh the page`;
    }
    
    return `🌐 Browser Instructions:
1. Look for a location icon in your address bar
2. Click it and select "Allow"
3. Or check your browser's privacy/security settings
4. Add this site to location allowed list
5. Refresh the page`;
  }

  /**
   * Check if we can prompt user to enable device location
   */
  canPromptDeviceLocation(): boolean {
    // Check if we're on a mobile device where we might be able to prompt
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone');
  }

  /**
   * Attempt to open device location settings (enhanced mobile support)
   */
  async promptDeviceLocationSettings(): Promise<boolean> {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Try different approaches based on platform
      if (userAgent.includes('android')) {
        // Android: Try to open location settings
        try {
          // This might work on some Android browsers
          window.open('android-app://com.android.settings/.LocationSettings', '_blank');
          return true;
        } catch (e) {
          console.log('Android settings link failed, showing instructions');
        }
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        // iOS: Try to open settings (limited support)
        try {
          window.open('App-Prefs:Privacy&path=LOCATION', '_blank');
          return true;
        } catch (e) {
          console.log('iOS settings link failed, showing instructions');
        }
      }
      
      // Experimental API for newer browsers
      const navigatorWithExperimental = navigator as Navigator & {
        permissions?: {
          requestPermission?: (name: string) => Promise<string>;
        };
      };
      
      if ('permissions' in navigator && navigatorWithExperimental.permissions?.requestPermission) {
        const result = await navigatorWithExperimental.permissions.requestPermission('geolocation');
        return result === 'granted';
      }
      
      // Fallback: Show instructions
      return false;
    } catch (error) {
      console.warn('Cannot programmatically open location settings:', error);
      return false;
    }
  }
}

export default LocationHandler;
