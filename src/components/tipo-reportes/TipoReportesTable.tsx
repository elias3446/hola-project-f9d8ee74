import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, FileType, ToggleLeft, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActions, BulkAction } from "@/components/ui/bulk-actions";
import { BulkActionDialog, BulkActionItem } from "@/components/ui/bulk-action-dialog";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TipoCategory } from "@/hooks/useTipoCategoryManagement";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

interface TipoReportesTableProps {
  tipoReportes: (TipoCategory & { category_nombre?: string })[];
  loading: boolean;
  onToggleStatus?: (tipoReporteId: string, currentStatus: boolean) => void;
  onDelete?: (tipoReporteId: string, options?: { silent?: boolean }) => void;
}

export const TipoReportesTable = ({ 
  tipoReportes, 
  loading, 
  onToggleStatus, 
  onDelete 
}: TipoReportesTableProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();
  const [selectedTipoReportes, setSelectedTipoReportes] = useState<string[]>([]);
  const [updatingTipoReporteId, setUpdatingTipoReporteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getNavigateUrl = (path: string) => {
    const category = searchParams.get("category");
    return category ? `${path}?category=${category}` : path;
  };

  const toggleTipoReporteSelection = (tipoReporteId: string) => {
    setSelectedTipoReportes((prev) =>
      prev.includes(tipoReporteId)
        ? prev.filter((id) => id !== tipoReporteId)
        : [...prev, tipoReporteId]
    );
  };

  const removeTipoReporteFromSelection = (tipoReporteId: string) => {
    setSelectedTipoReportes((prev) => prev.filter((id) => id !== tipoReporteId));
  };

  const toggleAllTipoReportes = () => {
    if (selectedTipoReportes.length === tipoReportes.length) {
      setSelectedTipoReportes([]);
    } else {
      setSelectedTipoReportes(tipoReportes.map((t) => t.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const count = selectedTipoReportes.length;
    try {
      for (const tipoReporteId of selectedTipoReportes) {
        await onDelete?.(tipoReporteId, { silent: true });
      }
      setSelectedTipoReportes([]);
      setShowDeleteDialog(false);
      toast({
        title: "Tipos de reportes eliminados",
        description: `Se ${count === 1 ? 'eliminó' : 'eliminaron'} ${count} tipo${count > 1 ? 's' : ''} de reporte${count > 1 ? 's' : ''} exitosamente`,
      });
    } catch (error) {
      console.error("Error al eliminar tipos de reportes:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los tipos de reportes",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0) return;
    
    setIsUpdatingStatus(true);
    try {
      const shouldActivate = selectedOptions.includes("activar");
      const shouldDeactivate = selectedOptions.includes("desactivar");

      for (const tipoReporteId of selectedTipoReportes) {
        const tipoReporte = tipoReportes.find(t => t.id === tipoReporteId);
        if (tipoReporte) {
          if ((shouldActivate && !tipoReporte.activo) || (shouldDeactivate && tipoReporte.activo)) {
            await onToggleStatus?.(tipoReporteId, tipoReporte.activo);
          }
        }
      }
      setSelectedTipoReportes([]);
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error al cambiar estado de tipos de reportes:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getSelectedItems = (): BulkActionItem[] => {
    return selectedTipoReportes.map(id => {
      const tipoReporte = tipoReportes.find(t => t.id === id);
      return {
        id,
        label: tipoReporte?.nombre || "",
        description: tipoReporte?.descripcion,
        icon: tipoReporte?.icono,
        color: tipoReporte?.color,
        status: tipoReporte?.activo ? "Activo" : "Inactivo",
      };
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Cambiar Estado",
      icon: <ToggleLeft className="h-4 w-4" />,
      variant: "outline",
      onClick: () => {
        setShowStatusDialog(true);
      },
    },
    {
      label: "Eliminar",
      icon: <Trash className="h-4 w-4" />,
      variant: "destructive",
      onClick: () => {
        setShowDeleteDialog(true);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <BulkActions
        selectedCount={selectedTipoReportes.length}
        onClear={() => setSelectedTipoReportes([])}
        actions={bulkActions}
      />
      <div className="w-full max-w-full border rounded-lg">
      <div className="w-full max-w-full overflow-x-auto">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedTipoReportes.length === tipoReportes.length && tipoReportes.length > 0
                    }
                    onCheckedChange={toggleAllTipoReportes}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Nombre</TableHead>
                <TableHead className="min-w-[250px]">Descripción</TableHead>
                <TableHead className="min-w-[150px]">Categoría</TableHead>
                <TableHead className="min-w-[100px]">Icono</TableHead>
                <TableHead className="min-w-[100px]">Color</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="min-w-[150px]">Fecha de Creación</TableHead>
                <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Cargando tipos de reportes...
                  </TableCell>
                </TableRow>
              ) : tipoReportes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron tipos de reportes
                  </TableCell>
                </TableRow>
              ) : (
                tipoReportes.map((tipoReporte) => (
                  <TableRow key={tipoReporte.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTipoReportes.includes(tipoReporte.id)}
                        onCheckedChange={() => toggleTipoReporteSelection(tipoReporte.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(getNavigateUrl(`/tipos-reportes/${tipoReporte.id}`))}
                      >
                        {tipoReporte.icono && (
                          <div 
                            className="h-8 w-8 rounded flex items-center justify-center text-lg"
                            style={{ 
                              backgroundColor: tipoReporte.color ? `${tipoReporte.color}20` : undefined,
                              color: tipoReporte.color || undefined
                            }}
                          >
                            {tipoReporte.icono}
                          </div>
                        )}
                        <span className="font-medium text-primary hover:underline">
                          {tipoReporte.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tipoReporte.descripcion || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoReporte.category_nombre || "Sin categoría"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tipoReporte.icono ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileType className="h-3 w-3" />
                          {tipoReporte.icono}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {tipoReporte.color ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: tipoReporte.color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {tipoReporte.color}
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tipoReporte.activo}
                          disabled={updatingTipoReporteId === tipoReporte.id}
                          onCheckedChange={async () => {
                            setUpdatingTipoReporteId(tipoReporte.id);
                            await onToggleStatus?.(tipoReporte.id, tipoReporte.activo);
                            setUpdatingTipoReporteId(null);
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span className="text-sm">
                          {updatingTipoReporteId === tipoReporte.id 
                            ? "Actualizando..." 
                            : tipoReporte.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tipoReporte.created_at
                        ? format(new Date(tipoReporte.created_at), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasPermission("editar_estado") && (
                            <DropdownMenuItem 
                              onClick={() => navigate(getNavigateUrl(`/tipos-reportes/editar/${tipoReporte.id}`))}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {hasPermission("eliminar_estado") && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDelete?.(tipoReporte.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    {/* Delete Dialog */}
    <BulkActionDialog
      open={showDeleteDialog}
      onOpenChange={setShowDeleteDialog}
      onConfirm={handleBulkDelete}
      title={`Eliminar ${selectedTipoReportes.length} tipo${selectedTipoReportes.length > 1 ? 's' : ''} de reporte${selectedTipoReportes.length > 1 ? 's' : ''}`}
      description={`Esta acción eliminará permanentemente ${selectedTipoReportes.length} tipo${selectedTipoReportes.length > 1 ? 's' : ''} de reporte${selectedTipoReportes.length > 1 ? 's' : ''} seleccionado${selectedTipoReportes.length > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
      icon={Trash}
      items={getSelectedItems()}
      itemsLabel={`Tipo${selectedTipoReportes.length > 1 ? 's' : ''} de reporte${selectedTipoReportes.length > 1 ? 's' : ''} que se eliminarán`}
      warning={{
        title: "¡Advertencia!",
        description: `Esta acción no se puede deshacer. ${selectedTipoReportes.length > 1 ? 'Los tipos de reportes eliminados' : 'El tipo de reporte eliminado'} no se ${selectedTipoReportes.length > 1 ? 'podrán' : 'podrá'} recuperar.`,
      }}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      loading={isDeleting}
      onRemoveItem={removeTipoReporteFromSelection}
    />

    {/* Status Change Dialog */}
    <BulkActionDialog
      open={showStatusDialog}
      onOpenChange={setShowStatusDialog}
      onConfirm={handleBulkStatusChange}
      title="Cambiar estado activo/inactivo"
      description={`Cambiar el estado activo/inactivo de ${selectedTipoReportes.length} tipo${selectedTipoReportes.length > 1 ? 's' : ''} de reporte${selectedTipoReportes.length > 1 ? 's' : ''}.`}
      icon={ToggleLeft}
      items={getSelectedItems()}
      itemsLabel="Tipos de reportes afectados"
      options={[
        {
          id: "activar",
          label: "Activar",
          icon: <ToggleLeft className="h-4 w-4" />,
          color: "hsl(var(--success))",
        },
        {
          id: "desactivar",
          label: "Desactivar",
          icon: <ToggleLeft className="h-4 w-4" />,
          color: "hsl(var(--warning))",
        },
      ]}
      confirmText="Cambiar Estado"
      cancelText="Cancelar"
      variant="default"
      loading={isUpdatingStatus}
      onRemoveItem={removeTipoReporteFromSelection}
    />
    </div>
  );
};
