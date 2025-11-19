import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Clock, FileText, Info } from "lucide-react";
import { format } from "date-fns";

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

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export const AuditLogDetailsDialog = ({ 
  log, 
  open, 
  onOpenChange,
  userEmail 
}: AuditLogDetailsDialogProps) => {
  if (!log) return null;

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
    return <Badge variant={variant}>{label}</Badge>;
  };

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

  const hasValuesComparison = log.valores_anteriores || log.valores_nuevos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles del Cambio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Información General</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Operación:</p>
                  <div>{getActionBadge(log.action)}</div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuario:</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userEmail || 'Usuario'}</span>
                  </div>
                </div>

                {log.tabla_afectada && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tabla:</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{log.tabla_afectada}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha y Hora:</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(log.created_at), 'dd/MM/yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Descripción del Cambio:</p>
                  <p className="text-sm">{getActionDescription(log)}</p>
                </div>

                {log.metadata?.registro_actualizado_en && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Registro actualizado en:</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                      {log.metadata.registro_actualizado_en}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparación de Valores */}
          {hasValuesComparison && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comparación de Valores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estado Anterior */}
                <Card className="border-destructive/50">
                  <CardContent className="pt-4">
                    <div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-t-lg -mt-4 -mx-6 mb-3">
                      <p className="font-semibold text-sm">ESTADO ANTERIOR</p>
                    </div>
                    {log.valores_anteriores ? (
                      <pre className="text-xs overflow-x-auto bg-muted p-3 rounded">
                        {JSON.stringify(log.valores_anteriores, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-8">
                        Sin valores anteriores
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Estado Actual */}
                <Card className="border-green-500/50">
                  <CardContent className="pt-4">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-t-lg -mt-4 -mx-6 mb-3">
                      <p className="font-semibold text-sm">ESTADO ACTUAL</p>
                    </div>
                    {log.valores_nuevos ? (
                      <pre className="text-xs overflow-x-auto bg-muted p-3 rounded">
                        {JSON.stringify(log.valores_nuevos, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-8">
                        Sin valores nuevos
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Información Técnica */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Información Técnica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID del Registro:</p>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{log.id}</p>
                </div>

                {log.tabla_afectada && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nombre de la Tabla:</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{log.tabla_afectada}</p>
                  </div>
                )}

                {log.campos_modificados && log.campos_modificados.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Campos Modificados:</p>
                    <div className="flex flex-wrap gap-1">
                      {log.campos_modificados.map((campo, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {campo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
