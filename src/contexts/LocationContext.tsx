import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider = ({ children }: LocationProviderProps) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasShownPermissionToast = useRef(false);

  // Start background location tracking when user logs in
  useEffect(() => {
    if (!user) {
      // Stop tracking when user logs out
      stopTracking();
      return;
    }

    // Start tracking when user is logged in
    startTracking();

    return () => {
      stopTracking();
    };
  }, [user]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }

    if (watchIdRef.current !== null) {
      // Already tracking
      return;
    }

    console.log('🌍 Iniciando rastreo de ubicación en segundo plano...');

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        };
        
        setCurrentLocation(locationData);
        setIsTracking(true);
        setError(null);
        console.log('📍 Ubicación inicial obtenida:', locationData);

        // Show success toast only once
        if (!hasShownPermissionToast.current) {
          toast.success('Ubicación activada en segundo plano', {
            description: 'Tu ubicación se está actualizando automáticamente',
            duration: 3000,
          });
          hasShownPermissionToast.current = true;
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación inicial:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          setError('Permisos de ubicación denegados');
          if (!hasShownPermissionToast.current) {
            toast.error('Permisos de ubicación necesarios', {
              description: 'Por favor, permite el acceso a tu ubicación en la configuración del navegador',
              duration: 5000,
            });
            hasShownPermissionToast.current = true;
          }
        } else if (error.code === error.TIMEOUT) {
          console.warn('Timeout al obtener ubicación inicial, continuando con watchPosition...');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Permite usar ubicación reciente
      }
    );

    // Start continuous watching
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        };
        
        setCurrentLocation(locationData);
        setIsTracking(true);
        setError(null);
        console.log('📍 Ubicación actualizada:', locationData);
      },
      (error) => {
        console.error('Error en watchPosition:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          setError('Permisos de ubicación denegados');
          stopTracking();
        }
        // Don't show errors for timeouts in background tracking
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // 20 segundos
        maximumAge: 30000, // Permite usar ubicación reciente de hasta 30 segundos
      }
    );

    watchIdRef.current = watchId;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('🛑 Rastreo de ubicación detenido');
    }
    setIsTracking(false);
  };

  return (
    <LocationContext.Provider value={{ currentLocation, isTracking, error }}>
      {children}
    </LocationContext.Provider>
  );
};
