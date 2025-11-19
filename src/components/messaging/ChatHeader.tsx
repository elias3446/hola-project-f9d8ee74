import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupParticipantsDialog } from "./GroupParticipantsDialog";
import { GroupHistoryDialog } from "./GroupHistoryDialog";
import { EditGroupNameDialog } from "./EditGroupNameDialog";

interface ChatHeaderProps {
  name: string;
  avatar?: string | null;
  online?: boolean;
  isMuted?: boolean;
  isGroup?: boolean;
  conversationId?: string;
  isAdmin?: boolean;
  hasLeft?: boolean; // Si ya se salió del grupo
  onBack?: () => void;
  onViewProfile?: () => void;
  onMute?: () => void;
  onClearChat?: () => void;
  onLeaveGroup?: () => void;
  onDeleteConversation?: () => void; // Para eliminar de "Mis Grupos"
  onAddParticipant?: (conversationId: string, userId: string) => Promise<boolean>;
  onRemoveParticipant?: (conversationId: string, userId: string) => Promise<boolean>;
  onUpdateRole?: (conversationId: string, userId: string, role: 'miembro' | 'administrador') => Promise<boolean>;
  onUpdateGroupName?: (conversationId: string, newName: string) => Promise<boolean>;
}

export const ChatHeader = ({ 
  name, 
  avatar, 
  online, 
  isMuted,
  isGroup,
  conversationId,
  isAdmin,
  hasLeft,
  onBack, 
  onViewProfile,
  onMute,
  onClearChat,
  onLeaveGroup,
  onDeleteConversation,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateRole,
  onUpdateGroupName
}: ChatHeaderProps) => {
  const [showEditName, setShowEditName] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="border-b bg-background p-4 flex items-center gap-3">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 mr-2">
        <h3 className="font-semibold truncate text-sm sm:text-base">{name}</h3>
        {!isGroup && (
          <div className="flex items-center gap-1.5">
            {online && (
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            )}
            <p className="text-xs text-muted-foreground truncate">
              {online ? "En línea" : "Desconectado"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isGroup && conversationId && isAdmin && onUpdateGroupName && (
              <DropdownMenuItem onClick={() => setShowEditName(true)}>
                Cambiar nombre del grupo
              </DropdownMenuItem>
            )}
            {isGroup && conversationId && onAddParticipant && (
              <DropdownMenuItem onClick={() => setShowParticipants(true)}>
                Ver participantes
              </DropdownMenuItem>
            )}
            {isGroup && conversationId && (
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                Ver historial del grupo
              </DropdownMenuItem>
            )}
            {!isGroup && onViewProfile && (
              <DropdownMenuItem onClick={onViewProfile}>
                Ver perfil
              </DropdownMenuItem>
            )}
            {(isGroup || onViewProfile) && <DropdownMenuSeparator />}
            {onMute && (
              <DropdownMenuItem onClick={onMute}>
                {isMuted ? "Activar sonido" : "Silenciar"}
              </DropdownMenuItem>
            )}
            {onClearChat && (
              <DropdownMenuItem onClick={onClearChat}>
                Limpiar chat
              </DropdownMenuItem>
            )}
            {isGroup && (onLeaveGroup || onDeleteConversation) && (
              <>
                <DropdownMenuSeparator />
                {hasLeft && onDeleteConversation ? (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={onDeleteConversation}
                  >
                    Eliminar conversación
                  </DropdownMenuItem>
                ) : onLeaveGroup ? (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={onLeaveGroup}
                  >
                    Salir del grupo
                  </DropdownMenuItem>
                ) : null}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs controlados por estado */}
      {isGroup && conversationId && isAdmin && onUpdateGroupName && showEditName && (
        <EditGroupNameDialog
          conversationId={conversationId}
          currentName={name}
          onUpdateName={onUpdateGroupName}
          open={showEditName}
          onOpenChange={setShowEditName}
        />
      )}
      {isGroup && conversationId && onAddParticipant && showParticipants && (
        <GroupParticipantsDialog
          conversationId={conversationId}
          isAdmin={isAdmin || false}
          onAddParticipant={onAddParticipant}
          onRemoveParticipant={onRemoveParticipant!}
          onUpdateRole={onUpdateRole!}
          open={showParticipants}
          onOpenChange={setShowParticipants}
        />
      )}
      {isGroup && conversationId && showHistory && (
        <GroupHistoryDialog
          conversationId={conversationId}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      )}
    </div>
  );
};
