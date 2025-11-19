import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ReportsMapProps {
  reports: Report[];
  onReportClick?: (report: Report) => void;
  className?: string;
}

export const ReportsMap: React.FC<ReportsMapProps> = ({
  reports,
  onReportClick,
  className = ''
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[-0.1807, -78.4678]} // Quito, Ecuador
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {reports.map((report) => {
          if (!report.location?.latitude || !report.location?.longitude) return null;
          
          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              icon={createCustomIcon(report.status, report.priority)}
              eventHandlers={{
                click: () => onReportClick?.(report),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-semibold mb-2">{report.nombre}</h4>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                    </div>
                  </div>

                  {report.descripcion && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.descripcion.length > 100 
                        ? `${report.descripcion.substring(0, 100)}...` 
                        : report.descripcion
                      }
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <div>{report.location.address}</div>
                    {report.location.reference && (
                      <div>Ref: {report.location.reference}</div>
                    )}
                    <div className="mt-1">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onReportClick?.(report)}
                  >
                    Ver detalles
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};