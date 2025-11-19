import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker, Icon } from 'leaflet';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Report } from '@/hooks/useReportManagement';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different report statuses
const createCustomIcon = (status: string, priority: string) => {
  let color = '#3b82f6'; // default blue
  
  switch (status) {
    case 'pending':
      color = '#f59e0b'; // amber
      break;
    case 'in_progress':
      color = '#3b82f6'; // blue
      break;
    case 'resolved':
      color = '#10b981'; // green
      break;
    case 'closed':
      color = '#6b7280'; // gray
      break;
  }

  if (priority === 'critical') {
    color = '#ef4444'; // red for critical
  } else if (priority === 'high') {
    color = '#f97316'; // orange for high
  }

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

interface SingleReportMapProps {
  report: Report;
  className?: string;
}

export const SingleReportMap: React.FC<SingleReportMapProps> = ({
  report,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  if (!report.location?.latitude || !report.location?.longitude) {
    return (
      <div className={`flex items-center justify-center h-96 bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">No hay ubicación disponible para este reporte</p>
      </div>
    );
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`;
    window.open(url, '_blank');
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [report.location.latitude, report.location.longitude],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [report.location.latitude, report.location.longitude]);

  // Update marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.removeFrom(mapRef.current);
      markerRef.current = null;
    }

    // Add new marker
    const marker = L.marker(
      [report.location.latitude, report.location.longitude],
      { icon: createCustomIcon(report.status, report.priority) }
    ).addTo(mapRef.current);

    // Create popup content
    const popupContent = `
      <div>
        <h4 style="font-weight: 600; margin-bottom: 4px;">${report.nombre}</h4>
        <p style="font-size: 14px; color: #6b7280; margin-top: 4px;">
          ${report.location.address}
        </p>
        ${report.location.reference ? `
          <p style="font-size: 12px; color: #6b7280;">
            Referencia: ${report.location.reference}
          </p>
        ` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
          ${new Date(report.created_at).toLocaleString()}
        </p>
      </div>
    `;

    marker.bindPopup(popupContent);
    markerRef.current = marker;

    // Center map on marker
    mapRef.current.setView([report.location.latitude, report.location.longitude], 16);
  }, [report]);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={openInGoogleMaps}
        className="absolute top-2 right-2 z-[1000] bg-background/90 backdrop-blur-sm"
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        Google Maps
      </Button>
      <div ref={containerRef} className="rounded-lg h-96 w-full" />
    </div>
  );
};