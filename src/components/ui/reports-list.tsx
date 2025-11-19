import { useMemo, useState } from "react";
import { FileText, ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface ReportsListProps {
  reportes: any[];
  loading: boolean;
  title: string;
  description: string;
  emptyMessage: string;
  showPagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export const ReportsList = ({ 
  reportes, 
  loading, 
  title,
  description,
  emptyMessage,
  showPagination = true,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50]
}: ReportsListProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const getPriorityVariant = (priority: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority?.toLowerCase()) {
      case 'urgente':
      case 'alto':
      case 'alta':
        return 'destructive';
      case 'medio':
      case 'media':
        return 'default';
      case 'bajo':
      case 'baja':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'resuelto':
        return 'default';
      case 'rechazado':
      case 'cancelado':
        return 'destructive';
      case 'en_progreso':
      case 'en_proceso':
        return 'default';
      case 'pendiente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'en_proceso': 'En Proceso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado',
      'cancelado': 'Cancelado',
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const formatPriority = (priority: string): string => {
    const priorityMap: Record<string, string> = {
      'urgente': 'Urgente',
      'alto': 'Alto',
      'alta': 'Alta',
      'medio': 'Medio',
      'media': 'Media',
      'bajo': 'Bajo',
      'baja': 'Baja',
    };
    return priorityMap[priority?.toLowerCase()] || priority;
  };

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!showPagination) return reportes;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return reportes.slice(startIndex, endIndex);
  }, [reportes, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(reportes.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    const newTotalPages = Math.ceil(reportes.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title} ({reportes.length})
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cargando reportes...</p>
          </div>
        ) : reportes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedData.map((reporte) => (
              <div 
                key={reporte.id} 
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator dot */}
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  </div>
                  
                  {/* Report content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Report title */}
                        <h4 className="font-semibold text-base mb-1">{reporte.nombre}</h4>
                        
                        {/* Report description */}
                        {reporte.descripcion && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {reporte.descripcion}
                          </p>
                        )}
                        
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {reporte.categories?.nombre && (
                            <Badge variant="outline" className="text-xs">
                              {reporte.categories.nombre}
                            </Badge>
                          )}
                          {reporte.status && (
                            <Badge variant={getStatusVariant(reporte.status)} className="text-xs">
                              {formatStatus(reporte.status)}
                            </Badge>
                          )}
                          {reporte.priority && (
                            <Badge variant={getPriorityVariant(reporte.priority)} className="text-xs">
                              {formatPriority(reporte.priority)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(reporte.created_at), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                      
                      {/* Ver button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/reportes/${reporte.id}`)}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {showPagination && reportes.length > 0 && (
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={reportes.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
