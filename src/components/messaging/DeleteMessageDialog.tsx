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

interface DeleteMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteForEveryone: boolean) => void;
  isOwnMessage: boolean;
}

export const DeleteMessageDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isOwnMessage,
}: DeleteMessageDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar mensaje</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Cómo deseas eliminar este mensaje?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {isOwnMessage && (
            <AlertDialogAction
              onClick={() => {
                onConfirm(true);
                onOpenChange(false);
              }}
              className="w-full"
            >
              Eliminar para todos
            </AlertDialogAction>
          )}
          <button
            onClick={() => {
              onConfirm(false);
              onOpenChange(false);
            }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full"
          >
            Eliminar para mí
          </button>
          <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
