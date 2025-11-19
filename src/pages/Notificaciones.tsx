import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Bell, Check, Trash2, Calendar, Filter, Inbox, CheckCircle2, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: string;
  data?: any;
}

const Notificaciones = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();

    // Suscripción en tiempo real a cambios en notificaciones
    const channel = supabase
      .channel('notifications-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;
      
      await fetchNotifications();
      toast.success("Notificación marcada como leída");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Error al marcar como leída");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Si hay seleccionadas, solo marcar esas
      if (selectedIds.length > 0) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .in("id", selectedIds);

        if (error) throw error;
        
        setSelectedIds([]);
        await fetchNotifications();
        toast.success(`${selectedIds.length} notificaciones marcadas como leídas`);
      } else {
        // Si no hay seleccionadas, marcar todas las no leídas
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) return;

        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", profile.id)
          .eq("read", false);

        if (error) throw error;
        
        await fetchNotifications();
        toast.success("Todas las notificaciones marcadas como leídas");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Error al marcar como leídas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await fetchNotifications();
      toast.success("Notificación eliminada");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      
      setSelectedIds([]);
      await fetchNotifications();
      toast.success(`${selectedIds.length} notificaciones eliminadas`);
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    // Seleccionar TODAS las notificaciones (de todas las páginas)
    const allNotificationIds = filteredNotifications.map(n => n.id);
    const allSelected = allNotificationIds.length > 0 && allNotificationIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allNotificationIds);
    }
  };

  const getNotificationBadge = (type?: string) => {
    if (!type) return null;
    
    const badges: Record<string, { text: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
      "asignacion": { text: "Asignación", variant: "default", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
      "actualizacion": { text: "Actualización", variant: "secondary", color: "bg-green-500/10 text-green-600 border-green-200" },
      "advertencia": { text: "Advertencia", variant: "destructive", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
      "informacion": { text: "Información", variant: "outline", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
    };

    const badge = badges[type] || { text: type, variant: "outline" as const, color: "bg-muted text-muted-foreground" };
    
    return (
      <Badge variant={badge.variant} className={`text-xs border ${badge.color}`}>
        {badge.text}
      </Badge>
    );
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter(n => !n.read);
    if (activeTab === "read") return notifications.filter(n => n.read);
    return notifications;
  }, [notifications, activeTab]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    const newTotalPages = Math.ceil(notifications.length / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredNotifications.length, activeTab]);

  return (
    <Layout title="Notificaciones" icon={Bell}>
      <div className="w-full space-y-6">
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Centro de Notificaciones</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Mantente al día con todas tus actualizaciones y mensajes importantes
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={loading}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar ({selectedIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como leídas
                  </Button>
                </>
              )}
              {unreadCount > 0 && selectedIds.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notifications.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Notificaciones totales</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Sin leer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Leídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{readCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Completadas</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger value="all" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Todas</span>
              <span className="hidden xs:inline">({notifications.length})</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Sin leer</span>
              <span className="hidden xs:inline">({unreadCount})</span>
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Leídas</span>
              <span className="hidden xs:inline">({readCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {/* Selection controls */}
            {filteredNotifications.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={filteredNotifications.length > 0 && filteredNotifications.every(n => selectedIds.includes(n.id))}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        {selectedIds.length > 0 
                          ? `${selectedIds.length} de ${filteredNotifications.length} notificaciones seleccionadas` 
                          : "Seleccionar todas"}
                      </span>
                    </div>
                    {selectedIds.length > 0 && (
                      <Badge variant="secondary" className="font-semibold">
                        {selectedIds.length} seleccionadas
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications list */}
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  {activeTab === "all" ? (
                    <>
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <Bell className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No hay notificaciones</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Cuando recibas notificaciones importantes, aparecerán aquí para que puedas mantenerte informado
                      </p>
                    </>
                  ) : activeTab === "unread" ? (
                    <>
                      <div className="p-4 rounded-full bg-green-500/10 mb-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">¡Estás al día!</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        No tienes notificaciones pendientes. Has revisado todo
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <Archive className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Sin notificaciones leídas</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Las notificaciones que marques como leídas aparecerán aquí
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedData.map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`transition-all hover:shadow-md ${!notification.read ? "bg-primary/5 border-l-4 border-l-primary shadow-sm" : ""}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedIds.includes(notification.id)}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            className="mt-1.5"
                          />
                          
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-base break-words">{notification.title}</h4>
                                  {!notification.read && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      NUEVO
                                    </Badge>
                                  )}
                                </div>
                                {getNotificationBadge(notification.type)}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed break-words">
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                  {format(new Date(notification.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Marcar como leída
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {filteredNotifications.length > 0 && (
                  <DataTablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredNotifications.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notificaciones;
