import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus, X, Edit } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserRole = Database["public"]["Enums"]["user_role"];
type UserPermission = Database["public"]["Enums"]["user_permission"];

const AVAILABLE_ROLES: { value: UserRole; label: string; description: string; color: string }[] = [
  { 
    value: "administrador", 
    label: "Administrador", 
    description: "Rol de administrador con todos los permisos del sistema",
    color: "text-red-500"
  },
  { 
    value: "mantenimiento", 
    label: "Mantenimiento", 
    description: "Rol de mantenimiento con permisos específicos",
    color: "text-blue-500"
  },
  { 
    value: "usuario_regular", 
    label: "Usuario Regular", 
    description: "Rol básico de usuario con permisos limitados",
    color: "text-blue-500"
  },
  { 
    value: "estudiante_personal", 
    label: "Estudiante/Personal", 
    description: "Estudiante o personal de la universidad",
    color: "text-green-500"
  },
  { 
    value: "operador_analista", 
    label: "Operador/Analista", 
    description: "Operador o analista del sistema",
    color: "text-purple-500"
  },
  { 
    value: "seguridad_uce", 
    label: "Seguridad UCE", 
    description: "Personal de seguridad de la universidad",
    color: "text-orange-500"
  },
];

const PERMISSION_GROUPS = [
  {
    title: "Reportes",
    permissions: [
      { value: "ver_reporte" as UserPermission, label: "Ver Reportes" },
      { value: "crear_reporte" as UserPermission, label: "Crear Reportes" },
      { value: "editar_reporte" as UserPermission, label: "Editar Reportes" },
      { value: "eliminar_reporte" as UserPermission, label: "Eliminar Reportes" },
    ],
  },
  {
    title: "Usuarios",
    permissions: [
      { value: "ver_usuario" as UserPermission, label: "Ver Usuarios" },
      { value: "crear_usuario" as UserPermission, label: "Crear Usuarios" },
      { value: "editar_usuario" as UserPermission, label: "Editar Usuarios" },
      { value: "eliminar_usuario" as UserPermission, label: "Eliminar Usuarios" },
    ],
  },
  {
    title: "Categorías",
    permissions: [
      { value: "ver_categoria" as UserPermission, label: "Ver Categorías" },
      { value: "crear_categoria" as UserPermission, label: "Crear Categorías" },
      { value: "editar_categoria" as UserPermission, label: "Editar Categorías" },
      { value: "eliminar_categoria" as UserPermission, label: "Eliminar Categorías" },
    ],
  },
  {
    title: "Estados",
    permissions: [
      { value: "ver_estado" as UserPermission, label: "Ver Estados" },
      { value: "crear_estado" as UserPermission, label: "Crear Estados" },
      { value: "editar_estado" as UserPermission, label: "Editar Estados" },
      { value: "eliminar_estado" as UserPermission, label: "Eliminar Estados" },
    ],
  },
];

// Definir permisos por rol
const PERMISOS_POR_ROL: Record<UserRole, UserPermission[]> = {
  administrador: [
    "ver_usuario", "crear_usuario", "editar_usuario", "eliminar_usuario",
    "ver_reporte", "crear_reporte", "editar_reporte", "eliminar_reporte",
    "ver_categoria", "crear_categoria", "editar_categoria", "eliminar_categoria",
    "ver_estado", "crear_estado", "editar_estado", "eliminar_estado"
  ],
  mantenimiento: [
    "ver_reporte", "editar_reporte",
    "ver_categoria", "crear_categoria", "editar_categoria",
    "ver_estado", "editar_estado"
  ],
  usuario_regular: [
    "ver_reporte", "crear_reporte"
  ],
  estudiante_personal: [
    "ver_reporte", "crear_reporte"
  ],
  operador_analista: [
    "ver_reporte", "editar_reporte",
    "ver_categoria", "ver_estado"
  ],
  seguridad_uce: [
    "ver_reporte", "editar_reporte",
    "ver_usuario"
  ]
};

// Función para generar contraseña segura
const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%&*_-+=';
  
  // Garantizar al menos un carácter de cada tipo
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Completar hasta 12 caracteres con caracteres aleatorios
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const CrearUsuario = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createUser, updateUser, updateUserRoles, getUserById, loading, changeUserEmail } = useUserManagement();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });
  
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermission[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalRoles, setOriginalRoles] = useState<UserRole[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<UserPermission[]>([]);
  const [showPasswordForEmailChange, setShowPasswordForEmailChange] = useState(false);
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [pendingEmailChangeData, setPendingEmailChangeData] = useState<{ fullName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generar contraseña al montar en modo creación
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({ ...prev, password: generateSecurePassword() }));
    }
  }, [isEditing]);

  // Auto-seleccionar permisos cuando cambien los roles (solo en modo creación)
  useEffect(() => {
    // Solo auto-seleccionar permisos en modo creación, no en edición
    if (isEditing || isLoadingInitialData) return;

    if (selectedRoles.length === 0) {
      setSelectedPermissions([]);
      return;
    }

    // Combinar todos los permisos de los roles seleccionados (sin duplicados)
    const permisosUnicos = new Set<UserPermission>();
    selectedRoles.forEach(role => {
      PERMISOS_POR_ROL[role].forEach(permiso => permisosUnicos.add(permiso));
    });

    setSelectedPermissions(Array.from(permisosUnicos));
  }, [selectedRoles, isEditing, isLoadingInitialData]);

  useEffect(() => {
    if (isEditing && id) {
      loadUserData();
    }
  }, [id, isEditing]);

  const loadUserData = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setIsLoadingInitialData(true); // Marcar que estamos cargando datos iniciales
    const userData = await getUserById(id);
    setLoadingUser(false);
    
    if (userData) {
      // Extraer nombre y apellido
      const nameParts = userData.name?.split(" ") || [];
      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";
      
      setFormData({
        nombre,
        apellido,
        email: userData.email || "",
        password: "", // No mostramos la contraseña existente
      });
      
      setOriginalEmail(userData.email || "");

      // Cargar roles
      const userRoles = userData.user_roles;
      let roles: UserRole[] = [];
      let permisos: UserPermission[] = [];
      
      if (userRoles) {
        if (Array.isArray(userRoles)) {
          roles = userRoles[0]?.roles || [];
          permisos = userRoles[0]?.permisos || [];
        } else {
          roles = userRoles.roles || [];
          permisos = userRoles.permisos || [];
        }
      }
      
      setSelectedRoles(roles);
      setSelectedPermissions(permisos);
      setOriginalRoles(roles);
      setOriginalPermissions(permisos);
    } else {
      toast.error("No se pudo cargar la información del usuario");
      navigate("/usuarios");
    }
    
    // Después de cargar, desactivar la bandera
    setIsLoadingInitialData(false);
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Remover rol
        const newRoles = prev.filter(r => r !== role);
        
        // Recalcular permisos basados en los roles restantes
        const permisosUnicos = new Set<UserPermission>();
        newRoles.forEach(r => {
          PERMISOS_POR_ROL[r].forEach(permiso => permisosUnicos.add(permiso));
        });
        
        setSelectedPermissions(Array.from(permisosUnicos));
        return newRoles;
      } else {
        // Agregar rol
        const newRoles = [...prev, role];
        
        // Agregar permisos del nuevo rol a los existentes
        const permisosUnicos = new Set<UserPermission>(selectedPermissions);
        PERMISOS_POR_ROL[role].forEach(permiso => permisosUnicos.add(permiso));
        
        setSelectedPermissions(Array.from(permisosUnicos));
        return newRoles;
      }
    });
  };

  const handlePermissionToggle = (permission: UserPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAllInGroup = (groupPermissions: UserPermission[]) => {
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        groupPermissions.forEach(p => {
          if (!newPerms.includes(p)) {
            newPerms.push(p);
          }
        });
        return newPerms;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.email) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    // Validar contraseña solo al crear
    if (!isEditing && !formData.password) {
      toast.error("Por favor ingresa una contraseña");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Por favor selecciona al menos un tipo de usuario");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("Por favor selecciona al menos un permiso");
      return;
    }

    const fullName = `${formData.nombre} ${formData.apellido}`.trim();
    
    if (isEditing && id) {
      // Verificar si el email cambió
      const emailChanged = formData.email !== originalEmail;
      
      if (emailChanged) {
        // Si el email cambió, necesitamos contraseña
        if (!formData.password) {
          toast.error("Por favor ingresa una contraseña nueva para el cambio de email");
          return;
        }
        
        // Mostrar diálogo de confirmación
        setPendingEmailChangeData({ fullName });
        setShowEmailChangeDialog(true);
        return;
      }
      
      // Si no cambió email, proceder normalmente
      await updateUserData(fullName);
    } else {
      // Crear nuevo usuario
      const result = await createUser(
        formData.email,
        formData.password,
        {
          name: fullName,
          roles: selectedRoles,
          permisos: selectedPermissions,
        }
      );

      if (result) {
        navigate("/usuarios");
      }
    }
  };

  const updateUserData = async (fullName: string) => {
    if (!id) return;

    // Actualizar nombre
    const updateResult = await updateUser(id, {
      name: fullName,
    });

    if (updateResult) {
      // Solo actualizar roles y permisos si cambiaron
      const rolesChanged = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(originalRoles.sort());
      const permissionsChanged = JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
      
      if (rolesChanged || permissionsChanged) {
        await updateUserRoles(id, {
          roles: selectedRoles,
          permisos: selectedPermissions,
        });
      }
      
      navigate("/usuarios");
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!pendingEmailChangeData || !id) return;

    // Cambiar email (proceso completo)
    const emailChangeSuccess = await changeUserEmail(
      id,
      originalEmail,
      formData.email,
      formData.password
    );
    
    if (emailChangeSuccess) {
      await updateUserData(pendingEmailChangeData.fullName);
    }
    
    setShowEmailChangeDialog(false);
    setPendingEmailChangeData(null);
  };

  if (loadingUser) {
    return (
      <Layout title={isEditing ? "Editar Usuario" : "Crear Usuario"} icon={isEditing ? Edit : UserPlus}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos del usuario...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Editar Usuario" : "Crear Usuario"} icon={isEditing ? Edit : UserPlus}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/usuarios")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {isEditing ? (
                <Edit className="h-5 w-5 text-primary" />
              ) : (
                <UserPlus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing 
                  ? "Modifica los datos del usuario en el sistema"
                  : "Completa los datos para crear un nuevo usuario en el sistema"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Información del Usuario */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              <div className="border rounded-lg p-6 space-y-4 bg-card flex-1">
                <h3 className="font-semibold text-lg">Información del Usuario</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      placeholder="Ingresa el nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido">
                      Apellido <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="apellido"
                      placeholder="Ingresa el apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      // Mostrar campo de contraseña si cambia el email en modo edición
                      if (isEditing && e.target.value !== originalEmail) {
                        setShowPasswordForEmailChange(true);
                        setFormData(prev => ({ ...prev, password: generateSecurePassword() }));
                      } else if (isEditing && e.target.value === originalEmail) {
                        setShowPasswordForEmailChange(false);
                        setFormData(prev => ({ ...prev, password: "" }));
                      }
                    }}
                    required
                  />
                  {isEditing && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                      ⚠️ Al cambiar el email, se cerrarán TODAS las sesiones activas del usuario por seguridad. 
                      El usuario deberá confirmar su nuevo email e iniciar sesión nuevamente.
                    </p>
                  )}
                </div>

{(!isEditing || showPasswordForEmailChange) && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Contraseña {!isEditing || showPasswordForEmailChange ? <span className="text-destructive">*</span> : null}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña generada automáticamente"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!isEditing || showPasswordForEmailChange}
                        minLength={8}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex-shrink-0"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData({ ...formData, password: generateSecurePassword() });
                          setShowPassword(true);
                        }}
                        className="flex-shrink-0"
                      >
                        Regenerar
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                        <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
                          ⚠️ Advertencia de seguridad
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          Esta contraseña solo se muestra una vez. Guárdala de forma segura y comunícala al usuario por un canal seguro (no por email público ni captura de pantalla).
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isEditing 
                        ? "Nueva contraseña requerida para cambiar el email. Cópiala antes de guardar."
                        : "Contraseña generada automáticamente. Cópiala antes de crear el usuario."
                      }
                    </p>
                  </div>
                )}

                {isEditing && !showPasswordForEmailChange && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      La contraseña no se puede cambiar desde aquí. Si cambias el email, se generará una nueva contraseña.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>
                    Tipo de Usuario <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-3">
                    {AVAILABLE_ROLES.map((role) => (
                      <div key={role.value} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={role.value}
                          checked={selectedRoles.includes(role.value)}
                          onCheckedChange={() => handleRoleToggle(role.value)}
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={role.value}
                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <span className={`h-2 w-2 rounded-full ${role.color === 'text-red-500' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                            {role.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Permisos del Rol */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="border rounded-lg p-6 space-y-4 bg-card flex-1 flex flex-col max-h-[600px]">
                <h3 className="font-semibold text-lg flex-shrink-0">Permisos del Rol</h3>
                
                <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const allSelected = group.permissions.every(p => selectedPermissions.includes(p.value));
                    
                    return (
                      <div key={group.title} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="font-medium flex-shrink-0">{group.title}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAllInGroup(group.permissions.map(p => p.value))}
                            className="h-7 text-xs whitespace-nowrap flex-shrink-0"
                          >
                            {allSelected ? "Desmarcar todos" : "Marcar todos"}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {group.permissions.map((permission) => (
                            <div key={permission.value} className="flex items-center gap-2">
                              <Checkbox
                                id={permission.value}
                                checked={selectedPermissions.includes(permission.value)}
                                onCheckedChange={() => handlePermissionToggle(permission.value)}
                              />
                              <label
                                htmlFor={permission.value}
                                className="text-sm cursor-pointer"
                              >
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-start border-t pt-6 pb-8">
            <Button type="submit" disabled={loading} className="gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-4 w-4" />
                  Actualizar Usuario
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/usuarios")}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>

        {/* Diálogo de confirmación de cambio de email */}
        <AlertDialog open={showEmailChangeDialog} onOpenChange={setShowEmailChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar cambio de email del usuario?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Estás a punto de cambiar el email de este usuario de{" "}
                  <strong>{originalEmail}</strong> a <strong>{formData.email}</strong>.
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚠️ Por seguridad, se cerrarán TODAS las sesiones activas del usuario automáticamente.
                </p>
                <p>
                  El usuario recibirá un correo de confirmación en su nuevo email. Deberá confirmar 
                  el cambio y luego iniciar sesión nuevamente con el nuevo email.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingEmailChangeData(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmEmailChange}>
                Confirmar Cambio
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default CrearUsuario;
