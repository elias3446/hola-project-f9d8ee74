import { Layout } from "@/components/Layout";
import { FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const MisReportes = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
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
    if (profile?.id) {
      loadMyReports();
    }
  }, [profile?.id]);

  // Try to get user location in parallel
  useEffect(() => {
    if (!profile?.id) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          // Reload reports with distance calculation
          loadMyReportsWithLocation(location);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          // Continue without location - reports already loaded
        }
      );
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('my-reportes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reportes',
          filter: `user_id=eq.${profile.id}`
        },
        async () => {
          try {
            if (userLocation) {
              await loadMyReportsWithLocation(userLocation);
            } else {
              await loadMyReports();
            }
          } catch (error) {
            console.error("Error reloading my reports from realtime:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, userLocation]);

  const loadMyReports = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reportes")
        .select("*, categories(nombre), tipo_categories(nombre), profiles!reportes_user_id_fkey(name), assigned_profiles:profiles!reportes_assigned_to_fkey(name)")
        .eq("user_id", profile.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (error) {
      console.error("Error loading my reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReportsWithLocation = async (location: { lat: number; lng: number }) => {
    if (!profile?.id) return;

    try {
      // Use RPC function to get reports with distance
      const { data, error } = await supabase.rpc("get_reportes_with_distance", {
        user_lat: location.lat,
        user_lng: location.lng,
      });

      if (error) throw error;

      // Filter to only show reports created by this user
      const myReports = (data || []).filter((report: any) => report.user_id === profile.id);
      
      setReports(myReports);
      setFilteredReports(myReports);
    } catch (error) {
      console.error("Error loading my reports with location:", error);
    }
  };

  const handleToggleStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const newReportStatus = newStatus ? "pendiente" : "resuelto";
      
      const updateReportInList = (reportsList: any[]) => 
        reportsList.map(rep => 
          rep.id === reportId 
            ? { ...rep, activo: newStatus, status: newReportStatus } 
            : rep
        );
      
      setReports(prev => updateReportInList(prev));
      setFilteredReports(prev => updateReportInList(prev));
      
      await updateReport(reportId, { 
        activo: newStatus,
        status: newReportStatus
      });
    } catch (error) {
      console.error("Error toggling report status:", error);
      loadMyReports();
    }
  };

  const handleDeleteClick = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    
    setDeleting(true);
    try {
      await deleteReport(reportToDelete);
      await loadMyReports();
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    } catch (error) {
      console.error("Error deleting report:", error);
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pendientes: reports.filter(r => r.status === "pendiente").length,
      enProgreso: reports.filter(r => r.status === "en_progreso").length,
      resueltos: reports.filter(r => r.status === "resuelto").length,
      criticos: reports.filter(r => r.priority === "critico").length,
    };
  }, [reports]);

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
    { key: "assigned_profiles.name", label: "Asignado a", type: "text", searchable: true, sortable: true },
    { key: "created_at", label: "Fecha de Creación", type: "date", searchable: false, sortable: true },
  ];

  return (
    <Layout title="Mis Reportes" icon={FileText}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl md:text-3xl font-bold">Mis Reportes</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendientes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                En Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.enProgreso}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Resueltos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resueltos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.criticos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Toolbar */}
        <DataTableToolbar
          data={reports}
          columns={columns}
          sensitiveProperties={["activo", "status", "priority"]}
          filters={filters}
          onFiltersChange={setFilters}
          onDataFilter={setFilteredReports}
          searchPlaceholder="Buscar en mis reportes..."
          exportFileName="mis-reportes"
        />

        {/* Reportes Table Component */}
        <ReportesTable 
          reports={paginatedData} 
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
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

export default MisReportes;
