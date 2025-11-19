import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Trash2, MoreVertical } from "lucide-react";
import { Conversation } from "@/hooks/useConversations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConversationsListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onLeaveGroup?: (id: string) => void;
  showingGroups?: boolean;
}

export const ConversationsList = ({
  conversations,
  loading,
  selectedId,
  onSelect,
  onDeleteConversation,
  onLeaveGroup,
  showingGroups = false,
}: ConversationsListProps) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sin conversaciones</h3>
        <p className="text-sm text-muted-foreground">
          Busca usuarios para iniciar una conversación
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => {
          const displayName = conv.es_grupo
            ? conv.nombre || "Grupo sin nombre"
            : conv.participante?.name || conv.participante?.username || "Usuario";

          const displayAvatar = conv.participante?.avatar;

          return (
            <div
              key={conv.id}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent relative group",
                selectedId === conv.id && "bg-accent"
              )}
            >
              <button
                onClick={() => onSelect(conv.id)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={displayAvatar || undefined} />
                  <AvatarFallback>
                    {conv.es_grupo ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                {!conv.es_grupo && conv.participante?.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {displayName}
                    </span>
                    {conv.es_grupo && conv.hidden_from_all && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                        Oculto de Todos
                      </Badge>
                    )}
                    {conv.hidden && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                        Saliste del grupo
                      </Badge>
                    )}
                  </div>
                  {conv.ultimo_mensaje && (
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.ultimo_mensaje.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate flex-1",
                    conv.ultimo_mensaje?.deleted_at 
                      ? "text-muted-foreground/70 italic" 
                      : "text-muted-foreground"
                  )}>
                    {conv.ultimo_mensaje?.deleted_at 
                      ? "Este mensaje fue eliminado"
                      : conv.ultimo_mensaje?.contenido || "Sin mensajes"}
                  </p>
                  {conv.unread_count > 0 && (
                    <Badge
                      variant="default"
                      className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-xs"
                    >
                      {conv.unread_count > 99 ? "99+" : conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
              </button>
              
              {/* Delete/Leave menu */}
              {(onDeleteConversation || (onLeaveGroup && conv.es_grupo)) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {showingGroups && conv.es_grupo && conv.hidden && onDeleteConversation ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar conversación
                      </DropdownMenuItem>
                    ) : showingGroups && conv.es_grupo && onLeaveGroup ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeaveGroup(conv.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Salir del grupo
                      </DropdownMenuItem>
                    ) : onDeleteConversation ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar conversación
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
