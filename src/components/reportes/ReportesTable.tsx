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
import { MoreVertical, Edit, Trash2, MapPin, ToggleLeft, Trash, FileCheck, UserCheck, Tag, FileType } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActions, BulkAction } from "@/components/ui/bulk-actions";
import { BulkActionDialog, BulkActionItem } from "@/components/ui/bulk-action-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Report } from "@/hooks/useReportManagement";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

interface ReportesTableProps {
  reports: Report[];
  loading: boolean;
  onToggleStatus?: (reportId: string, currentStatus: boolean) => void;
  onDelete?: (reportId: string, options?: { silent?: boolean }) => void;
  onBulkUpdate?: (reportIds: string[], updates: any) => Promise<void>;
}

export const ReportesTable = ({ 
  reports, 
  loading, 
  onToggleStatus, 
  onDelete,
  onBulkUpdate 
}: ReportesTableProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActiveStatusDialog, setShowActiveStatusDialog] = useState(false);
  const [showReportStatusDialog, setShowReportStatusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const removeReportFromSelection = (reportId: string) => {
    setSelectedReports((prev) => prev.filter((id) => id !== reportId));
  };

  const toggleAllReports = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
  };

  // Load data for bulk actions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users
        const { data: usersData } = await supabase
          .from("profiles")
          .select("id, name, email")
          .order("name");
        setUsers(usersData || []);

        // Load categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, nombre, icono, color")
          .eq("activo", true)
          .order("nombre");
        setCategories(categoriesData || []);

        // Load types
        const { data: typesData } = await supabase
          .from("tipo_categories")
          .select("id, nombre, icono, color")
          .eq("activo", true)
          .order("nombre");
        setTypes(typesData || []);
      } catch (error) {
        console.error("Error loading bulk action data:", error);
      }
    };

    loadData();
  }, []);

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    const count = selectedReports.length;
    try {
      for (const reportId of selectedReports) {
        await onDelete?.(reportId, { silent: true });
      }
      setSelectedReports([]);
      setShowDeleteDialog(false);
      toast({
        title: "Reportes eliminados",
        description: `Se ${count === 1 ? 'eliminó' : 'eliminaron'} ${count} reporte${count > 1 ? 's' : ''} exitosamente`,
      });
    } catch (error) {
      console.error("Error al eliminar reportes:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los reportes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkActiveStatusChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0) return;
    
    setIsProcessing(true);
    try {
      const shouldActivate = selectedOptions.includes("activar");
      const shouldDeactivate = selectedOptions.includes("desactivar");

      for (const reportId of selectedReports) {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          if ((shouldActivate && !report.activo) || (shouldDeactivate && report.activo)) {
            await onToggleStatus?.(reportId, report.activo);
          }
        }
      }
      setSelectedReports([]);
      setShowActiveStatusDialog(false);
    } catch (error) {
      console.error("Error al cambiar estado activo:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReportStatusChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      const status = selectedOptions[0];
      await onBulkUpdate(selectedReports, { status });
      setSelectedReports([]);
      setShowReportStatusDialog(false);
    } catch (error) {
      console.error("Error al cambiar estado de reporte:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAssign = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      const userId = selectedOptions[0] === "unassign" ? null : selectedOptions[0];
      await onBulkUpdate(selectedReports, { assigned_to: userId });
      setSelectedReports([]);
      setShowAssignDialog(false);
    } catch (error) {
      console.error("Error al asignar reportes:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategoryChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      const categoryId = selectedOptions[0] === "none" ? null : selectedOptions[0];
      await onBulkUpdate(selectedReports, { categoria_id: categoryId });
      setSelectedReports([]);
      setShowCategoryDialog(false);
    } catch (error) {
      console.error("Error al cambiar categoría:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTypeChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      const typeId = selectedOptions[0] === "none" ? null : selectedOptions[0];
      await onBulkUpdate(selectedReports, { tipo_reporte_id: typeId });
      setSelectedReports([]);
      setShowTypeDialog(false);
    } catch (error) {
      console.error("Error al cambiar tipo:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedItems = (): BulkActionItem[] => {
    return selectedReports.map(id => {
      const report = reports.find(r => r.id === id);
      return {
        id,
        label: report?.nombre || "",
        description: report?.descripcion,
        status: report?.activo ? "Activo" : "Inactivo",
      };
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Cambiar Estado",
      icon: <ToggleLeft className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowActiveStatusDialog(true),
    },
    {
      label: "Estado Reporte",
      icon: <FileCheck className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowReportStatusDialog(true),
    },
    {
      label: "Asignar",
      icon: <UserCheck className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowAssignDialog(true),
    },
    {
      label: "Categoría",
      icon: <Tag className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowCategoryDialog(true),
    },
    {
      label: "Tipo",
      icon: <FileType className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowTypeDialog(true),
    },
    {
      label: "Eliminar",
      icon: <Trash className="h-4 w-4" />,
      variant: "destructive",
      onClick: () => setShowDeleteDialog(true),
    },
  ];

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

  return (
    <div className="space-y-4">
      <BulkActions
        selectedCount={selectedReports.length}
        onClear={() => setSelectedReports([])}
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
                      selectedReports.length === reports.length && reports.length > 0
                    }
                    onCheckedChange={toggleAllReports}
                  />
                </TableHead>
                <TableHead className="min-w-[250px]">Título</TableHead>
                <TableHead className="min-w-[300px]">Descripción</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="min-w-[120px]">Prioridad</TableHead>
                <TableHead className="min-w-[150px]">Categoría</TableHead>
                <TableHead className="min-w-[150px]">Tipo</TableHead>
                <TableHead className="min-w-[150px]">Reportado por</TableHead>
                <TableHead className="min-w-[150px]">Asignado a</TableHead>
                <TableHead className="min-w-[120px]">Distancia</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="min-w-[150px]">Fecha de Creación</TableHead>
                <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8">
                    Cargando reportes...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron reportes
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={() => toggleReportSelection(report.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(`/reportes/${report.id}`)}
                      >
                        {report.location && (
                          <MapPin className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium text-primary hover:underline">
                          {report.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.descripcion ? (
                        report.descripcion.length > 100 
                          ? `${report.descripcion.substring(0, 100)}...` 
                          : report.descripcion
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(report.priority)}>
                        {getPriorityLabel(report.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.categories?.nombre || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.tipo_categories?.nombre || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.profiles?.name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.assigned_profiles?.name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.distancia_metros !== null && report.distancia_metros !== undefined
                        ? `${(report.distancia_metros / 1000).toFixed(2)} km`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={report.activo}
                          disabled={updatingReportId === report.id}
                          onCheckedChange={async () => {
                            setUpdatingReportId(report.id);
                            await onToggleStatus?.(report.id, report.activo);
                            setUpdatingReportId(null);
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span className="text-sm">
                          {updatingReportId === report.id 
                            ? "Actualizando..." 
                            : report.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.created_at
                        ? format(new Date(report.created_at), "dd/MM/yyyy")
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
                          {hasPermission("editar_reporte") && (
                            <DropdownMenuItem 
                              onClick={() => navigate(`/reportes/editar/${report.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {hasPermission("eliminar_reporte") && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDelete?.(report.id)}
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
      title={`Eliminar ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''}`}
      description={`Esta acción eliminará permanentemente ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''} seleccionado${selectedReports.length > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
      icon={Trash}
      items={getSelectedItems()}
      itemsLabel={`Reporte${selectedReports.length > 1 ? 's' : ''} que se eliminarán`}
      warning={{
        title: "¡Advertencia!",
        description: `Esta acción no se puede deshacer. ${selectedReports.length > 1 ? 'Los reportes eliminados' : 'El reporte eliminado'} no se ${selectedReports.length > 1 ? 'podrán' : 'podrá'} recuperar.`,
      }}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />

    {/* Active Status Dialog */}
    <BulkActionDialog
      open={showActiveStatusDialog}
      onOpenChange={setShowActiveStatusDialog}
      onConfirm={handleBulkActiveStatusChange}
      title="Cambiar estado activo/inactivo"
      description={`Cambiar el estado activo/inactivo de ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''}.`}
      icon={ToggleLeft}
      items={getSelectedItems()}
      itemsLabel="Reportes afectados"
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
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />

    {/* Report Status Dialog */}
    <BulkActionDialog
      open={showReportStatusDialog}
      onOpenChange={setShowReportStatusDialog}
      onConfirm={handleBulkReportStatusChange}
      title="Cambiar estado del reporte"
      description={`Cambiar el estado de ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''}.`}
      icon={FileCheck}
      items={getSelectedItems()}
      itemsLabel="Reportes afectados"
      multiSelect={false}
      options={[
        {
          id: "pendiente",
          label: "Pendiente",
          icon: <FileCheck className="h-4 w-4" />,
          color: "hsl(var(--destructive))",
        },
        {
          id: "en_progreso",
          label: "En Progreso",
          icon: <FileCheck className="h-4 w-4" />,
          color: "hsl(var(--primary))",
        },
        {
          id: "resuelto",
          label: "Resuelto",
          icon: <FileCheck className="h-4 w-4" />,
          color: "hsl(var(--success))",
        },
        {
          id: "cerrado",
          label: "Cerrado",
          icon: <FileCheck className="h-4 w-4" />,
          color: "hsl(var(--muted))",
        },
      ]}
      confirmText="Cambiar Estado"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />

    {/* Assign Dialog */}
    <BulkActionDialog
      open={showAssignDialog}
      onOpenChange={setShowAssignDialog}
      onConfirm={handleBulkAssign}
      title="Asignar reportes"
      description={`Asignar ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''} a un usuario.`}
      icon={UserCheck}
      items={getSelectedItems()}
      itemsLabel="Reportes afectados"
      multiSelect={false}
      options={[
        {
          id: "unassign",
          label: "Sin asignar",
          icon: <UserCheck className="h-4 w-4" />,
          color: "hsl(var(--muted))",
        },
        ...users.map(user => ({
          id: user.id,
          label: user.name || user.email,
          icon: <UserCheck className="h-4 w-4" />,
        })),
      ]}
      confirmText="Asignar"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />

    {/* Category Dialog */}
    <BulkActionDialog
      open={showCategoryDialog}
      onOpenChange={setShowCategoryDialog}
      onConfirm={handleBulkCategoryChange}
      title="Asignar categoría"
      description={`Asignar categoría a ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''}.`}
      icon={Tag}
      items={getSelectedItems()}
      itemsLabel="Reportes afectados"
      multiSelect={false}
      options={[
        {
          id: "none",
          label: "Sin categoría",
          icon: <Tag className="h-4 w-4" />,
          color: "hsl(var(--muted))",
        },
        ...categories.map(cat => ({
          id: cat.id,
          label: cat.nombre,
          icon: cat.icono,
          color: cat.color,
        })),
      ]}
      confirmText="Asignar Categoría"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />

    {/* Type Dialog */}
    <BulkActionDialog
      open={showTypeDialog}
      onOpenChange={setShowTypeDialog}
      onConfirm={handleBulkTypeChange}
      title="Asignar tipo de reporte"
      description={`Asignar tipo a ${selectedReports.length} reporte${selectedReports.length > 1 ? 's' : ''}.`}
      icon={FileType}
      items={getSelectedItems()}
      itemsLabel="Reportes afectados"
      multiSelect={false}
      options={[
        {
          id: "none",
          label: "Sin tipo",
          icon: <FileType className="h-4 w-4" />,
          color: "hsl(var(--muted))",
        },
        ...types.map(type => ({
          id: type.id,
          label: type.nombre,
          icon: type.icono,
          color: type.color,
        })),
      ]}
      confirmText="Asignar Tipo"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeReportFromSelection}
    />
    </div>
  );
};
