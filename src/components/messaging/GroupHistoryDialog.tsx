import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, Loader2, UserPlus, UserMinus, Shield, Crown, FileText, Edit } from "lucide-react";
import { useGroupHistory } from "@/hooks/useGroupHistory";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GroupHistoryDialogProps {
  conversationId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GroupHistoryDialog = ({ 
  conversationId, 
  open: externalOpen,
  onOpenChange: externalOnOpenChange 
}: GroupHistoryDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  const { history, loading } = useGroupHistory(open ? conversationId : null);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'member_added':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'member_removed':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'member_promoted':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member_demoted':
        return <Shield className="h-4 w-4 text-gray-500" />;
      case 'group_created':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'group_renamed':
        return <Edit className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionText = (event: typeof history[0]) => {
    const performerName = event.performer?.name || event.performer?.username || 'Alguien';
    const affectedName = event.affected_user?.name || event.affected_user?.username || 'un usuario';

    switch (event.action_type) {
      case 'member_added':
        return (
          <>
            <span className="font-medium">{performerName}</span> agregó a{' '}
            <span className="font-medium">{affectedName}</span> al grupo
          </>
        );
      case 'member_removed':
        return (
          <>
            <span className="font-medium">{performerName}</span> removió a{' '}
            <span className="font-medium">{affectedName}</span> del grupo
          </>
        );
      case 'member_promoted':
        return (
          <>
            <span className="font-medium">{performerName}</span> promovió a{' '}
            <span className="font-medium">{affectedName}</span> a administrador
          </>
        );
      case 'member_demoted':
        return (
          <>
            <span className="font-medium">{performerName}</span> quitó el rol de administrador a{' '}
            <span className="font-medium">{affectedName}</span>
          </>
        );
      case 'group_created':
        return (
          <>
            <span className="font-medium">{performerName}</span> creó el grupo
          </>
        );
      case 'group_renamed':
        return (
          <>
            <span className="font-medium">{performerName}</span> cambió el nombre del grupo a{' '}
            <span className="font-medium">{event.new_value}</span>
          </>
        );
      default:
        return <span>Acción desconocida</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <History className="h-4 w-4 mr-2" />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial del Grupo
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <History className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay historial de cambios
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(event.action_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm leading-relaxed">
                      {getActionText(event)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {event.performer && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={event.performer.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(event.performer.name || event.performer.username || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
