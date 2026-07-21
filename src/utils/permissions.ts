/**
 * Permission Handling Utility
 * Manages camera and location permissions with retry logic
 */

export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Check current permission status
 */
export async function checkPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    camera: 'unknown',
    location: 'unknown'
  };

  try {
    // Check camera permission
    if (navigator.permissions) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      status.camera = cameraPermission.state as any;
    }
  } catch (error) {
    console.log('[Permissions] Camera permission check not supported');
  }

  try {
    // Check location permission
    if (navigator.permissions) {
      const locationPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      status.location = locationPermission.state as any;
    }
  } catch (error) {
    console.log('[Permissions] Location permission check not supported');
  }

  return status;
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } // Use back camera
    });
    
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('[Permissions] Camera permission denied:', error);
    return false;
  }
}

/**
 * Request location permission and get current location
 */
export async function requestLocationPermission(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('[Permissions] Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.error('[Permissions] Location permission denied:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Request both camera and location permissions
 */
export async function requestAllPermissions(): Promise<{
  camera: boolean;
  location: LocationData | null;
}> {
  const [camera, location] = await Promise.all([
    requestCameraPermission(),
    requestLocationPermission()
  ]);

  return { camera, location };
}

/**
 * Get device information
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}
