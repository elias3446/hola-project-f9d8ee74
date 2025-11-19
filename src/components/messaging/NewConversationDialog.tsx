import { useState, useRef, useEffect } from "react";
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
import { MessageSquarePlus, Search, Loader2 } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { toast } from "sonner";

interface NewConversationDialogProps {
  onCreateConversation: (userId: string) => Promise<string | null>;
}

export const NewConversationDialog = ({
  onCreateConversation,
}: NewConversationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { users, loading } = useUserSearch(searchTerm);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelectUser = async (userId: string, username: string) => {
    setCreating(true);
    try {
      const conversationId = await onCreateConversation(userId);
      if (conversationId) {
        toast.success(`Conversación con @${username} creada`);
        setOpen(false);
        setSearchTerm("");
      } else {
        toast.error("Error al crear conversación");
      }
    } catch (error) {
      toast.error("Error al crear conversación");
    } finally {
      setCreating(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow @ prefix but don't require it
    if (value.startsWith("@")) {
      value = value.substring(1);
    }
    
    setSearchTerm(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="default">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Conversación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchTerm ? `@${searchTerm}` : ""}
              onChange={handleSearchChange}
              placeholder="@usuario"
              className="pl-9"
              disabled={creating}
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 && searchTerm ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-sm text-muted-foreground">
                  No se encontraron usuarios
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Search className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Busca un usuario para iniciar una conversación
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id, user.username || user.name || "")}
                    disabled={creating}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {(user.name || user.username || "U").charAt(0).toUpperCase()}
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
                    {creating && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
