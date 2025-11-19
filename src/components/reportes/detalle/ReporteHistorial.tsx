import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface ReporteHistorialProps {
  reportId: string;
}

export const ReporteHistorial = ({ reportId }: ReporteHistorialProps) => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadHistorial();
  }, [reportId]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reporte_historial")
        .select(`
          *,
          assigned_by_profile:profiles!reporte_historial_assigned_by_fkey(name, email),
          assigned_from_profile:profiles!reporte_historial_assigned_from_fkey(name, email),
          assigned_to_profile:profiles!reporte_historial_assigned_to_fkey(name, email)
        `)
        .eq("reporte_id", reportId)
        .order("fecha_asignacion", { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
      setCurrentPage(1); // Reset to first page when data loads
    } catch (error) {
      console.error("Error loading historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return historial.slice(startIndex, endIndex);
  }, [historial, currentPage, pageSize]);

  const totalPages = Math.ceil(historial.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    const newTotalPages = Math.ceil(historial.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Asignaciones ({historial.length})
        </CardTitle>
        <CardDescription>
          Registro de cambios de asignación del reporte
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cargando historial...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hay historial de asignaciones</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedData.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {item.assigned_from_profile && item.assigned_to_profile ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {item.assigned_from_profile.name}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="default">
                          {item.assigned_to_profile.name}
                        </Badge>
                      </div>
                    ) : item.assigned_to_profile ? (
                      <Badge variant="default">
                        Asignado a: {item.assigned_to_profile.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Sin asignación</Badge>
                    )}

                    {item.comentario && (
                      <p className="text-sm text-muted-foreground">{item.comentario}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.assigned_by_profile && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Por: {item.assigned_by_profile.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(item.fecha_asignacion), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 max-w-full overflow-x-auto">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={historial.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
