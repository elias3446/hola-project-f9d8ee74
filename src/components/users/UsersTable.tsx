import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Lock, Trash2, Edit, Users, ToggleLeft, Trash, UserCheck, Shield, Key } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActions, BulkAction } from "@/components/ui/bulk-actions";
import { BulkActionDialog, BulkActionItem } from "@/components/ui/bulk-action-dialog";
import { useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

interface UsersTableProps {
  users: any[];
  loading: boolean;
  onResendConfirmation?: (email: string) => void;
  onToggleStatus?: (userId: string, currentStatus: string) => void;
  onToggleBlock?: (userId: string, currentStatus: string) => void;
  onDelete?: (userId: string, options?: { silent?: boolean }) => void;
  onBulkUpdate?: (userIds: string[], updates: any) => Promise<void>;
  onBulkResendConfirmation?: (userIds: string[]) => Promise<void>;
}

export const UsersTable = ({ 
  users, 
  loading, 
  onResendConfirmation, 
  onToggleStatus, 
  onToggleBlock, 
  onDelete,
  onBulkUpdate,
  onBulkResendConfirmation 
}: UsersTableProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [resendingEmailUserId, setResendingEmailUserId] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadges = (userRoles: any) => {
    if (!userRoles) return [];
    if (Array.isArray(userRoles)) {
      return userRoles[0]?.roles || [];
    }
    return userRoles.roles || [];
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      administrador: "Administrador",
      mantenimiento: "Mantenimiento",
      usuario_regular: "Usuario Regular",
    };
    return labels[role] || role;
  };

  const getRoleVariant = (
    role: string
  ): "default" | "destructive" | "secondary" => {
    if (role === "administrador") return "destructive";
    if (role === "mantenimiento") return "default";
    return "secondary";
  };

  const getUserType = (userRoles: any) => {
    const roles = getRoleBadges(userRoles);
    return roles.includes("administrador") ? "Administrador" : "Usuario";
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    const count = selectedUsers.length;
    try {
      for (const userId of selectedUsers) {
        await onDelete?.(userId, { silent: true });
      }
      setSelectedUsers([]);
      setShowDeleteDialog(false);
      toast({
        title: "Usuarios eliminados",
        description: `Se ${count === 1 ? 'eliminó' : 'eliminaron'} ${count} usuario${count > 1 ? 's' : ''} exitosamente`,
      });
    } catch (error) {
      console.error("Error al eliminar usuarios:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      const estado = selectedOptions[0];
      await onBulkUpdate(selectedUsers, { estado });
      setSelectedUsers([]);
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRoleChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedUsers, { roles: selectedOptions });
      setSelectedUsers([]);
      setShowRoleDialog(false);
    } catch (error) {
      console.error("Error al cambiar roles:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPermissionChange = async (selectedOptions?: string[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onBulkUpdate) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedUsers, { permisos: selectedOptions });
      setSelectedUsers([]);
      setShowPermissionDialog(false);
    } catch (error) {
      console.error("Error al cambiar permisos:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkResend = async () => {
    if (!onBulkResendConfirmation) return;
    
    setIsProcessing(true);
    try {
      await onBulkResendConfirmation(selectedUsers);
      setSelectedUsers([]);
      setShowResendDialog(false);
    } catch (error) {
      console.error("Error al reenviar confirmaciones:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedItems = (): BulkActionItem[] => {
    return selectedUsers.map(id => {
      const user = users.find(u => u.id === id);
      return {
        id,
        label: user?.name || user?.username || user?.email || "",
        description: user?.email,
        status: user?.estado || "activo",
      };
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Cambiar Estado",
      icon: <ToggleLeft className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowStatusDialog(true),
    },
    {
      label: "Cambiar Roles",
      icon: <UserCheck className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowRoleDialog(true),
    },
    {
      label: "Asignar Permisos",
      icon: <Key className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowPermissionDialog(true),
    },
    {
      label: "Reenviar Confirmación",
      icon: <Mail className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setShowResendDialog(true),
    },
    {
      label: "Eliminar",
      icon: <Trash className="h-4 w-4" />,
      variant: "destructive",
      onClick: () => setShowDeleteDialog(true),
    },
  ];

  return (
    <div className="space-y-4">
      <BulkActions
        selectedCount={selectedUsers.length}
        onClear={() => setSelectedUsers([])}
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
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onCheckedChange={toggleAllUsers}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Usuario</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[150px]">Tipo de Usuario</TableHead>
                <TableHead className="min-w-[200px]">Roles</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="min-w-[140px]">Confirmado</TableHead>
                <TableHead className="min-w-[150px]">Fecha de Registro</TableHead>
                <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roles = getRoleBadges(user.user_roles);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/usuarios/${user.id}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.name || user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-primary hover:underline">
                            {user.name || user.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {getUserType(user.user_roles)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roles.length > 0 ? (
                            roles.map((role: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant={getRoleVariant(role)}
                                className="text-xs"
                              >
                                {getRoleLabel(role)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Sin rol
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.estado === "bloqueado" ? (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.estado === "activo"}
                              disabled={updatingUserId === user.id}
                              onCheckedChange={async () => {
                                setUpdatingUserId(user.id);
                                await onToggleStatus?.(user.id, user.estado);
                                setUpdatingUserId(null);
                              }}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-sm">
                              {updatingUserId === user.id 
                                ? "Actualizando..." 
                                : user.estado === "activo" ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.confirmed ? "default" : "secondary"}
                          className="gap-1"
                        >
                          <div className="h-2 w-2 rounded-full bg-current" />
                          {user.confirmed ? "Confirmado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.created_at
                          ? format(new Date(user.created_at), "dd/MM/yyyy")
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
                            {hasPermission("editar_usuario") && (
                              <DropdownMenuItem onClick={() => navigate(`/usuarios/editar/${user.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {!user.confirmed && (
                              <DropdownMenuItem 
                                disabled={resendingEmailUserId === user.id}
                                onClick={async () => {
                                  setResendingEmailUserId(user.id);
                                  await onResendConfirmation?.(user.email);
                                  setResendingEmailUserId(null);
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {resendingEmailUserId === user.id ? "Reenviando..." : "Reenviar Confirmación"}
                              </DropdownMenuItem>
                            )}
                            {hasPermission("editar_usuario") && (
                              <DropdownMenuItem
                                disabled={blockingUserId === user.id}
                                onClick={async () => {
                                  setBlockingUserId(user.id);
                                  await onToggleBlock?.(user.id, user.estado);
                                  setBlockingUserId(null);
                                }}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                {blockingUserId === user.id 
                                  ? "Procesando..." 
                                  : user.estado === "bloqueado" ? "Desbloquear" : "Bloquear"}
                              </DropdownMenuItem>
                            )}
                            {hasPermission("eliminar_usuario") && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDelete?.(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
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
      title={`Eliminar ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}`}
      description={`Esta acción eliminará permanentemente ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''} seleccionado${selectedUsers.length > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
      icon={Trash}
      items={getSelectedItems()}
      itemsLabel={`Usuario${selectedUsers.length > 1 ? 's' : ''} que se eliminarán`}
      warning={{
        title: "¡Advertencia!",
        description: `Esta acción no se puede deshacer. ${selectedUsers.length > 1 ? 'Los usuarios eliminados' : 'El usuario eliminado'} no se ${selectedUsers.length > 1 ? 'podrán' : 'podrá'} recuperar.`,
      }}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      loading={isProcessing}
      onRemoveItem={removeUserFromSelection}
    />

    {/* Status Change Dialog */}
    <BulkActionDialog
      open={showStatusDialog}
      onOpenChange={setShowStatusDialog}
      onConfirm={handleBulkStatusChange}
      title="Cambiar estado de usuarios"
      description={`Cambiar el estado de ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}.`}
      icon={ToggleLeft}
      items={getSelectedItems()}
      itemsLabel="Usuarios afectados"
      multiSelect={false}
      options={[
        {
          id: "activo",
          label: "Activo",
          icon: <ToggleLeft className="h-4 w-4" />,
          color: "hsl(var(--success))",
        },
        {
          id: "inactivo",
          label: "Inactivo",
          icon: <ToggleLeft className="h-4 w-4" />,
          color: "hsl(var(--warning))",
        },
        {
          id: "bloqueado",
          label: "Bloqueado",
          icon: <Lock className="h-4 w-4" />,
          color: "hsl(var(--destructive))",
        },
      ]}
      confirmText="Cambiar Estado"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeUserFromSelection}
    />

    {/* Role Change Dialog */}
    <BulkActionDialog
      open={showRoleDialog}
      onOpenChange={setShowRoleDialog}
      onConfirm={handleBulkRoleChange}
      title="Asignar roles a usuarios"
      description={`Asignar roles a ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}. Puede seleccionar múltiples roles.`}
      icon={UserCheck}
      items={getSelectedItems()}
      itemsLabel="Usuarios afectados"
      options={[
        {
          id: "administrador",
          label: "Administrador",
          icon: <Shield className="h-4 w-4" />,
          color: "hsl(var(--destructive))",
        },
        {
          id: "mantenimiento",
          label: "Mantenimiento",
          icon: <UserCheck className="h-4 w-4" />,
          color: "hsl(var(--primary))",
        },
        {
          id: "usuario_regular",
          label: "Usuario Regular",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          id: "estudiante_personal",
          label: "Estudiante/Personal",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          id: "operador_analista",
          label: "Operador/Analista",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          id: "seguridad_uce",
          label: "Seguridad UCE",
          icon: <Shield className="h-4 w-4" />,
          color: "hsl(var(--warning))",
        },
      ]}
      confirmText="Asignar Roles"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeUserFromSelection}
    />

    {/* Permission Change Dialog */}
    <BulkActionDialog
      open={showPermissionDialog}
      onOpenChange={setShowPermissionDialog}
      onConfirm={handleBulkPermissionChange}
      title="Asignar permisos a usuarios"
      description={`Asignar permisos a ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}. Puede seleccionar múltiples permisos.`}
      icon={Key}
      items={getSelectedItems()}
      itemsLabel="Usuarios afectados"
      options={[
        { id: "ver_reporte", label: "Ver Reporte", icon: <Key className="h-4 w-4" /> },
        { id: "crear_reporte", label: "Crear Reporte", icon: <Key className="h-4 w-4" /> },
        { id: "editar_reporte", label: "Editar Reporte", icon: <Key className="h-4 w-4" /> },
        { id: "eliminar_reporte", label: "Eliminar Reporte", icon: <Key className="h-4 w-4" /> },
        { id: "ver_usuario", label: "Ver Usuario", icon: <Key className="h-4 w-4" /> },
        { id: "crear_usuario", label: "Crear Usuario", icon: <Key className="h-4 w-4" /> },
        { id: "editar_usuario", label: "Editar Usuario", icon: <Key className="h-4 w-4" /> },
        { id: "eliminar_usuario", label: "Eliminar Usuario", icon: <Key className="h-4 w-4" /> },
        { id: "ver_categoria", label: "Ver Categoría", icon: <Key className="h-4 w-4" /> },
        { id: "crear_categoria", label: "Crear Categoría", icon: <Key className="h-4 w-4" /> },
        { id: "editar_categoria", label: "Editar Categoría", icon: <Key className="h-4 w-4" /> },
        { id: "eliminar_categoria", label: "Eliminar Categoría", icon: <Key className="h-4 w-4" /> },
        { id: "ver_estado", label: "Ver Estado", icon: <Key className="h-4 w-4" /> },
        { id: "crear_estado", label: "Crear Estado", icon: <Key className="h-4 w-4" /> },
        { id: "editar_estado", label: "Editar Estado", icon: <Key className="h-4 w-4" /> },
        { id: "eliminar_estado", label: "Eliminar Estado", icon: <Key className="h-4 w-4" /> },
      ]}
      confirmText="Asignar Permisos"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeUserFromSelection}
    />

    {/* Resend Confirmation Dialog */}
    <BulkActionDialog
      open={showResendDialog}
      onOpenChange={setShowResendDialog}
      onConfirm={handleBulkResend}
      title="Reenviar confirmación de email"
      description={`Reenviar email de confirmación a ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}.`}
      icon={Mail}
      items={getSelectedItems()}
      itemsLabel="Usuarios afectados"
      confirmText="Reenviar"
      cancelText="Cancelar"
      variant="default"
      loading={isProcessing}
      onRemoveItem={removeUserFromSelection}
    />
    </div>
  );
};
