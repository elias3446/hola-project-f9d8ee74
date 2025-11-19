import { Layout } from "@/components/Layout";
import { MapPin, Calendar, User, MapPinned, ExternalLink, X, Filter, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { useReportManagement } from "@/hooks/useReportManagement";
import { LiveTrackingMap } from "@/components/Map";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Rastreo = () => {
  const navigate = useNavigate();
  const { getReports } = useReportManagement();
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStats, setTrackingStats] = useState({ nearbyCount: 0, nearest: null as number | null, pointsCount: 0 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadReports();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        }
      );
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterReports();
  }, [statusFilter, reports]);

  const filterReports = () => {
    let filtered = [...reports];

    switch (statusFilter) {
      case "pendiente_publico":
        filtered = filtered.filter(r => r.status === "pendiente" && r.visibility === "publico");
        break;
      case "en_proceso_publico":
        filtered = filtered.filter(r => r.status === "en_proceso" && r.visibility === "publico");
        break;
      case "pendiente_privado":
        filtered = filtered.filter(r => r.status === "pendiente" && r.visibility === "privado");
        break;
      case "en_proceso_privado":
        filtered = filtered.filter(r => r.status === "en_proceso" && r.visibility === "privado");
        break;
      case "all":
      default:
        // No filter
        break;
    }

    setFilteredReports(filtered);
  };

  const handleReportClick = (report: any) => {
    setSelectedReport(report);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pendiente: { label: "Pendiente", variant: "secondary" },
      en_proceso: { label: "En Proceso", variant: "default" },
      resuelto: { label: "Resuelto", variant: "outline" },
      cerrado: { label: "Cerrado", variant: "outline" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: any }> = {
      bajo: { label: "Baja", variant: "secondary" },
      medio: { label: "Media", variant: "default" },
      alto: { label: "Alta", variant: "default" },
      critico: { label: "Urgente", variant: "destructive" },
    };
    const priorityInfo = priorityMap[priority] || { label: priority, variant: "secondary" };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityMap: Record<string, { label: string; variant: any }> = {
      publico: { label: "Público", variant: "outline" },
      privado: { label: "Privado", variant: "secondary" },
    };
    const visibilityInfo = visibilityMap[visibility] || { label: visibility, variant: "outline" };
    return <Badge variant={visibilityInfo.variant}>{visibilityInfo.label}</Badge>;
  };

  const toggleTracking = () => {
    if ((window as any).toggleTracking) {
      (window as any).toggleTracking();
    }
  };

  const clearHistory = () => {
    if ((window as any).clearTrackingHistory) {
      (window as any).clearTrackingHistory();
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  const getDistanceToReport = (report: any) => {
    if (!userLocation || !report.location) return null;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      report.location.latitude,
      report.location.longitude
    );
    
    return formatDistance(distance);
  };

  return (
    <Layout title="Mapa de Reportes Activos" icon={MapPin}>
      <div className="w-full h-full flex flex-col gap-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado del Reporte" />
              </SelectTrigger>
              <SelectContent className="z-[1200]">
                <SelectItem value="all">Todos los reportes</SelectItem>
                <SelectItem value="pendiente_publico">Pendientes Públicos</SelectItem>
                <SelectItem value="en_proceso_publico">En Proceso Públicos</SelectItem>
                <SelectItem value="pendiente_privado">Pendientes Privados</SelectItem>
                <SelectItem value="en_proceso_privado">En Proceso Privados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tracking Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleTracking}
            variant={isTracking ? 'destructive' : 'default'}
            size="default"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isTracking ? 'Detener Rastreo en Vivo' : 'Iniciar Rastreo en Vivo'}
          </Button>

          {trackingStats.pointsCount > 0 && (
            <Button
              onClick={clearHistory}
              variant="outline"
              size="default"
            >
              Limpiar Historial
            </Button>
          )}
        </div>

        {/* Info Text - Above Map */}
        {!isTracking && (
          <Card className="bg-primary/10 border-primary/20 p-3 text-center">
            <p className="text-sm font-medium">
              {filteredReports.length} {filteredReports.length === 1 ? 'reporte mostrado' : 'reportes mostrados'} en el mapa • Mostrando todos los reportes activos • Haz clic en un marcador para ver detalles
            </p>
          </Card>
        )}

        {/* Live Tracking Map */}
        <div className="flex-1 w-full" style={{ minHeight: 'calc(100vh - 16rem)' }}>
          <LiveTrackingMap
            reports={filteredReports}
            onReportClick={handleReportClick}
            maxDistance={10}
            proximityThreshold={100}
            className="h-full"
            onTrackingChange={setIsTracking}
            onStatsChange={setTrackingStats}
            initialCenter={userLocation}
          />
        </div>

        {/* Report Details Drawer */}
        <Drawer open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DrawerContent>
            <DrawerHeader className="text-left border-b relative">
              <DrawerTitle>Detalles del Reporte</DrawerTitle>
              <DrawerClose className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </DrawerClose>
            </DrawerHeader>
            
            {selectedReport && (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Report ID */}
                <div>
                  <h3 className="text-2xl font-bold">{selectedReport.nombre}</h3>
                  <p className="text-sm text-muted-foreground mt-1">ID: {selectedReport.id}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {getPriorityBadge(selectedReport.priority)}
                  {getStatusBadge(selectedReport.status)}
                  {getVisibilityBadge(selectedReport.visibility)}
                </div>

                <Separator />

                {/* Description */}
                {selectedReport.descripcion && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Descripción</h4>
                    <p className="text-sm text-muted-foreground">{selectedReport.descripcion}</p>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Categoría
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <p className="text-sm">
                      {selectedReport.categories?.nombre || "Sin categoría"}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Estado</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <p className="text-sm">
                      {selectedReport.status === "pendiente" ? "Pendiente" :
                       selectedReport.status === "en_proceso" ? "En Proceso" :
                       selectedReport.status === "resuelto" ? "Resuelto" :
                       selectedReport.status === "cerrado" ? "Cerrado" : "Sin estado"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {selectedReport.location && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPinned className="h-4 w-4" />
                      Ubicación
                    </h4>
                    
                    {isTracking && getDistanceToReport(selectedReport) && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium">
                          Distancia: <span className="text-primary">{getDistanceToReport(selectedReport)}</span>
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.location.latitude?.toFixed(6)}, {selectedReport.location.longitude?.toFixed(6)}
                    </p>
                    {selectedReport.location.address && (
                      <p className="text-sm">{selectedReport.location.address}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        const lat = selectedReport.location.latitude;
                        const lng = selectedReport.location.longitude;
                        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Google Maps
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Created Date */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de creación
                  </h4>
                  <p className="text-sm">
                    {format(new Date(selectedReport.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </p>
                </div>

                {/* Creator */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Creado por
                  </h4>
                  <p className="text-sm">{selectedReport.profiles?.name || "Usuario desconocido"}</p>
                </div>

                {/* Assigned To */}
                {selectedReport.assigned_profiles && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Asignado a
                    </h4>
                    <p className="text-sm">{selectedReport.assigned_profiles.name}</p>
                  </div>
                )}

                <Separator />

                {/* Full Details Button */}
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedReport(null);
                    navigate(`/reportes/${selectedReport.id}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Detalle Completo
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </Layout>
  );
};

export default Rastreo;
