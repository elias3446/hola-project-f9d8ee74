import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, FileText, History, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CategorySidebar } from "./detalle/CategorySidebar";
import { CategoryReportes } from "./detalle/CategoryReportes";
import { CategoryAuditoria } from "./detalle/CategoryAuditoria";

const CategoriaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCategoryById, updateCategory } = useCategoryManagement();
  
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(true);

  useEffect(() => {
    if (id) {
      loadCategoryData();
      loadReportes();
    }
  }, [id]);

  const loadCategoryData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const categoryData = await getCategoryById(id);
      setCategory(categoryData);
    } catch (error) {
      toast.error("No se pudo cargar la categoría");
      navigate("/categorias");
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
        .eq("categoria_id", id)
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
    if (!category) return;
    
    setUpdatingStatus(true);
    try {
      await updateCategory(category.id, { activo: !category.activo });
      setCategory((prev: any) => prev ? { ...prev, activo: !prev.activo } : prev);
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading || !category) {
    return (
      <Layout title="Detalle de Categoría" icon={Tag}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Detalle de la Categoría" icon={Tag}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/categorias")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Detalle de la Categoría</h1>
                <p className="text-muted-foreground">Información completa de la categoría</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/categorias/editar/${category.id}`)} className="w-full sm:w-auto sm:mt-8">
              <Edit className="h-4 w-4 mr-2" />
              Editar Categoría
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <CategorySidebar
              category={category}
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
                <CategoryReportes
                  reportes={reportes}
                  loadingReportes={loadingReportes}
                  categoryName={category.nombre}
                />
              </TabsContent>

              <TabsContent value="auditoria" className="mt-6">
                <CategoryAuditoria
                  categoryId={category.id}
                  categoryName={category.nombre}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoriaDetalle;
