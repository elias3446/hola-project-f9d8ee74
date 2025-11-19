import React, { useCallback, useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  reference?: string;
}

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ReportFormMapProps {
  selectedLocation?: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
  className?: string;
}

export const ReportFormMap: React.FC<ReportFormMapProps> = ({
  selectedLocation,
  onLocationSelect,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const selectedMarkerRef = useRef<LeafletMarker | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const { currentLocation } = useLocation();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Update user location from context
  useEffect(() => {
    if (currentLocation) {
      setUserLocation([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

  const getMapCenter = (): [number, number] => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }
    if (userLocation) {
      return userLocation;
    }
    return [-0.1807, -78.4678]; // Quito, Ecuador
  };

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: getMapCenter(),
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Click handler for selecting location
    const onClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
        );
        const data = await response.json();
        // Always prioritize the readable address from the API
        const address = (data.display_name && data.display_name.trim()) 
          ? data.display_name 
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: address,
        };
        onLocationSelect(locationData);
      } catch (_err) {
        // Only use coordinates as fallback if API call fails
        const fallback: LocationData = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        onLocationSelect(fallback);
      }
    };

    map.on('click', onClick);
    mapRef.current = map;

    return () => {
      map.off('click', onClick);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep map centered when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(getMapCenter(), 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Update selected location marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.removeFrom(mapRef.current);
      selectedMarkerRef.current = null;
    }

    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      const icon = new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
          <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f59e0b" stroke="#ffffff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 6.9 12.5 28.5 12.5 28.5s12.5-21.6 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
            <circle fill="#ffffff" cx="12.5" cy="12.5" r="6"/>
          </svg>
        `)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const marker = L.marker([selectedLocation.latitude, selectedLocation.longitude], { 
        icon,
        draggable: true // Make marker draggable
      })
        .addTo(mapRef.current)
        .bindPopup(
          `<div><strong>Ubicación seleccionada</strong><br/><small>${selectedLocation.address}</small></div>`
        );

      // Handle drag end to update location
      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng();
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
          );
          const data = await response.json();
          // Always prioritize the readable address from the API
          const address = (data.display_name && data.display_name.trim()) 
            ? data.display_name 
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const locationData: LocationData = {
            latitude: lat,
            longitude: lng,
            address: address,
          };
          onLocationSelect(locationData);
        } catch (_err) {
          // Only use coordinates as fallback if API call fails
          const fallback: LocationData = {
            latitude: lat, 
            longitude: lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          };
          onLocationSelect(fallback);
        }
      });

      selectedMarkerRef.current = marker;
    }
  }, [selectedLocation]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.removeFrom(mapRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle fill="#3b82f6" cx="10" cy="10" r="8" stroke="#ffffff" stroke-width="2"/>
            <circle fill="#ffffff" cx="10" cy="10" r="3"/>
          </svg>
        `)}`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(userLocation, { icon })
        .addTo(mapRef.current)
        .bindPopup('<div class="text-center"><strong>Tu ubicación</strong></div>');
      
      // Allow selecting exact user position by clicking the blue marker
      marker.on('click', () => {
        const [lat, lng] = userLocation;
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      });

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  const getCurrentLocation = useCallback(() => {
    if (!currentLocation) return;
    
    const coords: [number, number] = [currentLocation.lat, currentLocation.lng];
    
    // Center map immediately to user's position
    if (mapRef.current) {
      mapRef.current.setView(coords, 15);
    }
  }, [currentLocation]);

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          type="button"
          onClick={getCurrentLocation}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Obteniendo...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Mi ubicación
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Haz clic en el mapa para seleccionar la ubicación
            </p>
          </CardContent>
        </Card>
      </div>

      <div ref={containerRef} className="rounded-lg h-96 w-full" />
    </div>
  );
};
