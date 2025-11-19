import { Shield, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

interface UserRolesProps {
  roles: string[];
  onRemoveRole: (role: string) => Promise<void>;
  onAddRole: (role: string) => Promise<void>;
  getRoleLabel: (role: string) => string;
  getRoleDescription: (role: string) => string;
  getAvailableRoles: () => string[];
}

export const UserRoles = ({
  roles,
  onRemoveRole,
  onAddRole,
  getRoleLabel,
  getRoleDescription,
  getAvailableRoles,
}: UserRolesProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles Asignados
          </CardTitle>
          <CardDescription>Roles actualmente asignados al usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay roles asignados</p>
          ) : (
            roles.map((role: string, idx: number) => {
              return (
                <div key={idx} className="flex items-start justify-between p-4 border rounded-lg bg-accent/20">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`h-3 w-3 rounded-full mt-1 ${
                      role === "administrador" ? "bg-destructive" :
                      role === "mantenimiento" ? "bg-primary" :
                      "bg-secondary"
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{getRoleLabel(role)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveRole(role)}
                    disabled={roles.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles Disponibles
          </CardTitle>
          <CardDescription>Roles que puedes asignar a este usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {getAvailableRoles().length === 0 ? (
            <p className="text-muted-foreground text-sm">Todos los roles están asignados</p>
          ) : (
            getAvailableRoles().map((role, idx) => {
              return (
                <div key={idx} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/10 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`h-3 w-3 rounded-full mt-1 ${
                      role === "administrador" ? "bg-destructive" :
                      role === "mantenimiento" ? "bg-primary" :
                      "bg-secondary"
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{getRoleLabel(role)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAddRole(role)}
                  >
                    + Asignar
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
};
