import { Layout } from "@/components/Layout";
import { FileText, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useReportManagement } from "@/hooks/useReportManagement";
import { ReportesTable } from "@/components/reportes/ReportesTable";
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
import { toast } from "sonner";

const Reportes = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { getReports, updateReport, deleteReport } = useReportManagement();
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<DataTableFilters>({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
    columnFilters: {},
    propertyFilters: {},
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load reports immediately on mount
  useEffect(() => {
    loadReports();
  }, []);

  // Try to get user location in parallel
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          // Reload reports with distance calculation
          loadReportsWithLocation(location);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          // Continue without location - reports already loaded
        }
      );
    }
  }, []);

  useEffect(() => {
    // Setup realtime subscription for reportes table
    const channel = supabase
      .channel('reportes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reportes'
        },
        async () => {
          // Reload reports when any change occurs
          try {
            const data = userLocation 
              ? await getReports(userLocation.lat, userLocation.lng)
              : await getReports();
            setReports(data);
            setFilteredReports(data);
          } catch (error) {
            console.error("Error reloading reports from realtime:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLocation]);

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

  const loadReportsWithLocation = async (location: { lat: number; lng: number }) => {
    try {
      const data = await getReports(location.lat, location.lng);
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error("Error loading reports with location:", error);
    }
  };

  const handleToggleStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      // When deactivating, set status to "resuelto"
      // When activating, set status to "pendiente"
      const newStatus = !currentStatus;
      const newReportStatus = newStatus ? "pendiente" : "resuelto";
      
      // Optimistically update the UI immediately
      const updateReportInList = (reportsList: any[]) => 
        reportsList.map(rep => 
          rep.id === reportId 
            ? { ...rep, activo: newStatus, status: newReportStatus } 
            : rep
        );
      
      setReports(prev => updateReportInList(prev));
      setFilteredReports(prev => updateReportInList(prev));
      
      // Then update in the database
      await updateReport(reportId, { 
        activo: newStatus,
        status: newReportStatus
      });
    } catch (error) {
      console.error("Error toggling report status:", error);
      // Reload reports to get the correct state if the update failed
      loadReports();
    }
  };

  const handleDeleteClick = async (reportId: string, options?: { silent?: boolean }) => {
    if (options?.silent) {
      // Eliminación silenciosa (usada en bulk delete)
      try {
        await deleteReport(reportId, { silent: true });
        await loadReports();
      } catch (error) {
        console.error("Error deleting report:", error);
        throw error; // Re-throw para que el bulk delete lo maneje
      }
    } else {
      // Eliminación individual con confirmación
      setReportToDelete(reportId);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    
    setDeleting(true);
    try {
      await deleteReport(reportToDelete);
      await loadReports();
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      toast.success("El reporte se eliminó exitosamente");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("No se pudo eliminar el reporte");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkUpdate = async (reportIds: string[], updates: any) => {
    const count = reportIds.length;
    try {
      for (const reportId of reportIds) {
        await updateReport(reportId, updates, { silent: true });
      }
      await loadReports();
      toast.success(`Se ${count === 1 ? 'actualizó' : 'actualizaron'} ${count} reporte${count > 1 ? 's' : ''} exitosamente`);
    } catch (error) {
      console.error("Error updating reports:", error);
      toast.error("Error al actualizar reportes");
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredReports.slice(startIndex, endIndex);
  }, [filteredReports, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    const newTotalPages = Math.ceil(filteredReports.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReports.length]);

  const columns: DataTableColumn[] = [
    { key: "nombre", label: "Título", type: "text", searchable: true, sortable: true },
    { key: "descripcion", label: "Descripción", type: "text", searchable: true, sortable: false },
    { key: "status", label: "Estado", type: "text", searchable: false, sortable: true },
    { key: "priority", label: "Prioridad", type: "text", searchable: false, sortable: true },
    { key: "profiles.name", label: "Reportado por", type: "text", searchable: true, sortable: true },
    { key: "assigned_profiles.name", label: "Asignado a", type: "text", searchable: true, sortable: true },
    { key: "distancia_metros", label: "Distancia", type: "number", searchable: false, sortable: true },
    { key: "created_at", label: "Fecha de Creación", type: "date", searchable: false, sortable: true },
  ];

  return (
    <Layout title="Reportes" icon={FileText}>
      <div className="w-full space-y-6 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Reportes</h1>
            </div>
            <p className="text-muted-foreground">
              Administra los reportes del sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Carga Masiva
            </Button>
            {hasPermission("crear_reporte") && (
              <Button 
                className="w-full sm:w-auto"
                onClick={() => navigate("/reportes/crear")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Reporte
              </Button>
            )}
          </div>
        </div>

        {/* Data Table Toolbar */}
        <DataTableToolbar
          data={reports}
          columns={columns}
          sensitiveProperties={["activo", "status", "priority"]}
          filters={filters}
          onFiltersChange={setFilters}
          onDataFilter={setFilteredReports}
          searchPlaceholder="Buscar reportes por título, descripción..."
          exportFileName="reportes"
        />

        {/* Reportes Table Component */}
        <ReportesTable 
          reports={paginatedData} 
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
          onBulkUpdate={handleBulkUpdate}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar reporte?"
          description="Esta acción eliminará permanentemente el reporte. Esta acción no se puede deshacer."
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
          totalItems={filteredReports.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </Layout>
  );
};

export default Reportes;
