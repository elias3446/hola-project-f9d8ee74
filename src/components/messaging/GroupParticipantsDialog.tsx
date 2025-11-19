import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Loader2, UserPlus, UserMinus, Crown, Shield } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Participant {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  role: 'miembro' | 'administrador';
}

interface GroupParticipantsDialogProps {
  conversationId: string;
  isAdmin: boolean;
  onAddParticipant: (conversationId: string, userId: string) => Promise<boolean>;
  onRemoveParticipant: (conversationId: string, userId: string) => Promise<boolean>;
  onUpdateRole: (conversationId: string, userId: string, role: 'miembro' | 'administrador') => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GroupParticipantsDialog = ({
  conversationId,
  isAdmin,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateRole,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: GroupParticipantsDialogProps) => {
  const { profile } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [userToRemove, setUserToRemove] = useState<Participant | null>(null);
  const [processing, setProcessing] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const { users, loading: searchLoading } = useUserSearch(searchTerm);

  // Fetch participant count on mount and when conversation changes
  useEffect(() => {
    const fetchParticipantCount = async () => {
      try {
        const { data } = await supabase
          .from("participantes_conversacion")
          .select("user_id")
          .eq("conversacion_id", conversationId)
          .is("hidden_at", null);
        
        const uniqueCount = new Set((data || []).map((d: { user_id: string }) => d.user_id)).size;
        setParticipantCount(uniqueCount);
      } catch (error) {
        console.error("Error fetching participant count:", error);
      }
    };

    fetchParticipantCount();

    // Subscribe to changes
    const channel = supabase
      .channel(`participants-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participantes_conversacion',
          filter: `conversacion_id=eq.${conversationId}`
        },
        () => {
          fetchParticipantCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      // Get conversation creator
      const { data: convData } = await supabase
        .from("conversaciones")
        .select("created_by")
        .eq("id", conversationId)
        .single();

      if (convData) {
        setCreatorId(convData.created_by);
      }

      // Get participants
      const { data: participantData } = await supabase
        .from("participantes_conversacion")
        .select("user_id, role")
        .eq("conversacion_id", conversationId)
        .is("hidden_at", null);

      if (participantData) {
        const userIds = participantData.map((p) => p.user_id);
        
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, username, avatar")
          .in("id", userIds);

        if (profilesData) {
          const participantsWithRoles = profilesData.map((profile) => {
            const participant = participantData.find((p) => p.user_id === profile.id);
            return {
              ...profile,
              role: participant?.role || 'miembro',
            };
          });
          setParticipants(participantsWithRoles);
          setParticipantCount(participantsWithRoles.length);
        }
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Error al cargar participantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchParticipants();
    }
  }, [open, conversationId]);

  const handleAddUser = async (userId: string, username: string) => {
    setProcessing(true);
    try {
      const success = await onAddParticipant(conversationId, userId);
      if (success) {
        toast.success(`@${username} agregado al grupo`);
        fetchParticipants();
        setSearchTerm("");
        setShowAddUsers(false);
      } else {
        toast.error("Error al agregar participante");
      }
    } catch (error) {
      toast.error("Error al agregar participante");
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string, username: string) => {
    setProcessing(true);
    try {
      const success = await onUpdateRole(conversationId, userId, 'administrador');
      if (success) {
        toast.success(`@${username} es ahora administrador`);
        fetchParticipants();
      } else {
        toast.error("Error al promover a administrador");
      }
    } catch (error) {
      toast.error("Error al promover a administrador");
    } finally {
      setProcessing(false);
    }
  };

  const handleDemoteFromAdmin = async (userId: string, username: string) => {
    setProcessing(true);
    try {
      const success = await onUpdateRole(conversationId, userId, 'miembro');
      if (success) {
        toast.success(`@${username} es ahora miembro`);
        fetchParticipants();
      } else {
        toast.error("Error al cambiar rol");
      }
    } catch (error) {
      toast.error("Error al cambiar rol");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveUser = async () => {
    
    setProcessing(true);
    try {
      const success = await onRemoveParticipant(conversationId, userToRemove.id);
      if (success) {
        toast.success("Participante removido del grupo");
        fetchParticipants();
        setUserToRemove(null);
      } else {
        toast.error("Error al remover participante");
      }
    } catch (error) {
      toast.error("Error al remover participante");
    } finally {
      setProcessing(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.startsWith("@")) {
      value = value.substring(1);
    }
    setSearchTerm(value);
  };

  const availableUsers = users.filter(
    (user) => !participants.some((p) => p.id === user.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <Users className="h-4 w-4 mr-2" />
            Participantes ({participantCount})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participantes del Grupo</DialogTitle>
          </DialogHeader>

          {!showAddUsers ? (
            <div className="space-y-4">
              {isAdmin && (
                <Button
                  onClick={() => setShowAddUsers(true)}
                  variant="outline"
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Participantes
                </Button>
              )}

              <ScrollArea className="h-[400px] border rounded-lg">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.avatar || undefined} />
                          <AvatarFallback>
                            {(participant.name || participant.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-2">
                            {participant.name || participant.username}
                            {participant.id === creatorId && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            {participant.role === 'administrador' && participant.id !== creatorId && (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{participant.username}
                            {participant.role === 'administrador' && ' • Administrador'}
                          </p>
                        </div>
                        {isAdmin && participant.id !== profile?.id && participant.id !== creatorId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={processing}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {participant.role === 'miembro' ? (
                                <DropdownMenuItem 
                                  onClick={() => handlePromoteToAdmin(participant.id, participant.username || '')}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Promover a Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleDemoteFromAdmin(participant.id, participant.username || '')}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Quitar Admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setUserToRemove(participant)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remover del Grupo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setShowAddUsers(false);
                  setSearchTerm("");
                }}
                variant="outline"
                className="w-full"
              >
                Volver a Participantes
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm ? `@${searchTerm}` : ""}
                  onChange={handleSearchChange}
                  placeholder="@usuario"
                  className="pl-9"
                  disabled={processing}
                />
              </div>

              <ScrollArea className="h-[350px] border rounded-lg">
                {searchLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : availableUsers.length === 0 && searchTerm ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron usuarios disponibles
                    </p>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Search className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Busca usuarios para agregar al grupo
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() =>
                          handleAddUser(user.id, user.username || user.name || "")
                        }
                        disabled={processing}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {(user.name || user.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.name || user.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                        <UserPlus className="h-4 w-4 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToRemove}
        onOpenChange={(open) => !open && setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover participante?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de remover a {userToRemove?.name || userToRemove?.username} del grupo?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removiendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
