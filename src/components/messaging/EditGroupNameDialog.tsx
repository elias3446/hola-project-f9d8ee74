import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditGroupNameDialogProps {
  conversationId: string;
  currentName: string;
  onUpdateName: (conversationId: string, newName: string) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const EditGroupNameDialog = ({
  conversationId,
  currentName,
  onUpdateName,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: EditGroupNameDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [processing, setProcessing] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim() || newName.trim() === currentName) {
      toast.error("Por favor ingresa un nombre diferente");
      return;
    }

    if (newName.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    setProcessing(true);
    try {
      const success = await onUpdateName(conversationId, newName.trim());
      if (success) {
        toast.success("Nombre del grupo actualizado");
        setOpen(false);
      } else {
        toast.error("Error al actualizar el nombre del grupo");
      }
    } catch (error) {
      toast.error("Error al actualizar el nombre del grupo");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Edit className="h-4 w-4 mr-2" />
          Editar Nombre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Nombre del Grupo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre del Grupo</Label>
            <Input
              id="group-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ingresa el nuevo nombre"
              disabled={processing}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 3 caracteres, máximo 100
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
