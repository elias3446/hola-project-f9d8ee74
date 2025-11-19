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
import { MoreVertical, Edit, Trash2, Tag, ToggleLeft, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Category } from "@/hooks/useCategoryManagement";
import { usePermissions } from "@/hooks/usePermissions";
import { BulkActions, BulkAction } from "@/components/ui/bulk-actions";
import { BulkActionDialog, BulkActionItem } from "@/components/ui/bulk-action-dialog";
import { toast } from "@/hooks/use-toast";

interface CategoriesTableProps {
  categories: Category[];
  loading: boolean;
  onToggleStatus?: (categoryId: string, currentStatus: boolean) => void;
  onDelete?: (categoryId: string, options?: { silent?: boolean }) => void;
}

export const CategoriesTable = ({ 
  categories, 
  loading, 
  onToggleStatus, 
  onDelete 
}: CategoriesTableProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const removeCategoryFromSelection = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const count = selectedCategories.length;
    try {
      for (const categoryId of selectedCategories) {
        await onDelete?.(categoryId, { silent: true });
      }
      setSelectedCategories([]);
      setShowDeleteDialog(false);
      toast({
        title: "Categorías eliminadas",
        description: `Se ${count === 1 ? 'eliminó' : 'eliminaron'} ${count} categoría${count > 1 ? 's' : ''} exitosamente`,
      });
    } catch (error) {
      console.error("Error al eliminar categorías:", error);
      toast({
        title: "Error",
        description: "Error al eliminar las categorías",
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

      for (const categoryId of selectedCategories) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          if ((shouldActivate && !category.activo) || (shouldDeactivate && category.activo)) {
            await onToggleStatus?.(categoryId, category.activo);
          }
        }
      }
      setSelectedCategories([]);
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error al cambiar estado de categorías:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getSelectedItems = (): BulkActionItem[] => {
    return selectedCategories.map(id => {
      const category = categories.find(c => c.id === id);
      return {
        id,
        label: category?.nombre || "",
        description: category?.descripcion,
        icon: category?.icono,
        color: category?.color,
        status: category?.activo ? "Activo" : "Inactivo",
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
        selectedCount={selectedCategories.length}
        onClear={() => setSelectedCategories([])}
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
                      selectedCategories.length === categories.length && categories.length > 0
                    }
                    onCheckedChange={toggleAllCategories}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Nombre</TableHead>
                <TableHead className="min-w-[250px]">Descripción</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando categorías...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron categorías
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategorySelection(category.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(`/categorias/${category.id}`)}
                      >
                        {category.icono && (
                          <div 
                            className="h-8 w-8 rounded flex items-center justify-center text-lg"
                            style={{ 
                              backgroundColor: category.color ? `${category.color}20` : undefined,
                              color: category.color || undefined
                            }}
                          >
                            {category.icono}
                          </div>
                        )}
                        <span className="font-medium text-primary hover:underline">
                          {category.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.descripcion || "-"}
                    </TableCell>
                    <TableCell>
                      {category.icono ? (
                        <Badge variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {category.icono}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {category.color ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {category.color}
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.activo}
                          disabled={updatingCategoryId === category.id}
                          onCheckedChange={async () => {
                            setUpdatingCategoryId(category.id);
                            await onToggleStatus?.(category.id, category.activo);
                            setUpdatingCategoryId(null);
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span className="text-sm">
                          {updatingCategoryId === category.id 
                            ? "Actualizando..." 
                            : category.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.created_at
                        ? format(new Date(category.created_at), "dd/MM/yyyy")
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
                          {hasPermission("editar_categoria") && (
                            <DropdownMenuItem 
                              onClick={() => navigate(`/categorias/editar/${category.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {hasPermission("eliminar_categoria") && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDelete?.(category.id)}
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
      title={`Eliminar ${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''}`}
      description={`Esta acción eliminará permanentemente ${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''} seleccionada${selectedCategories.length > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
      icon={Trash}
      items={getSelectedItems()}
      itemsLabel={`Categoría${selectedCategories.length > 1 ? 's' : ''} que se eliminarán`}
      warning={{
        title: "¡Advertencia!",
        description: `Esta acción no se puede deshacer. ${selectedCategories.length > 1 ? 'Las categorías eliminadas' : 'La categoría eliminada'} no se ${selectedCategories.length > 1 ? 'podrán' : 'podrá'} recuperar.`,
      }}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      loading={isDeleting}
      onRemoveItem={removeCategoryFromSelection}
    />

    {/* Status Change Dialog */}
    <BulkActionDialog
      open={showStatusDialog}
      onOpenChange={setShowStatusDialog}
      onConfirm={handleBulkStatusChange}
      title="Cambiar estado activo/inactivo"
      description={`Cambiar el estado activo/inactivo de ${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''}.`}
      icon={ToggleLeft}
      items={getSelectedItems()}
      itemsLabel="Categorías afectadas"
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
      onRemoveItem={removeCategoryFromSelection}
    />
    </div>
  );
};
