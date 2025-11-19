import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'LOGIN' | 'LOGOUT';

interface AuditLog {
  id: string;
  action: OperationType;
  tabla_afectada: string | null;
  campos_modificados: string[] | null;
  valores_anteriores: any;
  valores_nuevos: any;
  metadata: any;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  user_id: string;
}

interface ActivitiesTableProps {
  logs: AuditLog[];
  loading: boolean;
}

export const ActivitiesTable = ({ logs, loading }: ActivitiesTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset to first page when logs change
  useEffect(() => {
    setCurrentPage(1);
  }, [logs.length]);

  const totalPages = Math.ceil(logs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const getActionDescription = (log: AuditLog): string => {
    const tabla = log.tabla_afectada || 'registro';
    switch (log.action) {
      case 'CREATE': return `Registro creado en ${tabla}`;
      case 'UPDATE': return `Registro modificado en ${tabla}`;
      case 'DELETE': return `Registro eliminado en ${tabla}`;
      case 'SOFT_DELETE': return `Registro eliminado en ${tabla}`;
      case 'LOGIN': return 'Inicio de sesión en el sistema';
      case 'LOGOUT': return 'Cierre de sesión del sistema';
      default: return log.action;
    }
  };

  const getActionBadge = (action: OperationType) => {
    const config: Record<OperationType, { label: string; variant: any; icon: any }> = {
      CREATE: { label: 'Crear', variant: 'default', icon: Shield },
      UPDATE: { label: 'Actualizar', variant: 'secondary', icon: Shield },
      DELETE: { label: 'Eliminar', variant: 'destructive', icon: Shield },
      SOFT_DELETE: { label: 'Eliminar', variant: 'destructive', icon: Shield },
      LOGIN: { label: 'Inicio de sesión', variant: 'default', icon: Activity },
      LOGOUT: { label: 'Cierre de sesión', variant: 'outline', icon: Activity }
    };

    const { label, variant, icon: Icon } = config[action];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Actividades Realizadas</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Tipo</TableHead>
                  <TableHead className="min-w-[300px]">Descripción</TableHead>
                  <TableHead className="min-w-[200px]">Fecha y Hora</TableHead>
                  <TableHead className="min-w-[120px]">Tabla</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="min-w-[180px]">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {getActionDescription(log)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(log.created_at), 'dd/MM/yyyy')}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.tabla_afectada || '-'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {startIndex + 1} a {Math.min(endIndex, logs.length)} de {logs.length} registros
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filas por página:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
