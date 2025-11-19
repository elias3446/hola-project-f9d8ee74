import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { FileType, Tag, Calendar, User } from "lucide-react";

interface TipoReporteSidebarProps {
  tipoReporte: any;
  onToggleStatus: () => void;
  updatingStatus: boolean;
}

export const TipoReporteSidebar = ({ 
  tipoReporte, 
  onToggleStatus, 
  updatingStatus 
}: TipoReporteSidebarProps) => {
  return (
    <Card className="p-6 space-y-6">
      {/* Header con icono */}
      <div className="flex items-start gap-4">
        {tipoReporte.icono && (
          <div 
            className="h-16 w-16 rounded-lg flex items-center justify-center text-3xl shrink-0"
            style={{ 
              backgroundColor: tipoReporte.color ? `${tipoReporte.color}20` : undefined,
              color: tipoReporte.color || undefined
            }}
          >
            {tipoReporte.icono}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold break-words">{tipoReporte.nombre}</h2>
          {tipoReporte.descripcion && (
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {tipoReporte.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={tipoReporte.activo}
              disabled={updatingStatus}
              onCheckedChange={onToggleStatus}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm">
              {updatingStatus ? "Actualizando..." : tipoReporte.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        {/* Categoría */}
        {tipoReporte.category && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              Categoría
            </div>
            <Badge variant="outline" className="gap-2">
              {tipoReporte.category.icono && (
                <span>{tipoReporte.category.icono}</span>
              )}
              {tipoReporte.category.nombre}
            </Badge>
          </div>
        )}

        {/* Color */}
        {tipoReporte.color && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileType className="h-4 w-4" />
              Color
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="h-6 w-6 rounded border"
                style={{ backgroundColor: tipoReporte.color }}
              />
              <span className="text-sm">{tipoReporte.color}</span>
            </div>
          </div>
        )}

        {/* Fecha de creación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Fecha de Creación
          </div>
          <p className="text-sm">
            {format(new Date(tipoReporte.created_at), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Última actualización */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Última Actualización
          </div>
          <p className="text-sm">
            {format(new Date(tipoReporte.updated_at), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </div>
    </Card>
  );
};
