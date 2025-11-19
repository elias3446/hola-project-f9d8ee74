import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSettings } from "./useSettings";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

const showNativeNotification = (title: string, body: string, data?: any) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data?.reporteId || "reporte-cercano",
      requireInteraction: false,
      silent: false,
      data,
    });

    // Cerrar la notificación después de 10 segundos
    setTimeout(() => notification.close(), 10000);

    // Manejar click en la notificación
    notification.onclick = () => {
      window.focus();
      if (data?.latitude && data?.longitude) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`,
          "_blank"
        );
      }
      notification.close();
    };
  }
};

type Reporte = Database["public"]["Tables"]["reportes"]["Row"];

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

const PROXIMITY_THRESHOLD = 100; // 100 meters
const CHECK_INTERVAL = 10000; // Check every 10 seconds

export const useRealTimeTracking = () => {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [isTracking, setIsTracking] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  // Track if user is currently inside the radius of each report
  const insideRadiusRef = useRef<Map<string, boolean>>(new Map());
  const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const checkNearbyReports = async (lat: number, lng: number) => {
    if (!profile?.id) return;

    try {
      // Fetch active reports
      const { data: reportes, error } = await supabase
        .from("reportes")
        .select(`
          *,
          categories(nombre, color),
          profiles!reportes_user_id_fkey(name)
        `)
        .in("status", ["pendiente", "en_progreso"])
        .eq("activo", true)
        .is("deleted_at", null);

      if (error) throw error;

      const now = Date.now();

      reportes?.forEach((reporte: any) => {
        if (!reporte.location) return;

        const location = reporte.location as LocationData;
        const distance = calculateDistance(
          lat,
          lng,
          location.latitude,
          location.longitude
        );

        const isInside = distance <= PROXIMITY_THRESHOLD;
        const wasInside = insideRadiusRef.current.get(reporte.id) || false;

        // Only notify when entering the radius (transition from outside to inside)
        if (isInside && !wasInside) {
          const reportTitle = reporte.nombre || reporte.titulo || reporte.id;
          const categoryName = reporte.categories?.nombre || "Sin categoría";
          
          console.log(`📢 Notificación de reporte cercano: ${reportTitle}, distancia: ${formatDistance(distance)}`);
          
          // Mostrar notificación nativa
          const notificationBody = `${categoryName} - Distancia: ${formatDistance(distance)}${location.address ? `\n${location.address}` : ""}`;
          
          showNativeNotification(
            "🚨 ¡Reporte cercano!",
            notificationBody,
            {
              reporteId: reporte.id,
              latitude: location.latitude,
              longitude: location.longitude,
            }
          );
          
          // Show toast notification como fallback/complemento
          toast("¡Te acercas a un reporte!", {
            description: (
              <div className="flex flex-col gap-2 mt-2">
                <div className="font-semibold">{reportTitle}</div>
                <div className="text-xs text-muted-foreground">{categoryName}</div>
                <div className="text-sm">
                  Distancia: <span className="font-medium">{formatDistance(distance)}</span>
                </div>
                {location.address && (
                  <div className="text-xs text-muted-foreground mt-1">{location.address}</div>
                )}
                <button
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
                      "_blank"
                    );
                  }}
                  className="mt-2 w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  🧭 Navegar
                </button>
              </div>
            ),
            duration: 10000,
          });
        }

        // Update the current state
        insideRadiusRef.current.set(reporte.id, isInside);
      });
    } catch (error) {
      console.error("Error checking nearby reports:", error);
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    // Solicitar permisos de notificaciones
    const hasPermission = await requestNotificationPermission();
    setNotificationPermission(Notification.permission);
    
    if (!hasPermission) {
      toast.info("Activa las notificaciones para recibir alertas de reportes cercanos", {
        duration: 5000,
      });
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        currentLocationRef.current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      },
      (error) => {
        console.error("Error getting location:", error);
        // Only show error for permission denied
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permisos de ubicación denegados");
          stopTracking();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 segundos para obtener ubicación
        maximumAge: 10000, // Permite usar ubicación reciente de hasta 10 segundos
      }
    );

    // Set up periodic check
    intervalIdRef.current = setInterval(() => {
      if (currentLocationRef.current) {
        checkNearbyReports(
          currentLocationRef.current.lat,
          currentLocationRef.current.lng
        );
      }
    }, CHECK_INTERVAL);

    setIsTracking(true);
    toast.success("Rastreo en tiempo real activado");
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    currentLocationRef.current = null;
    // Clear the radius tracking state when stopping
    insideRadiusRef.current.clear();
    setIsTracking(false);
    toast.info("Rastreo en tiempo real desactivado");
  };

  // Auto-start/stop based on settings
  useEffect(() => {
    if (!settings?.real_time_tracking_enabled || !profile?.id) {
      if (isTracking) {
        stopTracking();
      }
      return;
    }

    if (settings.real_time_tracking_enabled && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [settings?.real_time_tracking_enabled, profile?.id]);

  return {
    isTracking,
    notificationPermission,
    startTracking,
    stopTracking,
  };
};
