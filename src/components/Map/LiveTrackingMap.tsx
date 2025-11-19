import React, { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker, Icon, Polyline } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Navigation, MapPin, AlertCircle, Route } from 'lucide-react';
import { Report } from '@/hooks/useReportManagement';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// User location icon (blue)
const userIcon = new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle fill="#3b82f6" stroke="#ffffff" stroke-width="3" cx="15" cy="15" r="12"/>
      <circle fill="#ffffff" cx="15" cy="15" r="5"/>
    </svg>
  `)}`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Report icon creator
const createReportIcon = (status: string, priority: string) => {
  let color = '#3b82f6';
  
  switch (status) {
    case 'pending':
      color = '#f59e0b';
      break;
    case 'in_progress':
      color = '#3b82f6';
      break;
    case 'resolved':
      color = '#10b981';
      break;
    case 'closed':
      color = '#6b7280';
      break;
  }

  if (priority === 'critical') color = '#ef4444';
  else if (priority === 'high') color = '#f97316';

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 6.9 12.5 28.5 12.5 28.5s12.5-21.6 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="#ffffff" cx="12.5" cy="12.5" r="6"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

interface LiveTrackingMapProps {
  reports: Report[];
  onReportClick?: (report: Report) => void;
  maxDistance?: number; // km
  proximityThreshold?: number; // meters
  className?: string;
  onTrackingChange?: (isTracking: boolean) => void;
  onStatsChange?: (stats: { nearbyCount: number; nearest: number | null; pointsCount: number }) => void;
  autoStartTracking?: boolean; // Auto-start tracking when mounted
  initialCenter?: { lat: number; lng: number } | null; // Initial map center
}

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface ReportWithDistance extends Report {
  distance: number; // meters
}

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  reports,
  onReportClick,
  maxDistance = 10, // 10km default
  proximityThreshold = 100, // 100m default
  className = '',
  onTrackingChange,
  onStatsChange,
  autoStartTracking = false,
  initialCenter = null
}) => {
  const { currentLocation: backgroundLocation } = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const reportMarkersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const routeLineRef = useRef<Polyline | null>(null);
  const pathLineRef = useRef<Polyline | null>(null);
  const hasRestoredRef = useRef(false); // Track if we've already restored tracking
  
  // Load persisted state from localStorage
  const loadPersistedState = (): {
    isTracking: boolean;
    history: Position[];
    notified: Set<string>;
  } => {
    try {
      const persistedTracking = localStorage.getItem('liveTracking_isActive');
      const persistedHistory = localStorage.getItem('liveTracking_history');
      const persistedNotified = localStorage.getItem('liveTracking_notified');
      
      return {
        isTracking: persistedTracking === 'true',
        history: persistedHistory ? JSON.parse(persistedHistory) : [],
        notified: persistedNotified ? new Set<string>(JSON.parse(persistedNotified)) : new Set<string>()
      };
    } catch (error) {
      console.error('Error loading persisted tracking state:', error);
      return { isTracking: false, history: [], notified: new Set<string>() };
    }
  };

  const persisted = loadPersistedState();
  
  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [isTracking, setIsTracking] = useState(persisted.isTracking);
  const [isMapReady, setIsMapReady] = useState(false);
  const [movementHistory, setMovementHistory] = useState<Position[]>(persisted.history);
  const [filteredReports, setFilteredReports] = useState<ReportWithDistance[]>([]);
  const [nearestReport, setNearestReport] = useState<ReportWithDistance | null>(null);
  const [notifiedReports, setNotifiedReports] = useState<Set<string>>(persisted.notified);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = initialCenter 
      ? [initialCenter.lat, initialCenter.lng]
      : [-0.1807, -78.4678]; // Quito, Ecuador

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: initialCenter ? 15 : 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    
    // Mark map as ready after tiles load
    map.whenReady(() => {
      setIsMapReady(true);
    });

    return () => {
      setIsMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter]);

  // Expose tracking control
  useEffect(() => {
    (window as any).toggleTracking = toggleTracking;
    (window as any).clearTrackingHistory = clearHistory;
    return () => {
      delete (window as any).toggleTracking;
      delete (window as any).clearTrackingHistory;
    };
  }, [isTracking, movementHistory]);

  // Persist tracking state
  useEffect(() => {
    localStorage.setItem('liveTracking_isActive', isTracking.toString());
  }, [isTracking]);

  // Persist movement history
  useEffect(() => {
    localStorage.setItem('liveTracking_history', JSON.stringify(movementHistory));
  }, [movementHistory]);

  // Persist notified reports
  useEffect(() => {
    localStorage.setItem('liveTracking_notified', JSON.stringify(Array.from(notifiedReports)));
  }, [notifiedReports]);

  // Notify parent of tracking state changes
  useEffect(() => {
    onTrackingChange?.(isTracking);
  }, [isTracking, onTrackingChange]);

  // Update position from background location service
  useEffect(() => {
    if (!backgroundLocation || !isTracking) return;
    
    const newPos: Position = {
      lat: backgroundLocation.lat,
      lng: backgroundLocation.lng,
      timestamp: backgroundLocation.timestamp,
    };
    
    setUserPosition(newPos);
    setMovementHistory(prev => [...prev, newPos]);
  }, [backgroundLocation, isTracking]);

  // Notify parent of stats changes
  useEffect(() => {
    onStatsChange?.({
      nearbyCount: filteredReports.length,
      nearest: nearestReport?.distance ?? null,
      pointsCount: movementHistory.length
    });
  }, [filteredReports.length, nearestReport, movementHistory.length, onStatsChange]);

  // Start tracking process - now simplified with background location
  const startTrackingProcess = () => {
    // Check if we have background location available
    if (!backgroundLocation) {
      toast.error('Esperando ubicación en segundo plano...', {
        description: 'La ubicación se está obteniendo automáticamente',
      });
      return;
    }

    // Clear history when starting tracking
    setMovementHistory([]);
    setNotifiedReports(new Set());
    localStorage.removeItem('liveTracking_history');
    localStorage.removeItem('liveTracking_notified');
    
    // Clear path line if exists
    if (pathLineRef.current && mapRef.current) {
      pathLineRef.current.removeFrom(mapRef.current);
      pathLineRef.current = null;
    }

    // Use background location immediately
    const newPos: Position = {
      lat: backgroundLocation.lat,
      lng: backgroundLocation.lng,
      timestamp: backgroundLocation.timestamp,
    };
    
    setUserPosition(newPos);
    setMovementHistory([newPos]);
    
    // Center map on user
    if (mapRef.current) {
      mapRef.current.setView([newPos.lat, newPos.lng], 15);
    }

    setIsTracking(true);
    toast.success('Rastreo en vivo activado', {
      description: 'Historial limpiado y centrado en tu ubicación',
    });
  };

  // Clear history function
  const clearHistory = () => {
    setMovementHistory([]);
    setNotifiedReports(new Set());
    localStorage.removeItem('liveTracking_history');
    localStorage.removeItem('liveTracking_notified');
    if (pathLineRef.current && mapRef.current) {
      pathLineRef.current.removeFrom(mapRef.current);
      pathLineRef.current = null;
    }
    toast.info('Historial borrado');
  };

  // Start/Stop tracking
  const toggleTracking = () => {
    if (isTracking) {
      // Stop tracking
      setIsTracking(false);
      localStorage.setItem('liveTracking_isActive', 'false');
      toast.info('Rastreo en vivo detenido', {
        description: 'La ubicación en segundo plano sigue activa',
      });
    } else {
      startTrackingProcess();
    }
  };

  // Update user marker and restore position from history
  useEffect(() => {
    if (!mapRef.current) return;

    // If we have history but no current position (restored from localStorage), use last position
    if (!userPosition && movementHistory.length > 0) {
      const lastPosition = movementHistory[movementHistory.length - 1];
      setUserPosition(lastPosition);
      return;
    }

    if (!userPosition) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
    } else {
      const marker = L.marker([userPosition.lat, userPosition.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('Tu ubicación');
      userMarkerRef.current = marker;
      
      // Center map on user's position
      mapRef.current.setView([userPosition.lat, userPosition.lng], 15);
    }
  }, [userPosition, movementHistory]);

  // Update movement path - ensure it renders even when restored from localStorage
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clean up existing path
    if (pathLineRef.current) {
      pathLineRef.current.removeFrom(mapRef.current);
      pathLineRef.current = null;
    }
    
    // Only draw if we have at least 2 points
    if (movementHistory.length < 2) return;

    const pathCoords = movementHistory.map(pos => [pos.lat, pos.lng] as [number, number]);

    const line = L.polyline(pathCoords, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.6,
      dashArray: '5, 10',
    }).addTo(mapRef.current);
    pathLineRef.current = line;
  }, [movementHistory, isMapReady]); // Also depend on map being ready

  // Filter reports by distance and calculate distances
  useEffect(() => {
    // If not tracking, show ALL reports without filtering
    if (!isTracking) {
      const allReports = reports
        .filter(report => report.location?.latitude && report.location?.longitude)
        .map(report => ({
          ...report,
          distance: 0, // Distance not relevant when not tracking
        }));
      setFilteredReports(allReports);
      setNearestReport(null);
      return;
    }

    // If tracking but no position yet, show no reports
    if (!userPosition) {
      setFilteredReports([]);
      return;
    }

    // When tracking, filter by distance
    const reportsWithDistance = reports
      .filter(report => report.location?.latitude && report.location?.longitude)
      .map(report => ({
        ...report,
        distance: calculateDistance(
          userPosition.lat,
          userPosition.lng,
          report.location.latitude,
          report.location.longitude
        ),
      }))
      .filter(report => report.distance <= maxDistance * 1000) // Convert km to meters
      .sort((a, b) => a.distance - b.distance);

    setFilteredReports(reportsWithDistance);

    // Set nearest report
    if (reportsWithDistance.length > 0) {
      setNearestReport(reportsWithDistance[0]);
    } else {
      setNearestReport(null);
    }
  }, [isTracking, userPosition, reports, maxDistance]);

  // Check proximity alerts
  useEffect(() => {
    if (!userPosition || !isTracking) return;

    filteredReports.forEach(report => {
      if (report.distance > 0 && report.distance <= proximityThreshold && !notifiedReports.has(report.id)) {
        toast.warning(
          `Estás cerca del reporte: ${report.nombre} (${formatDistance(report.distance)})`,
          { duration: 5000 }
        );
        setNotifiedReports(prev => new Set(prev).add(report.id));
      }
    });
  }, [filteredReports, proximityThreshold, notifiedReports, userPosition, isTracking]);

  // Update report markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    reportMarkersRef.current.forEach(marker => marker.removeFrom(mapRef.current!));
    reportMarkersRef.current.clear();

    // Add new markers
    filteredReports.forEach(report => {
      const marker = L.marker(
        [report.location.latitude, report.location.longitude],
        { icon: createReportIcon(report.status, report.priority) }
      )
        .addTo(mapRef.current!)
        .bindPopup(`
          <div>
            <h4 style="font-weight: 600; margin-bottom: 4px;">${report.nombre}</h4>
            ${isTracking && report.distance > 0 ? `
              <p style="font-size: 14px; color: #6b7280;">
                Distancia: ${report.distance >= 1000 
                  ? `${(report.distance / 1000).toFixed(2)} km` 
                  : `${Math.round(report.distance)} m`}
              </p>
            ` : ''}
            <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${report.location.address || 'Sin dirección'}
            </p>
          </div>
        `);

      marker.on('click', () => onReportClick?.(report));
      reportMarkersRef.current.set(report.id, marker);
    });
  }, [filteredReports, onReportClick, isTracking]);

  // Draw route to nearest report
  useEffect(() => {
    if (!mapRef.current || !userPosition || !nearestReport) {
      if (routeLineRef.current) {
        routeLineRef.current.removeFrom(mapRef.current!);
        routeLineRef.current = null;
      }
      return;
    }

    const routeCoords: [number, number][] = [
      [userPosition.lat, userPosition.lng],
      [nearestReport.location.latitude, nearestReport.location.longitude],
    ];

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(routeCoords);
    } else {
      const line = L.polyline(routeCoords, {
        color: '#ef4444',
        weight: 3,
        opacity: 0.7,
      }).addTo(mapRef.current);
      routeLineRef.current = line;
    }
  }, [userPosition, nearestReport]);

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Compact Stats Card - Only visible when tracking */}
      {isTracking && userPosition && (
        <Card className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm shadow-lg p-3 max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reportes cercanos:</span>
              <Badge variant="secondary" className="ml-2">{filteredReports.length}</Badge>
            </div>

            {nearestReport && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Más cercano:</span>
                    <Badge variant="outline" className="ml-2">{formatDistance(nearestReport.distance)}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{nearestReport.id}</p>
                </div>
              </>
            )}

            {movementHistory.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Puntos registrados:</span>
                  <Badge variant="secondary" className="ml-2">{movementHistory.length}</Badge>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Map */}
      <div ref={containerRef} className="rounded-lg h-full w-full" style={{ minHeight: '500px' }} />
    </div>
  );
};
