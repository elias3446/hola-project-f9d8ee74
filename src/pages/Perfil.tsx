import { Layout } from "@/components/Layout";
import { User, Edit, BarChart3, History, Mail, Calendar, Shield, FileText, Activity, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActivityStats } from "@/components/ui/user-activity-stats";
import { UserCambios } from "@/components/users/detalle/UserCambios";
import { UserReportes } from "@/components/users/detalle/UserReportes";
import { UserAuditoria } from "@/components/users/detalle/UserAuditoria";
import { UserFriends } from "@/components/users/detalle/UserFriends";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Perfil = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState<any[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(true);
  const [userRoles, setUserRoles] = useState<any>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchReportes();
      fetchUserRoles();
    }
  }, [profile?.id]);

  const fetchReportes = async () => {
    try {
      const { data, error } = await supabase
        .from("reportes")
        .select("*, categories(nombre), tipo_categories(nombre), profiles!reportes_user_id_fkey(name), assigned_profiles:profiles!reportes_assigned_to_fkey(name)")
        .eq("assigned_to", profile?.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReportes(data || []);
    } catch (error) {
      console.error("Error fetching reportes:", error);
    } finally {
      setLoadingReportes(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", profile?.id)
        .single();

      if (error) throw error;
      setUserRoles(data);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const getMemberSince = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Miembro desde hace ${diffDays} días`;
  };

  if (loading) {
    return (
      <Layout title="Mi Perfil" icon={User}>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mi Perfil" icon={User}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <Button onClick={() => navigate("/perfil/editar")} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <UserAvatar
                avatar={profile?.avatar}
                name={profile?.name}
                email={profile?.email}
                username={profile?.username}
                size="lg"
              />

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{profile?.name || "Sin nombre"}</h2>
                  {profile?.username && (
                    <Link 
                      to={`/usuario/${profile.username}`}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      @{profile.username}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userRoles?.roles?.map((role: string) => (
                    <Badge key={role} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {role === "administrador" ? "Administrador" : role === "mantenimiento" ? "Mantenimiento" : "Usuario"}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getMemberSince(profile?.created_at || new Date().toISOString())}</span>
                  </div>
                  <Badge variant={profile?.estado === "activo" ? "default" : "secondary"}>
                    {profile?.estado === "activo" ? "Activo" : profile?.estado || "Desconocido"}
                  </Badge>
                  <Badge variant={profile?.confirmed ? "default" : "secondary"}>
                    {profile?.confirmed ? "Email confirmado" : "Email no confirmado"}
                  </Badge>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="reportes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reportes">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="amigos">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Amigos</span>
            </TabsTrigger>
            <TabsTrigger value="estadisticas">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="actividad">
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actividad</span>
            </TabsTrigger>
            <TabsTrigger value="cambios">
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cambios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reportes" className="space-y-4">
            <UserReportes
              reportes={reportes}
              loadingReportes={loadingReportes}
              userName={profile?.name || "ti"}
            />
          </TabsContent>

          <TabsContent value="amigos">
            {profile?.id && <UserFriends userId={profile.id} />}
          </TabsContent>

          <TabsContent value="estadisticas">
            {profile?.id && (
              <UserActivityStats
                userId={profile.id}
                userEmail={profile.email || undefined}
                userCreatedAt={profile.created_at}
              />
            )}
          </TabsContent>

          <TabsContent value="actividad">
            {profile?.id && (
              <UserAuditoria
                userId={profile.id}
                userEmail={profile.email || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="cambios">
            {profile?.id && (
              <UserCambios
                userId={profile.id}
                userEmail={profile.email || undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Perfil;
