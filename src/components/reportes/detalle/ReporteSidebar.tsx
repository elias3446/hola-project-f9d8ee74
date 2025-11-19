import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  MapPin, 
  AlertCircle,
  CheckCircle2,
  Eye,
  UserCheck,
  icons
} from "lucide-react";
import { format } from "date-fns";
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface ReporteSidebarProps {
  report: any;
  onToggleStatus: () => void;
  updatingStatus: boolean;
  onToggleVisibility: () => void;
  updatingVisibility: boolean;
}

export const ReporteSidebar = ({ report, onToggleStatus, updatingStatus, onToggleVisibility, updatingVisibility }: ReporteSidebarProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pendiente": return "destructive";
      case "en_progreso": return "default";
      case "resuelto": return "default";
      case "cerrado": return "secondary";
      default: return "default";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "critico": return "destructive";
      case "alto": return "destructive";
      case "medio": return "default";
      case "bajo": return "secondary";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente";
      case "en_progreso": return "En Progreso";
      case "resuelto": return "Resuelto";
      case "cerrado": return "Cerrado";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critico": return "Crítico";
      case "alto": return "Alto";
      case "medio": return "Medio";
      case "bajo": return "Bajo";
      default: return priority;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    return visibility === "publico" ? "Hacer Privado" : "Hacer Público";
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return FileText;
    
    // Convertir el nombre del icono de lucide a kebab-case
    const kebabCase = iconName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
    // Verificar si existe en los imports dinámicos
    if (kebabCase in dynamicIconImports) {
      const IconComponent = icons[iconName as keyof typeof icons];
      return IconComponent || FileText;
    }
    
    return FileText;
  };

  const openGoogleMaps = () => {
    if (report.location?.latitude && report.location?.longitude) {
      window.open(
        `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`,
        '_blank'
      );
    }
  };

  const CategoryIcon = getCategoryIcon(report.categories?.icon);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Avatar con icono de categoría */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl bg-muted">
              <CategoryIcon className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-semibold">{report.nombre || "Sin título"}</p>
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {report.categories?.nombre || "Sin categoría"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Fechas */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Creado: {format(new Date(report.created_at), "dd/MM/yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Actualizado: {format(new Date(report.updated_at), "dd/MM/yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Creado por: {report.profiles?.name || "Desconocido"}</span>
          </div>
        </div>

        <Separator />

        {/* Prioridad */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Prioridad</span>
          </div>
          <Badge variant={getPriorityVariant(report.priority)} className="w-full justify-center">
            {getPriorityLabel(report.priority)}
          </Badge>
        </div>

        <Separator />

        {/* Estado del Reporte */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Estado del Reporte</span>
          </div>
          <p className="text-xs text-muted-foreground">Estado basado en el flujo de trabajo</p>
          <Badge variant={getStatusVariant(report.status)} className="w-full justify-center">
            {getStatusLabel(report.status)}
          </Badge>
          {report.status !== "resuelto" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onToggleStatus}
              disabled={updatingStatus}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Resuelto
            </Button>
          )}
        </div>

        <Separator />

        {/* Visibilidad Pública */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Visibilidad Pública</span>
          </div>
          <Badge 
            variant={report.visibility === "publico" ? "default" : "secondary"} 
            className="w-full justify-center"
          >
            {report.visibility === "publico" ? "Público" : "Privado"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onToggleVisibility}
            disabled={updatingVisibility}
          >
            <Eye className="h-4 w-4 mr-2" />
            {getVisibilityLabel(report.visibility)}
          </Button>
          <p className="text-xs text-muted-foreground">
            {report.visibility === "publico" 
              ? "Visible en reportes públicos" 
              : "Solo visible para usuarios autorizados"}
          </p>
        </div>

        <Separator />

        {/* Estado Asignado */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Estado Asignado</span>
          </div>
          <p className="text-xs text-muted-foreground">Estado específico desde la configuración</p>
          <Badge variant="secondary" className="w-full justify-center">
            {report.assigned_profiles ? "Asignado" : "Sin estado"}
          </Badge>
        </div>

        <Separator />

        {/* Asignación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Asignación</span>
          </div>
          <p className="text-sm">
            Asignado a: <span className="font-medium">
              {report.assigned_profiles?.name || "Sin asignar"}
            </span>
          </p>
        </div>

        <Separator />

        {/* Categoría */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Categoría</span>
          </div>
          <Badge variant="outline" className="w-full justify-center">
            {report.categories?.nombre || "Sin categoría"}
          </Badge>
        </div>

        <Separator />

        {/* Ubicación */}
        {report.location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Ubicación</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lat: {report.location.latitude?.toFixed(6)} - Lng: {report.location.longitude?.toFixed(6)}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={openGoogleMaps}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Ver en Google Maps
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
