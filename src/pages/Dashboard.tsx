import { Layout } from "@/components/Layout";
import { LayoutDashboard, FileText, Users, MessageSquare, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
};

const Dashboard = () => {
  const { stats, loading } = useDashboardStats();

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend,
    color = "primary" 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    description?: string;
    trend?: string;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
  }) => {
    const colorClasses = {
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary-foreground",
      success: "bg-green-500/10 text-green-600 dark:text-green-400",
      warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      danger: "bg-red-500/10 text-red-600 dark:text-red-400",
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
              {trend && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const reportesPorEstado = [
    { name: "Pendientes", value: stats.reportesPendientes, color: COLORS.warning },
    { name: "En Proceso", value: stats.reportesEnProceso, color: COLORS.primary },
    { name: "Resueltos", value: stats.reportesResueltos, color: COLORS.success },
  ];

  const prioridadLabels: Record<string, string> = {
    bajo: "Bajo",
    medio: "Medio",
    alto: "Alto",
    urgente: "Urgente",
  };

  const prioridadColors: Record<string, string> = {
    bajo: COLORS.secondary,
    medio: COLORS.primary,
    alto: COLORS.warning,
    urgente: COLORS.danger,
  };

  const reportesPorPrioridad = stats.reportesPorPrioridad.map((item) => ({
    name: prioridadLabels[item.prioridad] || item.prioridad,
    value: item.count,
    color: prioridadColors[item.prioridad] || COLORS.primary,
  }));

  const rolLabels: Record<string, string> = {
    usuario_regular: "Usuario",
    operador_analista: "Operador/Analista",
    administrador: "Administrador",
    mantenimiento: "Mantenimiento",
    estudiante_personal: "Estudiante/Personal",
    seguridad_uce: "Seguridad UCE",
  };

  const usuariosPorRol = stats.usuariosPorRol.map((item) => ({
    name: rolLabels[item.rol] || item.rol,
    value: item.count,
  }));

  return (
    <Layout title="Dashboard" icon={LayoutDashboard}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Métricas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Reportes"
            value={stats.totalReportes}
            icon={FileText}
            description="Reportes activos en el sistema"
            color="primary"
          />
          <StatCard
            title="Usuarios Activos"
            value={stats.usuariosActivos}
            icon={Users}
            description={`${stats.totalUsuarios} usuarios totales`}
            color="success"
          />
          <StatCard
            title="Publicaciones"
            value={stats.totalPublicaciones}
            icon={MessageSquare}
            description="En la red social"
            color="secondary"
          />
          <StatCard
            title="Conversaciones"
            value={stats.totalConversaciones}
            icon={MessageSquare}
            description="Chats activos"
            color="primary"
          />
        </div>

        {/* Estados de reportes */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Pendientes"
            value={stats.reportesPendientes}
            icon={AlertCircle}
            color="warning"
          />
          <StatCard
            title="En Proceso"
            value={stats.reportesEnProceso}
            icon={Clock}
            color="primary"
          />
          <StatCard
            title="Resueltos"
            value={stats.reportesResueltos}
            icon={CheckCircle2}
            color="success"
          />
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Reportes por día */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes - Últimos 7 días</CardTitle>
              <CardDescription>Tendencia de reportes creados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.reportesPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fecha" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Reportes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Reportes por estado */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>Reportes según su estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportesPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportesPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Reportes por prioridad */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes por Prioridad</CardTitle>
              <CardDescription>Distribución según nivel de prioridad</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportesPorPrioridad}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                    <Bar dataKey="value" name="Cantidad">
                      {reportesPorPrioridad.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Publicaciones por día */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Social - Últimos 7 días</CardTitle>
              <CardDescription>Publicaciones creadas por día</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.publicacionesPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fecha" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                    <Bar dataKey="count" fill={COLORS.secondary} name="Publicaciones" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usuarios por rol */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por Rol</CardTitle>
            <CardDescription>Distribución de usuarios según su rol en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={usuariosPorRol} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="value" fill={COLORS.accent} name="Usuarios" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
