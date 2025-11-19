import { useState, useEffect } from "react";
import { Bell, Check, Trash2, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: string;
}

interface NotificationsDropdownProps {
  count: number;
  onCountChange?: () => void;
}

export const NotificationsDropdown = ({ count, onCountChange }: NotificationsDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Obtener el perfil del usuario
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
        .eq("read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();

    // Suscripción en tiempo real a cambios en notificaciones
    const channel = supabase
      .channel('notifications-dropdown-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
          onCountChange?.();
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
      onCountChange?.();
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
        onCountChange?.();
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
        onCountChange?.();
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
      onCountChange?.();
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
      onCountChange?.();
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
    // Seleccionar TODAS las notificaciones
    const allNotificationIds = notifications.map(n => n.id);
    const allSelected = allNotificationIds.length > 0 && allNotificationIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allNotificationIds);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMs = now.getTime() - notifDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Hoy";
    if (diffInDays === 1) return "Hace 1 día";
    return `Hace ${diffInDays} días`;
  };

  const getNotificationBadge = (type?: string) => {
    if (!type) return null;
    
    const badges: Record<string, { text: string; variant: "default" | "secondary" | "outline" }> = {
      "profile": { text: "perfil actualizado", variant: "secondary" },
      "report": { text: "reporte asignado", variant: "outline" },
      "message": { text: "nuevo mensaje", variant: "default" },
    };

    const badge = badges[type] || { text: type, variant: "default" as const };
    
    return (
      <Badge variant={badge.variant} className="text-xs hidden sm:inline-flex">
        {badge.text}
      </Badge>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors">
          <Bell className="h-5 w-5 text-foreground" />
          {count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] flex items-center justify-center p-0 px-1 text-[10px] font-semibold"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 bg-background z-[1200]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold text-sm sm:text-base">Notificaciones</h3>
            {count > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </div>
          {selectedIds.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="text-xs"
            >
              <Check className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Marcar leídas</span>
            </Button>
          ) : count > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="text-xs"
            >
              <Check className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Marcar todas</span>
            </Button>
          ) : null}
        </div>

        {/* Selection controls */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.length === notifications.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-[11px] sm:text-sm text-muted-foreground">
                {selectedIds.length > 0 ? `${selectedIds.length} de ${notifications.length} seleccionadas` : "Seleccionar todas"}
              </span>
            </div>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={loading}
                className="h-7"
              >
                <Trash2 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            )}
          </div>
        )}

        {/* Notifications list */}
        <ScrollArea className="h-[300px] sm:h-[400px]">
            {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">No hay notificaciones sin leer</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Checkbox
                      checked={selectedIds.includes(notification.id)}
                      onCheckedChange={() => toggleSelect(notification.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {getNotificationBadge(notification.type)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-between hover:bg-muted/50"
              onClick={() => {
                setOpen(false);
                setTimeout(() => navigate("/notificaciones"), 100);
              }}
            >
              <span className="text-sm">Ver todas las notificaciones</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
