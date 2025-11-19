import { Layout } from "@/components/Layout";
import { Navigation, MapPin, Bell, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const ConfiguracionRastreo = () => {
  const { settings, loading, updateSettings } = useSettings();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Check notification permission status
  useEffect(() => {
    if (typeof Notification === "undefined") return;

    const checkPermission = () => {
      setNotificationPermission(Notification.permission);
    };

    // Check periodically in case user changes it in browser settings
    const interval = setInterval(checkPermission, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggleTracking = async (enabled: boolean) => {
    const success = await updateSettings({ real_time_tracking_enabled: enabled });
    if (success) {
      toast.success(
        enabled
          ? "Rastreo en tiempo real activado"
          : "Rastreo en tiempo real desactivado"
      );
    } else {
      toast.error("Error al actualizar la configuración");
    }
  };

  const requestNotificationPermission = async () => {
    console.log("🔔 Solicitando permisos de notificación...");
    console.log("🔔 Estado actual:", Notification.permission);
    
    if (!("Notification" in window)) {
      console.error("❌ Navegador no soporta notificaciones");
      toast.error("Tu navegador no soporta notificaciones");
      return;
    }

    // Si ya están concedidas
    if (Notification.permission === "granted") {
      console.log("✅ Permisos ya concedidos");
      toast.success("Los permisos de notificación ya están activos");
      return;
    }

    // Si ya fueron denegadas
    if (Notification.permission === "denied") {
      console.warn("⚠️ Permisos previamente denegados");
      toast.error(
        "Las notificaciones están bloqueadas. Ve a la configuración de tu navegador para permitirlas.",
        { duration: 6000 }
      );
      return;
    }

    // Solicitar permisos
    try {
      console.log("🔔 Mostrando prompt de permisos...");
      const permission = await Notification.requestPermission();
      console.log("🔔 Respuesta del usuario:", permission);
      
      if (permission === "granted") {
        toast.success("¡Permisos de notificación concedidos!");
        // Mostrar una notificación de prueba
        new Notification("🎉 Notificaciones activadas", {
          body: "Ahora recibirás alertas de reportes cercanos",
          icon: "/favicon.ico",
        });
      } else if (permission === "denied") {
        toast.error("Permisos de notificación denegados");
      } else {
        toast.info("Solicitud de permisos cancelada");
      }
    } catch (error) {
      console.error("❌ Error solicitando permisos:", error);
      toast.error("Error al solicitar permisos de notificación");
    }
  };

  if (loading) {
    return (
      <Layout title="Configuración de Rastreo" icon={Navigation}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configuración de Rastreo" icon={Navigation}>
      <div className="max-w-2xl space-y-6">
        {/* Notification Permission Alert */}
        {settings?.real_time_tracking_enabled && notificationPermission !== "granted" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <div className="font-semibold">
                  {notificationPermission === "denied" 
                    ? "Las notificaciones están bloqueadas por tu navegador" 
                    : "Necesitas activar las notificaciones"}
                </div>
                {notificationPermission === "denied" ? (
                  <div className="text-sm space-y-2">
                    <p>Para activarlas manualmente:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Haz clic en el ícono de candado/información en la barra de direcciones</li>
                      <li>Busca "Notificaciones" en los permisos del sitio</li>
                      <li>Cambia de "Bloquear" a "Permitir"</li>
                      <li>Recarga la página</li>
                    </ol>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={requestNotificationPermission}
                    className="w-fit"
                  >
                    Solicitar permisos
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Setting Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Rastreo en Tiempo Real
            </CardTitle>
            <CardDescription>
              Recibe notificaciones cuando te acerques a un reporte activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="tracking-toggle" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Activar rastreo automático</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Notificaciones cuando estés cerca de reportes
                </span>
              </Label>
              <Switch
                id="tracking-toggle"
                checked={settings?.real_time_tracking_enabled ?? true}
                onCheckedChange={handleToggleTracking}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">¿Cómo funciona el rastreo en tiempo real?</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>El sistema monitorea tu ubicación en segundo plano</li>
                <li>Recibes notificaciones push nativas al entrar dentro de 100 metros de un reporte</li>
                <li>Solo se notifican reportes activos (pendientes o en proceso)</li>
                <li>Las notificaciones funcionan en móviles, tablets y desktop</li>
                <li>Si sales del radio y vuelves a entrar, recibirás una nueva notificación</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Features Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones Push Nativas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Recibe notificaciones del sistema operativo con alertas sonoras y visuales
              que funcionan incluso cuando el navegador está en segundo plano.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Tu ubicación solo se usa localmente en tu dispositivo. No se almacena
              ni comparte con otros usuarios.
            </CardContent>
          </Card>
        </div>

        {/* Status Indicator */}
        {settings?.real_time_tracking_enabled && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="font-medium">Rastreo activo</p>
                  <p className="text-sm text-muted-foreground">
                    El sistema está monitoreando reportes cercanos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ConfiguracionRastreo;
