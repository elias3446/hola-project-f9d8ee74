import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthor: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam o contenido engañoso" },
  { value: "harassment", label: "Acoso o intimidación" },
  { value: "hate", label: "Discurso de odio" },
  { value: "violence", label: "Violencia o contenido peligroso" },
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "other", label: "Otro" },
];

export const ReportPostDialog = ({ open, onOpenChange, postId, postAuthor }: ReportPostDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Por favor selecciona una razón");
      return;
    }

    // Here you would typically send the report to your backend
    console.log("Report submitted:", { postId, reason, details });
    toast.success("Reporte enviado exitosamente");
    onOpenChange(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reportar publicación de {postAuthor}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>¿Por qué reportas esta publicación?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details">Detalles adicionales (opcional)</Label>
            <Textarea
              id="details"
              placeholder="Proporciona más información sobre el problema..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="resize-none mt-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!reason}>
              Enviar reporte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
