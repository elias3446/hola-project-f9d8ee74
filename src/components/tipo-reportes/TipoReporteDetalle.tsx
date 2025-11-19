import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileType, FileText, History, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTipoCategoryManagement } from "@/hooks/useTipoCategoryManagement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TipoReporteSidebar } from "./detalle/TipoReporteSidebar";
import { TipoReporteReportes } from "./detalle/TipoReporteReportes";
import { TipoReporteAuditoria } from "./detalle/TipoReporteAuditoria";

const TipoReporteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getTipoCategoryById, updateTipoCategory } = useTipoCategoryManagement();
  
  const categoryParam = searchParams.get("category");
  const getBackUrl = () => categoryParam ? `/tipos-reportes?category=${categoryParam}` : "/tipos-reportes";
  const getEditUrl = () => categoryParam ? `/tipos-reportes/editar/${tipoReporte?.id}?category=${categoryParam}` : `/tipos-reportes/editar/${tipoReporte?.id}`;
  
  const [tipoReporte, setTipoReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(true);

  useEffect(() => {
    if (id) {
      loadTipoReporteData();
      loadReportes();
    }
  }, [id]);

  const loadTipoReporteData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const tipoReporteData = await getTipoCategoryById(id);
      
      // Obtener información de la categoría relacionada si existe
      if (tipoReporteData.category_id) {
        const { data: category } = await supabase
          .from("categories")
          .select("*")
          .eq("id", tipoReporteData.category_id)
          .single();
        
        setTipoReporte({
          ...tipoReporteData,
          category: category
        });
      } else {
        setTipoReporte(tipoReporteData);
      }
    } catch (error) {
      toast.error("No se pudo cargar el tipo de reporte");
      navigate("/tipos-reportes");
    } finally {
      setLoading(false);
    }
  };

  const loadReportes = async () => {
    if (!id) return;
    
    setLoadingReportes(true);
    try {
      const { data, error } = await supabase
        .from("reportes")
        .select("*")
        .eq("tipo_reporte_id", id)
        .is("deleted_at", null);

      if (error) throw error;
      setReportes(data || []);
    } catch (error) {
      console.error("Error loading reportes:", error);
    } finally {
      setLoadingReportes(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tipoReporte) return;
    
    setUpdatingStatus(true);
    try {
      await updateTipoCategory(tipoReporte.id, { activo: !tipoReporte.activo });
      setTipoReporte((prev: any) => prev ? { ...prev, activo: !prev.activo } : prev);
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading || !tipoReporte) {
    return (
      <Layout title="Detalle de Tipo de Reporte" icon={FileType}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Detalle del Tipo de Reporte" icon={FileType}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(getBackUrl())}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Detalle del Tipo de Reporte</h1>
                <p className="text-muted-foreground">Información completa del tipo de reporte</p>
              </div>
            </div>
            <Button onClick={() => navigate(getEditUrl())} className="w-full sm:w-auto sm:mt-8">
              <Edit className="h-4 w-4 mr-2" />
              Editar Tipo de Reporte
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <TipoReporteSidebar
              tipoReporte={tipoReporte}
              onToggleStatus={handleToggleStatus}
              updatingStatus={updatingStatus}
            />
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="reportes" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                <TabsTrigger value="reportes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Reportes
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="gap-2">
                  <History className="h-4 w-4" />
                  Auditoría
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reportes" className="mt-6">
                <TipoReporteReportes
                  reportes={reportes}
                  loadingReportes={loadingReportes}
                  tipoReporteNombre={tipoReporte.nombre}
                />
              </TabsContent>

              <TabsContent value="auditoria" className="mt-6">
                <TipoReporteAuditoria
                  tipoReporteId={tipoReporte.id}
                  tipoReporteNombre={tipoReporte.nombre}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TipoReporteDetalle;
