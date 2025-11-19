import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Calendar, TrendingUp, Clock, BarChart3, User } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface UserActivityStatsProps {
  userId: string;
  userEmail?: string;
  userCreatedAt?: string;
}

type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'LOGIN' | 'LOGOUT';

interface AuditLog {
  id: string;
  action: OperationType;
  tabla_afectada: string | null;
  created_at: string;
  user_id: string;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface ActivityTypeCount {
  name: string;
  value: number;
  color: string;
}

export const UserActivityStats = ({ userId, userEmail, userCreatedAt }: UserActivityStatsProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [userId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_audit')
        .select('id, action, tabla_afectada, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { locale: es });
    const weekEnd = endOfWeek(now, { locale: es });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const total = auditLogs.length;
    
    const today = auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= todayStart && logDate <= todayEnd;
    }).length;

    const thisWeek = auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= weekStart && logDate <= weekEnd;
    }).length;

    const thisMonth = auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= monthStart && logDate <= monthEnd;
    }).length;

    return { total, today, thisWeek, thisMonth };
  }, [auditLogs]);

  // Actividades por día (últimos 7 días)
  const dailyActivities = useMemo(() => {
    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    return last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const count = auditLogs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate <= dayEnd;
      }).length;

      return {
        date: format(day, 'dd/MM', { locale: es }),
        count
      };
    });
  }, [auditLogs]);

  // Tipos de actividad
  const activityTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    auditLogs.forEach(log => {
      const type = log.action;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'CREATE': '#10b981',
      'UPDATE': '#3b82f6',
      'DELETE': '#ef4444',
      'SOFT_DELETE': '#f97316',
      'LOGIN': '#8b5cf6',
      'LOGOUT': '#6b7280'
    };

    const labels: Record<string, string> = {
      'CREATE': 'Crear',
      'UPDATE': 'Actualizar',
      'DELETE': 'Eliminar',
      'SOFT_DELETE': 'Eliminación suave',
      'LOGIN': 'Inicio de sesión',
      'LOGOUT': 'Cierre de sesión'
    };

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: labels[type] || type,
      value: count,
      color: colors[type] || '#64748b'
    }));
  }, [auditLogs]);

  // Calcular días activos y promedio diario
  const userStats = useMemo(() => {
    if (!userCreatedAt) return { daysActive: 0, dailyAverage: 0 };

    const createdDate = new Date(userCreatedAt);
    const now = new Date();
    const daysActive = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = stats.total / daysActive;

    return { daysActive, dailyAverage };
  }, [userCreatedAt, stats.total]);

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold">{value}</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Actividades"
          value={stats.total}
          icon={Activity}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Hoy"
          value={stats.today}
          icon={Calendar}
          color="bg-green-500/10 text-green-600 dark:text-green-500"
        />
        <StatCard
          title="Esta Semana"
          value={stats.thisWeek}
          icon={TrendingUp}
          color="bg-orange-500/10 text-orange-600 dark:text-orange-500"
        />
        <StatCard
          title="Este Mes"
          value={stats.thisMonth}
          icon={Clock}
          color="bg-purple-500/10 text-purple-600 dark:text-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Activities Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Actividades por Día (Últimos 7 días)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActivities}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Types Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Tipos de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {activityTypes.length > 0 ? (
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No hay actividades registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Information */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Información del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3 min-w-0">
              <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="font-medium truncate">{userEmail || 'No disponible'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 min-w-0">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Usuario desde:</p>
                <p className="font-medium">
                  {userCreatedAt ? format(new Date(userCreatedAt), 'dd/MM/yyyy', { locale: es }) : 'No disponible'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 min-w-0">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Promedio diario:</p>
                <p className="font-medium">
                  {userStats.dailyAverage.toFixed(1)} actividades ({userStats.daysActive} {userStats.daysActive === 1 ? 'día' : 'días'} activo)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
