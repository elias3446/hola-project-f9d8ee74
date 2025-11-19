import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  enableModal?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-20 w-20 text-2xl",
};

export const UserAvatar = ({
  avatar,
  name,
  email,
  username,
  size = "md",
  showName = false,
  className,
  enableModal = true,
}: UserAvatarProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getInitials = (displayName: string | null) => {
    if (!displayName) return username?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "U";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = name || username || "Usuario";

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (enableModal) {
      e.stopPropagation();
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-3", className)}>
        <Avatar
          className={cn(
            sizeClasses[size],
            enableModal && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={handleAvatarClick}
        >
          <AvatarImage src={avatar || undefined} alt={displayName} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>

        {showName && (
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-sm font-medium truncate text-foreground">
              {displayName}
            </p>
            {email && (
              <p className="text-xs text-muted-foreground truncate">
                {email}
              </p>
            )}
          </div>
        )}
      </div>

      {enableModal && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{displayName}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="max-w-full max-h-[70vh] rounded-lg object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-64 h-64 rounded-lg bg-muted">
                  <span className="text-8xl font-semibold text-muted-foreground">
                    {getInitials(name)}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
