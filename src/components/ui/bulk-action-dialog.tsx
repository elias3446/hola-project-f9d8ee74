import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, LucideIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface BulkActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: string;
  metadata?: Record<string, any>;
}

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedOptions?: string[]) => void;
  title: string;
  description: string;
  icon?: LucideIcon;
  items: BulkActionItem[];
  itemsLabel?: string;
  warning?: {
    title: string;
    description: string;
  };
  options?: {
    id: string;
    label: string;
    icon?: ReactNode;
    color?: string;
  }[];
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  multiSelect?: boolean; // Allow multiple selections (default: true)
  onRemoveItem?: (itemId: string) => void;
}

export const BulkActionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  icon: Icon,
  items,
  itemsLabel,
  warning,
  options,
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  loading = false,
  multiSelect = true,
  onRemoveItem,
}: BulkActionDialogProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const handleConfirm = () => {
    onConfirm(options ? selectedOptions : undefined);
  };

  const toggleOption = (optionId: string) => {
    if (multiSelect) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single select mode - replace selection
      setSelectedOptions([optionId]);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Items List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2 flex-wrap">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-foreground text-xs font-semibold shrink-0">
            {items.length}
          </span>
          <span className="break-words">
            {itemsLabel || `${items.length === 1 ? "Elemento afectado" : "Elementos afectados"}`} ({items.length}):
          </span>
        </h4>
        <div className="rounded-lg border bg-muted/30 p-2 sm:p-3 max-h-[200px] overflow-y-auto space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-2 sm:gap-3 rounded-md bg-background p-2 sm:p-3 border"
            >
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                <AvatarFallback
                  className="text-xs sm:text-sm font-semibold"
                  style={{
                    backgroundColor: item.color ? `${item.color}20` : undefined,
                    color: item.color || undefined,
                  }}
                >
                  {item.icon || item.label.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium break-words">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground break-words">
                    {item.description}
                  </p>
                )}
              </div>
              {item.status && (
                <Badge variant="secondary" className="shrink-0 text-xs whitespace-nowrap">
                  {item.status}
                </Badge>
              )}
              {onRemoveItem && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning Alert */}
      {warning && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{warning.title}</p>
              <p className="text-xs sm:text-sm">{warning.description}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Options Selection */}
      {options && options.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seleccionar opciones:</Label>
          <div className="rounded-lg border bg-muted/30 p-2 sm:p-3 max-h-[200px] overflow-y-auto space-y-2">
            {options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 cursor-pointer transition-colors bg-background",
                  selectedOptions.includes(option.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => toggleOption(option.id)}
              >
                <Checkbox
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                  className="shrink-0 mt-0.5"
                />
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <div className="shrink-0">
                    {option.icon}
                  </div>
                  <Label
                    className="cursor-pointer font-medium text-sm break-words"
                    style={{ color: option.color }}
                  >
                    {option.label}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Children Content */}
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                      variant === "destructive"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <DrawerTitle className="text-lg truncate">{title}</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-muted-foreground text-sm">
              {description}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {content}
          </div>

          <DrawerFooter className="pt-2">
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={loading || (options && selectedOptions.length === 0)}
              className="w-full"
            >
              {loading ? "Procesando..." : confirmText}
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                {cancelText}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {content}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading || (options && selectedOptions.length === 0)}
          >
            {loading ? "Procesando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
