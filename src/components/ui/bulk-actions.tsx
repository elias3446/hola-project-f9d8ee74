import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  onClick: () => void;
  dropdown?: {
    label: string;
    icon?: ReactNode;
    variant?: "default" | "destructive";
    onClick: () => void;
  }[];
}

interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
  className?: string;
}

export const BulkActions = ({
  selectedCount,
  onClear,
  actions,
  className,
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  // On mobile, show only icons in a compact menu
  const isManyActions = actions.length > 3;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/50 border rounded-lg shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
          {selectedCount} {selectedCount === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 sm:h-8 gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Limpiar</span>
        </Button>
      </div>

      {/* Mobile: Use dropdown menu if many actions, otherwise show icons only */}
      <div className="flex sm:hidden items-center justify-end gap-2 flex-wrap">
        {isManyActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
              >
                Acciones ({actions.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-50">
              {actions.map((action, index) => {
                if (action.dropdown) {
                  return action.dropdown.map((dropdownItem, dropdownIndex) => (
                    <DropdownMenuItem
                      key={`${index}-${dropdownIndex}`}
                      onClick={dropdownItem.onClick}
                      className={cn(
                        "gap-2 cursor-pointer",
                        dropdownItem.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {dropdownItem.icon}
                      {dropdownItem.label}
                    </DropdownMenuItem>
                  ));
                }
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      "gap-2 cursor-pointer",
                      action.variant === "destructive" &&
                        "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          actions.map((action, index) => {
            if (action.dropdown) {
              return (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={action.variant || "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={action.label}
                    >
                      {action.icon}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                    {action.dropdown.map((dropdownItem, dropdownIndex) => (
                      <DropdownMenuItem
                        key={dropdownIndex}
                        onClick={dropdownItem.onClick}
                        className={cn(
                          "gap-2 cursor-pointer",
                          dropdownItem.variant === "destructive" &&
                            "text-destructive focus:text-destructive"
                        )}
                      >
                        {dropdownItem.icon}
                        {dropdownItem.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className="h-8 w-8 p-0"
                title={action.label}
              >
                {action.icon}
              </Button>
            );
          })
        )}
      </div>

      {/* Desktop: Show full buttons with labels */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {actions.map((action, index) => {
          if (action.dropdown) {
            return (
              <DropdownMenu key={index}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={action.variant || "outline"}
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                  {action.dropdown.map((dropdownItem, dropdownIndex) => (
                    <DropdownMenuItem
                      key={dropdownIndex}
                      onClick={dropdownItem.onClick}
                      className={cn(
                        "gap-2 cursor-pointer",
                        dropdownItem.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {dropdownItem.icon}
                      {dropdownItem.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              className="h-9 gap-2 text-sm"
            >
              {action.icon}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
