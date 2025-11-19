import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    remainingTime?: number;
  } | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const checkLockout = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_login_lockout', {
        p_email: email,
      });

      if (error) throw error;

      const lockoutData = data as any;
      if (lockoutData?.is_locked) {
        setLockoutInfo({
          isLocked: true,
          remainingTime: Math.ceil(lockoutData.remaining_ms / 1000 / 60),
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error checking lockout:', err);
      return false;
    }
  };

  const recordFailedAttempt = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('record_failed_login', {
        p_email: email,
      });

      if (error) throw error;

      const attemptData = data as any;
      if (attemptData?.is_locked) {
        setLockoutInfo({
          isLocked: true,
          remainingTime: Math.ceil(attemptData.remaining_ms / 1000 / 60),
        });
      }
    } catch (err) {
      console.error('Error recording failed attempt:', err);
    }
  };

  const resetAttempts = async (email: string) => {
    try {
      await supabase.rpc('reset_login_attempts', {
        p_email: email,
      });
    } catch (err) {
      console.error('Error resetting attempts:', err);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      setError(null);
      setLockoutInfo(null);

      // Check if account is locked
      const isLocked = await checkLockout(data.email);
      if (isLocked) {
        setError("Cuenta temporalmente bloqueada por múltiples intentos fallidos");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        // Record failed attempt
        await recordFailedAttempt(data.email);
        throw signInError;
      }

      // Reset attempts on successful login
      await resetAttempts(data.email);

      toast.success("Inicio de sesión exitoso");
      navigate("/");
    } catch (err: any) {
      console.error("Error en login:", err);
      setError(err.message || "Credenciales inválidas");
      toast.error("Error al iniciar sesión", {
        description: "Verifica tu correo y contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lockoutInfo?.isLocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu cuenta está bloqueada por seguridad. Intenta nuevamente en {lockoutInfo.remainingTime} minutos.
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || lockoutInfo?.isLocked}
      >
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
};
