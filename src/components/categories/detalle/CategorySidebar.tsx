import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, FolderOpen, Palette, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Category } from "@/hooks/useCategoryManagement";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CategorySidebarProps {
  category: Category;
  onToggleStatus: () => void;
  updatingStatus: boolean;
}

export const CategorySidebar = ({ 
  category, 
  onToggleStatus, 
  updatingStatus 
}: CategorySidebarProps) => {
  const navigate = useNavigate();

  const handleNavigateToTipos = () => {
    navigate(`/tipos-reportes?category=${category.id}`);
  };

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarFallback 
              className="text-3xl font-semibold"
              style={{ 
                backgroundColor: category.color ? `${category.color}20` : undefined,
                color: category.color || undefined
              }}
            >
              {category.icono || category.nombre.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">{category.nombre}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {category.descripcion || "Categoría por defecto para reportes sin clasificar"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FolderOpen className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Descripción</p>
              <p className="text-sm text-muted-foreground">
                {category.descripcion || "Categoría por defecto para reportes sin clasificar"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Creado</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(category.created_at), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Actualizado</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(category.updated_at), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-3"
            onClick={handleNavigateToTipos}
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Tipos de Reportes</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Apariencia</p>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <div 
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: category.color || '#6B7280' }}
            />
            <span className="text-sm text-muted-foreground">
              {category.color || '#6B7280'}
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-3">Estado de la Categoría</p>
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Badge variant={category.activo ? "default" : "secondary"}>
                {category.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <Switch
              checked={category.activo}
              onCheckedChange={onToggleStatus}
              disabled={updatingStatus}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
