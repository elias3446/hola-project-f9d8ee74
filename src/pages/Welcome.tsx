import { Shield, Users, FileText, BarChart3, MessageSquare, MapPin, FolderTree, Bell, Settings } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

const Welcome = () => {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();

  const quickAccessCards = [
    {
      title: "Crear Reporte",
      description: "Registra un nuevo reporte en el sistema",
      icon: FileText,
      href: "/reportes/crear",
      show: hasPermission("crear_reporte"),
      color: "text-blue-500",
    },
    {
      title: "Mis Reportes",
      description: "Consulta tus reportes creados",
      icon: FolderTree,
      href: "/mis-reportes",
      show: true,
      color: "text-green-500",
    },
    {
      title: "Red Social",
      description: "Interactúa con la comunidad",
      icon: MessageSquare,
      href: "/red-social",
      show: true,
      color: "text-purple-500",
    },
    {
      title: "Rastreo en Vivo",
      description: "Visualiza ubicaciones en tiempo real",
      icon: MapPin,
      href: "/rastreo",
      show: true,
      color: "text-red-500",
    },
    {
      title: "Gestión de Usuarios",
      description: "Administra usuarios del sistema",
      icon: Users,
      href: "/usuarios",
      show: hasPermission("ver_usuario"),
      color: "text-orange-500",
    },
    {
      title: "Todos los Reportes",
      description: "Consulta y gestiona reportes",
      icon: FileText,
      href: "/reportes",
      show: hasPermission("ver_reporte"),
      color: "text-cyan-500",
    },
    {
      title: "Categorías",
      description: "Gestiona categorías del sistema",
      icon: FolderTree,
      href: "/categorias",
      show: hasPermission("ver_categoria"),
      color: "text-pink-500",
    },
    {
      title: "Estados",
      description: "Gestiona estados del sistema",
      icon: BarChart3,
      href: "/auditoria",
      show: hasPermission("ver_estado"),
      color: "text-yellow-500",
    },
    {
      title: "Notificaciones",
      description: "Revisa tus notificaciones",
      icon: Bell,
      href: "/notificaciones",
      show: true,
      color: "text-indigo-500",
    },
    {
      title: "Configuración",
      description: "Personaliza tu experiencia",
      icon: Settings,
      href: "/configuracion",
      show: true,
      color: "text-gray-500",
    },
  ].filter(card => card.show);

  return (
    <Layout title="Bienvenido a UniAlerta UCE" icon={Shield}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header de bienvenida personalizado */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg shadow-lg border-2 border-primary/20 p-8">
          <div className="flex items-center gap-4">
            <UserAvatar
              avatar={profile?.avatar}
              name={profile?.name}
              email={profile?.email}
              username={profile?.username}
              size="lg"
              enableModal={false}
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ¡Bienvenido, {profile?.name || "Usuario"}!
              </h2>
              <p className="text-muted-foreground mt-1 text-lg">
                Has iniciado sesión exitosamente en UniAlerta UCE
              </p>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessCards.map((card) => (
              <Link key={card.href} to={card.href}>
                <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${card.color}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{card.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Welcome;
