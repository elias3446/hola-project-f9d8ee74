import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, History, Edit, MapPin, Image, Navigation } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportManagement } from "@/hooks/useReportManagement";
import { toast } from "sonner";
import { ReporteSidebar } from "./detalle/ReporteSidebar";
import { ReporteAuditoria } from "./detalle/ReporteAuditoria";
import { ReporteHistorial } from "./detalle/ReporteHistorial";
import { ReporteEvidencia } from "./detalle/ReporteEvidencia";
import { SingleReportMap, LiveTrackingMap } from "@/components/Map";

const ReporteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReportById, updateReport } = useReportManagement();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  useEffect(() => {
    if (id) {
      loadReportData();
    }
  }, [id]);

  const loadReportData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const reportData = await getReportById(id);
      setReport(reportData);
    } catch (error) {
      toast.error("No se pudo cargar el reporte");
      navigate("/reportes");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!report) return;
    
    setUpdatingStatus(true);
    try {
      await updateReport(report.id, { activo: false, status: "resuelto" });
      setReport((prev: any) => prev ? { ...prev, activo: false, status: "resuelto" } : prev);
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!report) return;
    
    setUpdatingVisibility(true);
    const newVisibility = report.visibility === "publico" ? "privado" : "publico";
    
    try {
      await updateReport(report.id, { visibility: newVisibility });
      setReport((prev: any) => prev ? { ...prev, visibility: newVisibility } : prev);
      toast.success(`Reporte actualizado a ${newVisibility === "publico" ? "público" : "privado"}`);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Error al actualizar la visibilidad");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  if (loading || !report) {
    return (
      <Layout title="Detalle de Reporte" icon={FileText}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Detalle del Reporte" icon={FileText}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Detalle del Reporte</h1>
                <p className="text-sm text-muted-foreground">Información completa del reporte</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/reportes/editar/${report.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Reporte
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <ReporteSidebar
              report={report}
              onToggleStatus={handleToggleStatus}
              updatingStatus={updatingStatus}
              onToggleVisibility={handleToggleVisibility}
              updatingVisibility={updatingVisibility}
            />
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="ubicacion" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                <TabsTrigger value="ubicacion" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </TabsTrigger>
                <TabsTrigger value="rastreo" className="gap-2">
                  <Navigation className="h-4 w-4" />
                  Rastreo
                </TabsTrigger>
                <TabsTrigger value="evidencia" className="gap-2">
                  <Image className="h-4 w-4" />
                  Evidencia
                </TabsTrigger>
                <TabsTrigger value="historial" className="gap-2">
                  <History className="h-4 w-4" />
                  Historial
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Auditoría
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ubicacion" className="mt-6">
                {report.location ? (
                  <div className="bg-card rounded-lg border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Ubicación del Reporte</h3>
                    </div>

                    {/* Interactive Map */}
                    <div className="w-full rounded-lg overflow-hidden">
                      <SingleReportMap report={report} className="h-full" />
                    </div>

                    {/* Location details */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium">Detalles de ubicación</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dirección:</p>
                          <p className="text-sm">{report.location.address || "No especificada"}</p>
                        </div>
                        {report.location.reference && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Referencia:</p>
                            <p className="text-sm">{report.location.reference}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Coordenadas:</p>
                          <p className="text-sm">
                            ({report.location.latitude?.toFixed(6)}, {report.location.longitude?.toFixed(6)})
                          </p>
                        </div>
                        {report.location.building && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Edificio:</p>
                            <p className="text-sm">{report.location.building}</p>
                          </div>
                        )}
                        {report.location.floor && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Piso:</p>
                            <p className="text-sm">{report.location.floor}</p>
                          </div>
                        )}
                        {report.location.room && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Sala/Oficina:</p>
                            <p className="text-sm">{report.location.room}</p>
                          </div>
                        )}
                        {report.location.additional_info && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Información adicional:</p>
                            <p className="text-sm">{report.location.additional_info}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border p-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No hay ubicación registrada para este reporte</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rastreo" className="mt-6">
                <div className="bg-card rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Navigation className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Rastreo en Tiempo Real</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    El rastreo se iniciará automáticamente para mostrarte tu ubicación en tiempo real y la ruta hasta este reporte.
                  </p>
                  <div className="w-full rounded-lg overflow-hidden">
                    <LiveTrackingMap
                      reports={[report]}
                      onReportClick={() => {}}
                      maxDistance={50}
                      proximityThreshold={100}
                      className="h-[500px]"
                      autoStartTracking={true}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="evidencia" className="mt-6">
                <ReporteEvidencia imagenes={report.imagenes} />
              </TabsContent>

              <TabsContent value="historial" className="mt-6">
                <ReporteHistorial reportId={report.id} />
              </TabsContent>

              <TabsContent value="auditoria" className="mt-6">
                <ReporteAuditoria
                  reportId={report.id}
                  reportName={report.nombre}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReporteDetalle;
