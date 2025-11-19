import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password");

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: password?.length >= 8 },
    { label: "Una letra mayúscula", met: /[A-Z]/.test(password || "") },
    { label: "Una letra minúscula", met: /[a-z]/.test(password || "") },
    { label: "Un número", met: /[0-9]/.test(password || "") },
    { label: "Un carácter especial", met: /[^A-Za-z0-9]/.test(password || "") },
  ];

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const redirectUrl = `${window.location.origin}/auth`;

      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            password: data.password,
          },
        },
      });

      if (signUpError) throw signUpError;

      toast.success("Registro exitoso", {
        description: "Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...",
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError(err.message || "Error al registrar usuario");
      toast.error("Error en el registro", {
        description: err.message || "Por favor, intenta nuevamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nombre completo
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre completo"
            className="pl-10"
            {...register("name")}
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            className="pl-10"
            {...register("email")}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            {...register("password")}
            disabled={isLoading}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        
        {password && (
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Creando cuenta..." : "Crear cuenta de administrador"}
      </Button>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Este es el primer usuario del sistema. Se asignarán automáticamente todos los permisos de administrador.
        </AlertDescription>
      </Alert>
    </form>
  );
};
