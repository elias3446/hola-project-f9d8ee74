import { Layout } from "@/components/Layout";
import { Tag, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { 
  DataTableToolbar, 
  DataTableColumn, 
  DataTableFilters 
} from "@/components/ui/data-table-toolbar";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePermissions } from "@/hooks/usePermissions";

const Categorias = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { getCategories, updateCategory, deleteCategory } = useCategoryManagement();
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<DataTableFilters>({
    search: "",
    sortBy: "nombre",
    sortOrder: "asc",
    columnFilters: {},
    propertyFilters: {},
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();

    // Setup realtime subscription for categories table
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await updateCategory(categoryId, { activo: !currentStatus });
      
      // Actualizar solo la categoría específica en el estado local
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId ? { ...cat, activo: !currentStatus } : cat
        )
      );
      setFilteredCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId ? { ...cat, activo: !currentStatus } : cat
        )
      );
    } catch (error) {
      console.error("Error toggling category status:", error);
    }
  };

  const handleDeleteClick = async (categoryId: string, options?: { silent?: boolean }) => {
    if (options?.silent) {
      // Eliminación silenciosa (usada en bulk delete)
      try {
        await deleteCategory(categoryId, { silent: true });
        await loadCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    } else {
      // Eliminación individual con confirmación
      setCategoryToDelete(categoryId);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    
    setDeleting(true);
    try {
      await deleteCategory(categoryToDelete);
      await loadCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Paginación: calcular categorías de la página actual
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage, pageSize]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredCategories.length / pageSize);

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    const newTotalPages = Math.ceil(filteredCategories.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCategories.length]);

  const columns: DataTableColumn[] = [
    { key: "nombre", label: "Nombre", type: "text", searchable: true, sortable: true },
    { key: "descripcion", label: "Descripción", type: "text", searchable: true, sortable: false },
    { key: "icono", label: "Icono", type: "text", searchable: false, sortable: false },
    { key: "color", label: "Color", type: "text", searchable: false, sortable: false },
    { key: "created_at", label: "Fecha de Creación", type: "date", searchable: false, sortable: true },
  ];

  return (
    <Layout title="Categorías" icon={Tag}>
      <div className="w-full space-y-6 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Categorías</h1>
            </div>
            <p className="text-muted-foreground">
              Administra las categorías del sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Carga Masiva
            </Button>
            {hasPermission("crear_categoria") && (
              <Button 
                className="w-full sm:w-auto"
                onClick={() => navigate("/categorias/crear")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Categoría
              </Button>
            )}
          </div>
        </div>

        {/* Data Table Toolbar */}
        <DataTableToolbar
          data={categories}
          columns={columns}
          sensitiveProperties={["activo"]}
          filters={filters}
          onFiltersChange={setFilters}
          onDataFilter={setFilteredCategories}
          searchPlaceholder="Buscar categorías por nombre, descripción..."
          exportFileName="categorias"
        />

        {/* Categories Table Component */}
        <CategoriesTable 
          categories={paginatedData} 
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar categoría?"
          description="Esta acción eliminará permanentemente la categoría y todos sus tipos relacionados. Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          loading={deleting}
        />

        {/* Pagination Component */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredCategories.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </Layout>
  );
};

export default Categorias;
