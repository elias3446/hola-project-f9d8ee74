import { Layout } from "@/components/Layout";
import { Users, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UsersTable } from "@/components/users/UsersTable";
import { 
  DataTableToolbar, 
  DataTableColumn, 
  DataTableFilters 
} from "@/components/ui/data-table-toolbar";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

const Usuarios = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { getUsers, loading, resendConfirmation, toggleUserStatus, toggleBlockUser, deleteUser } = useUserManagement();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filters, setFilters] = useState<DataTableFilters>({
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    columnFilters: {},
    propertyFilters: {},
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Derive 'tipo_usuario' and extract roles as array for filters
  const enrichedUsers = useMemo(() => {
    const extractRoles = (userRoles: any): string[] => {
      if (!userRoles) return [];
      if (Array.isArray(userRoles)) return userRoles[0]?.roles || [];
      return userRoles.roles || [];
    };

    const getRoleLabels = (roles: string[]): string[] => {
      const labels: Record<string, string> = {
        administrador: "Administrador",
        mantenimiento: "Mantenimiento",
        usuario_regular: "Usuario Regular",
      };
      return roles.map(role => labels[role] || role);
    };

    const deriveTipo = (u: any) => {
      const roles: string[] = extractRoles(u.user_roles ?? u.roles);
      const norm = roles.map((r) => String(r).toLowerCase());
      const isAdmin = norm.includes("administrador") || norm.includes("admin");
      return isAdmin ? "Administrador" : "Usuario";
    };

    return users.map((u) => {
      const rawRoles = extractRoles(u.user_roles ?? u.roles);
      return {
        ...u,
        tipo_usuario: deriveTipo(u),
        roles: getRoleLabels(rawRoles), // Array of role labels for filtering
      };
    });
  }, [users]);

  useEffect(() => {
    loadUsers();

    // Setup realtime subscription for profiles table
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // Update only the changed user in state
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === payload.new.id 
                ? { ...user, ...payload.new }
                : user
            )
          );
          setFilteredUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === payload.new.id 
                ? { ...user, ...payload.new }
                : user
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Solo recargar en inserciones
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
    setFilteredUsers(data);
  };

  const handleDeleteClick = async (userId: string, options?: { silent?: boolean }) => {
    if (options?.silent) {
      // Eliminación silenciosa (usada en bulk delete)
      try {
        await deleteUser(userId, { silent: true });
        await loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
    } else {
      // Eliminación individual con confirmación
      setUserToDelete(userId);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    const success = await deleteUser(userToDelete);
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    }
  };

  const handleBulkUpdate = async (userIds: string[], updates: any) => {
    try {
      // Update roles
      if (updates.roles) {
        for (const userId of userIds) {
          await supabase
            .from("user_roles")
            .update({ roles: updates.roles })
            .eq("user_id", userId);
        }
      }
      
      // Update permissions
      if (updates.permisos) {
        for (const userId of userIds) {
          await supabase
            .from("user_roles")
            .update({ permisos: updates.permisos })
            .eq("user_id", userId);
        }
      }
      
      // Update status
      if (updates.estado) {
        for (const userId of userIds) {
          await supabase
            .from("profiles")
            .update({ estado: updates.estado })
            .eq("id", userId);
        }
      }
      
      await loadUsers();
      toast.success("Usuarios actualizados exitosamente");
    } catch (error) {
      console.error("Error updating users:", error);
      toast.error("Error al actualizar usuarios");
    }
  };

  const handleBulkResendConfirmation = async (userIds: string[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const userId of userIds) {
        const user = users.find(u => u.id === userId);
        if (user?.email && !user.confirmed) {
          try {
            await supabase.auth.resend({
              type: 'signup',
              email: user.email,
            });
            successCount++;
          } catch (error) {
            console.error(`Error resending to ${user.email}:`, error);
            errorCount++;
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} confirmación${successCount > 1 ? 'es' : ''} reenviada${successCount > 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} error${errorCount > 1 ? 'es' : ''} al reenviar`);
      }
    } catch (error) {
      console.error("Error in bulk resend:", error);
      toast.error("Error al reenviar confirmaciones");
    }
  };

  // Paginación: calcular usuarios de la página actual
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    // Ajustar página actual si es necesario
    const newTotalPages = Math.ceil(filteredUsers.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers.length]);

  const columns: DataTableColumn[] = [
    { key: "name", label: "Usuario", type: "text", searchable: true, sortable: true },
    { key: "email", label: "Email", type: "text", searchable: true, sortable: true},
    { key: "tipo_usuario", label: "Tipo de Usuario", type: "text", searchable: true, sortable: true},
    { key: "roles", label: "Roles", type: "array", searchable: true, sortable: true},
    { key: "created_at", label: "Fecha de Registro", type: "date", searchable: false, sortable: true },
  ];

  return (
    <Layout title="Usuarios" icon={Users}>
      <div className="w-full space-y-6 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Usuarios</h1>
            </div>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema y sus roles
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Carga Masiva
            </Button>
            {hasPermission("crear_usuario") && (
              <Button 
                className="w-full sm:w-auto"
                onClick={() => navigate("/usuarios/crear")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            )}
          </div>
        </div>

        {/* Data Table Toolbar */}
        <DataTableToolbar
          data={enrichedUsers}
          columns={columns}
          sensitiveProperties={["estado", "confirmed"]}
          filters={filters}
          onFiltersChange={setFilters}
          onDataFilter={setFilteredUsers}
          searchPlaceholder="Buscar usuarios por nombre, email, tipo, roles..."
          exportFileName="usuarios"
        />

        {/* Users Table Component */}
        <UsersTable 
          users={paginatedData} 
          loading={loading}
          onResendConfirmation={resendConfirmation}
          onToggleStatus={toggleUserStatus}
          onToggleBlock={toggleBlockUser}
          onDelete={handleDeleteClick}
          onBulkUpdate={handleBulkUpdate}
          onBulkResendConfirmation={handleBulkResendConfirmation}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar usuario?"
          description="Esta acción eliminará permanentemente el usuario. Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          loading={deleting}
        />

        {/* Pagination Component */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredUsers.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </Layout>
  );
};

export default Usuarios;
