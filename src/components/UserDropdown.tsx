import { User, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";

interface UserDropdownProps {
  showInfo?: boolean;
  isCollapsed?: boolean;
  onMenuClose?: () => void;
}

export const UserDropdown = ({ showInfo = false, isCollapsed = false, onMenuClose }: UserDropdownProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    onMenuClose?.();
  };

  const handleProfileClick = () => {
    navigate("/perfil");
    onMenuClose?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`flex items-center gap-2 px-2 rounded-md hover:bg-sidebar-accent transition-colors ${
            showInfo ? 'w-full py-2' : 'py-1.5'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <UserAvatar
            avatar={profile?.avatar}
            name={profile?.name}
            email={profile?.email || user?.email}
            username={profile?.username}
            size="sm"
            showName={showInfo && !isCollapsed}
            enableModal={false}
          />
          
          {showInfo && !isCollapsed && (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
          )}
          
          {!showInfo && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 z-[1200]">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="h-4 w-4 mr-2" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
