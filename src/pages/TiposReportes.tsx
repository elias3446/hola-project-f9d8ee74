import { Layout } from "@/components/Layout";
import { FileType, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useTipoCategoryManagement } from "@/hooks/useTipoCategoryManagement";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { TipoReportesTable } from "@/components/tipo-reportes/TipoReportesTable";
import { 
  DataTableToolbar, 
  DataTableColumn, 
  DataTableFilters 
} from "@/components/ui/data-table-toolbar";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TiposReportes = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("category");
  const { getTipoCategories, updateTipoCategory, deleteTipoCategory } = useTipoCategoryManagement();
  const { getCategories, getCategoryById } = useCategoryManagement();
  const [tipoReportes, setTipoReportes] = useState<any[]>([]);
  const [filteredTipoReportes, setFilteredTipoReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showNoCategoriesDialog, setShowNoCategoriesDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<any>(null);
  const [filters, setFilters] = useState<DataTableFilters>({
    search: "",
    sortBy: "nombre",
    sortOrder: "asc",
    columnFilters: {},
    propertyFilters: {},
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tipoReporteToDelete, setTipoReporteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTipoReportes();
    if (categoryIdParam) {
      loadFilterCategory();
    } else {
      setFilterCategory(null);
    }

    const channel = supabase
      .channel('tipo-categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tipo_categories' }, () => {
        loadTipoReportes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [categoryIdParam]);

  const loadFilterCategory = async () => {
    if (!categoryIdParam) return;
    try {
      const category = await getCategoryById(categoryIdParam);
      setFilterCategory(category);
    } catch (error) {
      console.error("Error loading filter category:", error);
      setFilterCategory(null);
    }
  };

  const loadTipoReportes = async () => {
    setLoading(true);
    try {
      const data = await getTipoCategories();
      const tipoReportesWithCategory = await Promise.all(
        data.map(async (tipo) => {
          if (tipo.category_id) {
            const { data: category } = await supabase.from("categories").select("nombre").eq("id", tipo.category_id).single();
            return { ...tipo, category_nombre: category?.nombre || "Sin categoría" };
          }
          return { ...tipo, category_nombre: "Sin categoría" };
        })
      );
      
      // Filter by category if parameter is present
      const filteredData = categoryIdParam 
        ? tipoReportesWithCategory.filter(tipo => tipo.category_id === categoryIdParam)
        : tipoReportesWithCategory;
      
      setTipoReportes(filteredData);
      setFilteredTipoReportes(filteredData);
    } catch (error) {
      console.error("Error loading tipo reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tipoReporteId: string, currentStatus: boolean) => {
    try {
      await updateTipoCategory(tipoReporteId, { activo: !currentStatus });
      setTipoReportes(prevTipos => prevTipos.map(tipo => tipo.id === tipoReporteId ? { ...tipo, activo: !currentStatus } : tipo));
      setFilteredTipoReportes(prevTipos => prevTipos.map(tipo => tipo.id === tipoReporteId ? { ...tipo, activo: !currentStatus } : tipo));
    } catch (error) {
      console.error("Error toggling tipo reporte status:", error);
    }
  };

  const handleDeleteClick = async (tipoReporteId: string, options?: { silent?: boolean }) => {
    if (options?.silent) {
      // Eliminación silenciosa (usada en bulk delete)
      try {
        await deleteTipoCategory(tipoReporteId, { silent: true });
        await loadTipoReportes();
      } catch (error) {
        console.error("Error deleting tipo reporte:", error);
        throw error;
      }
    } else {
      // Eliminación individual con confirmación
      setTipoReporteToDelete(tipoReporteId);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tipoReporteToDelete) return;
    setDeleting(true);
    try {
      await deleteTipoCategory(tipoReporteToDelete);
      await loadTipoReportes();
      setDeleteDialogOpen(false);
      setTipoReporteToDelete(null);
    } catch (error) {
      console.error("Error deleting tipo reporte:", error);
    } finally {
      setDeleting(false);
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTipoReportes.slice(startIndex, startIndex + pageSize);
  }, [filteredTipoReportes, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTipoReportes.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [filteredTipoReportes.length]);

  const columns: DataTableColumn[] = [
    { key: "nombre", label: "Nombre", type: "text", searchable: true, sortable: true },
    { key: "descripcion", label: "Descripción", type: "text", searchable: true, sortable: false },
    { key: "category_nombre", label: "Categoría", type: "text", searchable: true, sortable: true },
    { key: "icono", label: "Icono", type: "text", searchable: false, sortable: false },
    { key: "color", label: "Color", type: "text", searchable: false, sortable: false },
    { key: "created_at", label: "Fecha de Creación", type: "date", searchable: false, sortable: true },
  ];

  const handleCreateTipoReporte = async () => {
    try {
      const categories = await getCategories();
      if (categories.length === 0) {
        setShowNoCategoriesDialog(true);
      } else {
        navigate("/tipos-reportes/crear");
      }
    } catch (error) {
      console.error("Error checking categories:", error);
    }
  };

  const handleCreateCategory = () => {
    setShowNoCategoriesDialog(false);
    navigate("/categorias/crear?from=tipos-reportes");
  };

  const handleCancelCreateCategory = () => {
    setShowNoCategoriesDialog(false);
  };

  const handleClearFilter = () => {
    setSearchParams({});
    setFilterCategory(null);
  };

  return (
    <Layout title="Tipos de Reportes" icon={FileType}>
      <div className="w-full space-y-6 overflow-x-auto">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileType className="h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Tipos de Reportes</h1>
            </div>
            <p className="text-muted-foreground">Administra los tipos de reportes del sistema</p>
            {filterCategory && (
              <div className="mt-3">
                <Badge variant="secondary" className="gap-2">
                  Filtrando por: {filterCategory.nombre}
                  <button onClick={handleClearFilter} className="ml-1 hover:bg-muted rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto"><Upload className="h-4 w-4 mr-2" />Carga Masiva</Button>
            {hasPermission("crear_estado") && (
              <Button className="w-full sm:w-auto" onClick={handleCreateTipoReporte}><Plus className="h-4 w-4 mr-2" />Crear Tipo de Reporte</Button>
            )}
          </div>
        </div>

        <DataTableToolbar data={tipoReportes} columns={columns} sensitiveProperties={["activo"]} filters={filters} onFiltersChange={setFilters} onDataFilter={setFilteredTipoReportes} searchPlaceholder="Buscar tipos de reportes..." exportFileName="tipos-reportes" />
        <TipoReportesTable tipoReportes={paginatedData} loading={loading} onToggleStatus={handleToggleStatus} onDelete={handleDeleteClick} />
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} title="¿Eliminar tipo de reporte?" description="Esta acción no se puede deshacer." confirmText="Eliminar" cancelText="Cancelar" variant="destructive" loading={deleting} />
        <DataTablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filteredTipoReportes.length} onPageChange={setCurrentPage} onPageSizeChange={(newSize) => { setPageSize(newSize); if (currentPage > Math.ceil(filteredTipoReportes.length / newSize)) setCurrentPage(Math.ceil(filteredTipoReportes.length / newSize) || 1); }} pageSizeOptions={[5, 10, 20, 50, 100]} />

        {/* Dialog para crear categoría */}
        <AlertDialog open={showNoCategoriesDialog} onOpenChange={setShowNoCategoriesDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>No hay categorías disponibles</AlertDialogTitle>
              <AlertDialogDescription>
                Para crear un tipo de reporte, primero debes crear al menos una categoría. ¿Deseas crear una categoría ahora?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelCreateCategory}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateCategory}>
                Crear Categoría
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TiposReportes;
