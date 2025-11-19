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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Loader2, X } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface NewGroupDialogProps {
  onCreateGroup: (userIds: string[], groupName: string) => Promise<string | null>;
}

export const NewGroupDialog = ({ onCreateGroup }: NewGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; name: string; username: string; avatar?: string }>>([]);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { users, loading } = useUserSearch(searchTerm);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleToggleUser = (user: { id: string; name: string | null; username: string | null; avatar: string | null }) => {
    const userInfo = {
      id: user.id,
      name: user.name || user.username || "Usuario",
      username: user.username || "",
      avatar: user.avatar || undefined,
    };

    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, userInfo];
    });
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Ingresa un nombre para el grupo");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Selecciona al menos un participante");
      return;
    }

    setCreating(true);
    try {
      const conversationId = await onCreateGroup(
        selectedUsers.map((u) => u.id),
        groupName.trim()
      );
      
      if (conversationId) {
        toast.success("Grupo creado exitosamente");
        setOpen(false);
        setSearchTerm("");
        setGroupName("");
        setSelectedUsers([]);
      } else {
        toast.error("Error al crear el grupo");
      }
    } catch (error) {
      toast.error("Error al crear el grupo");
    } finally {
      setCreating(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.startsWith("@")) {
      value = value.substring(1);
    }
    setSearchTerm(value);
  };

  const isUserSelected = (userId: string) => selectedUsers.some((u) => u.id === userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Users className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre del Grupo</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Proyecto UCE"
              disabled={creating}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes seleccionados ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      disabled={creating}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="search-users">Buscar Usuarios</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                id="search-users"
                value={searchTerm ? `@${searchTerm}` : ""}
                onChange={handleSearchChange}
                placeholder="@usuario"
                className="pl-9"
                disabled={creating}
              />
            </div>
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
                  Busca usuarios para agregar al grupo
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={isUserSelected(user.id)}
                      onCheckedChange={() => handleToggleUser(user)}
                      disabled={creating}
                    />
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
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>Crear Grupo ({selectedUsers.length})</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
