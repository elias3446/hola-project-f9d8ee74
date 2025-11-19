import { Mail, Calendar, Clock, AlertCircle, CheckCircle, Lock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";

interface UserSidebarProps {
  user: any;
  getInitials: (name: string) => string;
  getUserType: (userRoles: any) => string;
  handleToggleStatus: () => Promise<void>;
  handleToggleBlock: () => Promise<void>;
  handleResendConfirmation: () => Promise<void>;
  updatingStatus: boolean;
  blockingUser: boolean;
  resendingEmail: boolean;
}

export const UserSidebar = ({
  user,
  getInitials,
  getUserType,
  handleToggleStatus,
  handleToggleBlock,
  handleResendConfirmation,
  updatingStatus,
  blockingUser,
  resendingEmail,
}: UserSidebarProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center space-y-4">
          <UserAvatar
            avatar={user.avatar}
            name={user.name}
            email={user.email}
            username={user.username}
            size="lg"
            className="justify-center"
          />
          <div>
            <h2 className="text-xl font-bold">{user.name || user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-start gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Registrado</p>
              <p className="font-medium">
                {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "-"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Actualizado</p>
              <p className="font-medium">
                {user.updated_at ? format(new Date(user.updated_at), "dd/MM/yyyy") : "-"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            {user.confirmed ? (
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Estado de confirmación</p>
              <p className="font-medium">{user.confirmed ? "Email confirmado" : "Email no confirmado"}</p>
            </div>
          </div>
        </div>

        {/* Tipo de Usuario */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Tipo de Usuario</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {getUserType(user.user_roles)}
          </Badge>
        </div>

        {/* Estado del Usuario */}
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm font-semibold">Estado del Usuario</p>
          {user.estado !== "bloqueado" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${user.estado === "activo" ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-sm">{user.estado === "activo" ? "Activo" : "Inactivo"}</span>
              </div>
              <Switch
                checked={user.estado === "activo"}
                onCheckedChange={handleToggleStatus}
                disabled={updatingStatus}
              />
            </div>
          )}
          <Button
            variant={user.estado === "bloqueado" ? "outline" : "destructive"}
            className="w-full"
            onClick={handleToggleBlock}
            disabled={blockingUser}
          >
            <Lock className="h-4 w-4 mr-2" />
            {blockingUser ? "Procesando..." : user.estado === "bloqueado" ? "Desbloquear Usuario" : "Bloquear Usuario"}
          </Button>
        </div>

        {/* Email no confirmado */}
        {!user.confirmed && (
          <div className="pt-4 border-t space-y-3">
            <p className="text-sm font-semibold">Email no confirmado</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendConfirmation}
              disabled={resendingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {resendingEmail ? "Reenviando..." : "Reenviar Confirmación"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
