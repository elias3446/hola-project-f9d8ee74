import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const Auth = () => {
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndUsers();
  }, []);

  const checkAuthAndUsers = async () => {
    try {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
        return;
      }

      // Check if there are any users in the system
      const { data, error } = await supabase.rpc('has_any_users');
      
      if (error) throw error;

      const hasUsers = data === true;
      setIsFirstUser(!hasUsers);
      setShowRegister(!hasUsers);
    } catch (error) {
      console.error("Error checking users:", error);
      setIsFirstUser(false);
      setShowRegister(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    setIsFirstUser(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-pulse text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg border px-8 py-8 sm:px-12">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {showRegister ? (
                  <Shield className="h-8 w-8 text-primary" />
                ) : (
                  <Users className="h-8 w-8 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {showRegister ? "Configuración Inicial" : "Iniciar Sesión"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showRegister
                  ? "Crea la cuenta de administrador del sistema"
                  : "Accede a tu cuenta para continuar"}
              </p>
            </div>

            {showRegister ? (
              <RegisterForm onSuccess={handleRegisterSuccess} />
            ) : (
              <LoginForm />
            )}

            {!showRegister && (
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>¿Necesitas acceso? Contacta al administrador del sistema</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>Sistema seguro con auditoría completa de accesos</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Auth;
