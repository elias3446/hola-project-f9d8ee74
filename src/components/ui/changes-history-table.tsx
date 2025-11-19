import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, RefreshCw, Eye, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AuditLogDetailsDialog } from "@/components/ui/audit-log-details-dialog";

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

interface ChangesHistoryTableProps {
  logs: AuditLog[];
  loading: boolean;
  userEmail?: string;
}

export const ChangesHistoryTable = ({ logs, loading, userEmail }: ChangesHistoryTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Reset to first page when logs change
  useEffect(() => {
    setCurrentPage(1);
  }, [logs.length]);

  // Fetch user emails for all user_ids in logs
  useEffect(() => {
    const fetchUserEmails = async () => {
      const userIds = [...new Set(logs.map(log => log.user_id))];
      
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching user emails:', error);
        return;
      }

      const map: Record<string, string> = {};
      data?.forEach(profile => {
        map[profile.id] = profile.email || 'Usuario';
      });
      setUsersMap(map);
    };

    fetchUserEmails();
  }, [logs]);

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
    const config = {
      UPDATE: { label: 'UPDATE', variant: 'secondary' as const },
      SOFT_DELETE: { label: 'DELETE', variant: 'destructive' as const },
      CREATE: { label: 'INSERT', variant: 'default' as const },
      DELETE: { label: 'DELETE', variant: 'destructive' as const },
      LOGIN: { label: 'LOGIN', variant: 'default' as const },
      LOGOUT: { label: 'LOGOUT', variant: 'outline' as const }
    };

    const { label, variant } = config[action];
    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Historial de Cambios</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Acción</TableHead>
                  <TableHead className="min-w-[250px]">Descripción del Cambio</TableHead>
                  <TableHead className="min-w-[180px]">Campos Modificados</TableHead>
                  <TableHead className="min-w-[200px]">Realizado por</TableHead>
                  <TableHead className="min-w-[180px]">Fecha y Hora</TableHead>
                  <TableHead className="min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {getActionDescription(log)}
                      </TableCell>
                      <TableCell>
                        {log.campos_modificados && log.campos_modificados.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {log.campos_modificados.map((campo, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {campo}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin campos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{usersMap[log.user_id] || 'Cargando...'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm">{format(new Date(log.created_at), 'dd/MM/yyyy')}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedLog(log);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <AuditLogDetailsDialog
        log={selectedLog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userEmail={selectedLog ? usersMap[selectedLog.user_id] : undefined}
      />
    </Card>
  );
};
