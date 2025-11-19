import { Layout } from "@/components/Layout";
import { User, ArrowLeft, Eye, EyeOff, Lock, AlertCircle, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { UserAvatar } from "@/components/ui/user-avatar";
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
import { emailSchema } from "@/lib/validations/auth";

// Función para generar contraseña segura
const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%&*_-+=';
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Schema de validación para información personal
const personalInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().optional(),
  email: emailSchema,
  currentPasswordForEmail: z.string().optional(),
});

// Schema de validación para contraseña
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[a-z]/, "Al menos una minúscula")
    .regex(/[A-Z]/, "Al menos una mayúscula")
    .regex(/[0-9]/, "Al menos un número")
    .regex(/[!@#$%^&*]/, "Al menos un carácter especial (!@#$%^&*)"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const EditarPerfil = () => {
  const { profile, loading, changeOwnEmail } = useAuth();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<PersonalInfoFormValues | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  const personalForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: "",
      apellido: "",
      email: "",
      currentPasswordForEmail: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Actualizar valores del formulario cuando el profile se carga
  useEffect(() => {
    if (profile) {
      // Extraer nombre y apellido
      const nameParts = profile.name?.split(" ") || [];
      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";
      
      personalForm.reset({
        name: nombre,
        apellido: apellido,
        email: profile.email || "",
      });
    }
  }, [profile, personalForm]);

  const getInitials = () => {
    const displayName = profile?.name || profile?.email;
    if (displayName) {
      const parts = displayName.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const onSubmitPersonalInfo = async (data: PersonalInfoFormValues) => {
    // Si el email cambió, validar contraseña actual y mostrar diálogo
    if (data.email !== profile?.email) {
      if (!data.currentPasswordForEmail) {
        toast.error("Debes ingresar tu contraseña actual para cambiar el email");
        return;
      }
      // Generar nueva contraseña automáticamente
      const newPassword = generateSecurePassword();
      setGeneratedPassword(newPassword);
      setPendingEmailChange(data);
      setShowEmailChangeDialog(true);
      return;
    }

    // Si no cambió el email, actualizar directamente
    await updateProfile(data);
  };

  const updateProfile = async (data: PersonalInfoFormValues) => {
    try {
      // Combinar nombre y apellido
      const fullName = `${data.name} ${data.apellido || ""}`.trim();
      
      const updateData: any = { name: fullName };
      
      // Solo actualizar avatar si hay un avatar temporal
      if (tempAvatar) {
        updateData.avatar = tempAvatar;
      }

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile?.id);

      if (profileError) throw profileError;

      toast.success("Perfil actualizado exitosamente");
      setTempAvatar(null);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el perfil");
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!pendingEmailChange || !pendingEmailChange.currentPasswordForEmail || !generatedPassword) return;

    try {
      // Actualizar nombre y avatar primero
      await updateProfile(pendingEmailChange);

      // Cambiar email usando la nueva contraseña generada
      const success = await changeOwnEmail(
        pendingEmailChange.currentPasswordForEmail,
        pendingEmailChange.email,
        generatedPassword
      );

      if (!success) {
        return;
      }

      toast.success("Email actualizado exitosamente. Guarda tu nueva contraseña antes de que se cierre la sesión.");
      
      // Cerrar sesión después de 5 segundos (dar tiempo para copiar la contraseña)
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth", { 
          state: { 
            message: "Tu email ha sido actualizado. Por favor, inicia sesión con tu nuevo email y contraseña." 
          } 
        });
      }, 5000);
      
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el email");
    } finally {
      setShowEmailChangeDialog(false);
      setPendingEmailChange(null);
      setGeneratedPassword("");
      setPasswordCopied(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast.success("Contraseña copiada al portapapeles");
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      toast.error("No se pudo copiar la contraseña");
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      // Primero verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || "",
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error("La contraseña actual es incorrecta");
        return;
      }

      // Si la verificación fue exitosa, actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Contraseña actualizada exitosamente");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la contraseña");
    }
  };

  const handleAvatarUpload = (result: any) => {
    if (result?.secure_url) {
      setTempAvatar(result.secure_url);
      toast.success("Imagen cargada. Guarda los cambios para aplicar.");
    }
  };

  const handleAvatarError = (error: any) => {
    toast.error("Error al cargar la imagen");
    console.error("Upload error:", error);
  };

  // Mostrar avatar temporal o el del perfil
  const displayAvatar = tempAvatar || profile?.avatar;

  if (loading) {
    return (
      <Layout title="Editar Perfil" icon={User}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Editar Mi Perfil" icon={User}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Mi Perfil</h1>
            <p className="text-muted-foreground">Actualiza tu información personal</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="h-4 w-4 mr-2" />
              Contraseña
            </TabsTrigger>
          </TabsList>

          {/* Información Personal */}
          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Información Personal</h2>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <UserAvatar
                    avatar={displayAvatar}
                    name={profile?.name}
                    email={profile?.email}
                    username={profile?.username}
                    size="lg"
                    enableModal={true}
                  />

                  <CloudinaryUploadWidget
                    onUploadSuccess={handleAvatarUpload}
                    onUploadError={handleAvatarError}
                    folder="avatars"
                    maxFiles={1}
                    maxFileSize={5242880}
                    allowedFormats={["jpg", "png", "jpeg", "gif", "webp"]}
                    buttonText="Cambiar Avatar"
                    buttonVariant="outline"
                    cropping={true}
                    croppingAspectRatio={1}
                  />

                  <p className="text-xs text-muted-foreground text-center">
                    Formatos soportados: JPG, PNG, GIF, WebP. Máximo 5MB.
                  </p>
                  
                  {tempAvatar && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      * Guarda los cambios para aplicar el nuevo avatar
                    </p>
                  )}
                </div>

                {/* Form */}
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(onSubmitPersonalInfo)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Tu nombre" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="apellido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Tu apellido" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={personalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="tu@email.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {personalForm.watch("email") !== profile?.email && (
                      <>
                        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            <strong>Importante:</strong> Para cambiar tu email, debes ingresar tu contraseña actual. 
                            Se generará una nueva contraseña automáticamente y se cerrarán TODAS tus sesiones activas por seguridad.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={personalForm.control}
                          name="currentPasswordForEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña Actual *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Tu contraseña actual"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  >
                                    {showCurrentPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <Button type="submit" className="w-full md:w-auto">
                      Guardar Cambios
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contraseña */}
          <TabsContent value="password">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Cambiar Contraseña</h2>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Seguridad:</strong> Por tu seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
                  </AlertDescription>
                </Alert>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña Actual *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Ingresa tu contraseña actual"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva Contraseña *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Ingresa tu nueva contraseña"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nueva Contraseña *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirma tu nueva contraseña"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        <strong>Requisitos de contraseña:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>Mínimo 8 caracteres</li>
                          <li>Al menos una mayúscula y una minúscula</li>
                          <li>Al menos un número</li>
                          <li>Al menos un carácter especial (!@#$%^&*)</li>
                          <li>No debe contener patrones comunes</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button type="submit">
                        Actualizar Contraseña
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          passwordForm.reset();
                          navigate("/perfil");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogo de confirmación de cambio de email */}
        <AlertDialog open={showEmailChangeDialog} onOpenChange={setShowEmailChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar cambio de email?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>Estás a punto de cambiar tu email. Esta acción:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Cerrará TODAS tus sesiones activas</li>
                  <li>Requerirá que confirmes tu nuevo email</li>
                  <li>Generará una nueva contraseña automáticamente</li>
                  <li>Necesitarás iniciar sesión nuevamente</li>
                </ul>
                
                {generatedPassword && (
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-semibold">Tu nueva contraseña:</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedPassword}
                        type={showGeneratedPassword ? "text" : "password"}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                      >
                        {showGeneratedPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyPassword}
                      >
                        {passwordCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-destructive font-semibold">
                      ⚠️ IMPORTANTE: Copia esta contraseña antes de continuar. La necesitarás para iniciar sesión nuevamente.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmEmailChange}>
                Sí, cambiar email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default EditarPerfil;
