import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";

const passwordChangeSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

interface ForcePasswordChangeProps {
  profileId: string;
  onSuccess: () => void;
}

export const ForcePasswordChange = ({ profileId, onSuccess }: ForcePasswordChangeProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const newPassword = watch("newPassword");

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: newPassword?.length >= 8 },
    { label: "Una letra mayúscula", met: /[A-Z]/.test(newPassword || "") },
    { label: "Una letra minúscula", met: /[a-z]/.test(newPassword || "") },
    { label: "Un número", met: /[0-9]/.test(newPassword || "") },
    { label: "Un carácter especial", met: /[^A-Za-z0-9]/.test(newPassword || "") },
  ];

  const onSubmit = async (data: PasswordChangeInput) => {
    try {
      setIsLoading(true);

      // Update password in Supabase Auth
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (passwordError) throw passwordError;

      // Mark that password has been changed (triggers metadata cleanup)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", profileId);

      if (profileError) throw profileError;

      toast.success("Contraseña actualizada exitosamente", {
        description: "Tu contraseña ha sido cambiada. Ya puedes usar el sistema.",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Error al cambiar contraseña", {
        description: error.message || "Por favor, intenta nuevamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Cambio de contraseña obligatorio</CardTitle>
          <CardDescription>
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Tu cuenta fue creada con una contraseña temporal. Por favor, elige una contraseña segura que solo tú conozcas.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register("newPassword")}
                  disabled={isLoading}
                />
              </div>
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}

              {newPassword && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Requisitos de seguridad:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={req.met ? "text-success" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Cambiando contraseña..." : "Cambiar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
