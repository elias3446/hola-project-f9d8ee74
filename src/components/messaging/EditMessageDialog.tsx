import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentContent: string;
  onSave: (newContent: string) => Promise<void>;
}

export const EditMessageDialog = ({
  open,
  onOpenChange,
  currentContent,
  onSave,
}: EditMessageDialogProps) => {
  const [content, setContent] = useState(currentContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      await onSave(content.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar mensaje</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="min-h-[100px]"
          autoFocus
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
