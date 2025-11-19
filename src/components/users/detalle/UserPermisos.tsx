import { Settings as SettingsIcon, X, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserPermisosProps {
  permisos: string[];
  onTogglePermission: (permission: string) => Promise<void>;
  onToggleAllCategory: (category: string) => Promise<void>;
  getPermissionsByCategory: () => Record<string, string[]>;
  getCategoryLabel: (category: string) => string;
  getPermissionLabel: (permission: string) => string;
}

export const UserPermisos = ({
  permisos,
  onTogglePermission,
  onToggleAllCategory,
  getPermissionsByCategory,
  getCategoryLabel,
  getPermissionLabel,
}: UserPermisosProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Permisos del Rol
        </CardTitle>
        <CardDescription>Permisos específicos asignados a este usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(getPermissionsByCategory()).map(([category, categoryPerms]) => {
          const allChecked = categoryPerms.every((p: string) => permisos.includes(p));
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold">{getCategoryLabel(category)}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleAllCategory(category)}
                  className="h-8 text-xs"
                >
                  {allChecked ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Desmarcar todos
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Marcar todos
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categoryPerms.map((permission: string) => {
                  const isChecked = permisos.includes(permission);
                  return (
                    <div
                      key={permission}
                      onClick={() => onTogglePermission(permission)}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-primary/10 border-primary hover:bg-primary/20" 
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className={`h-5 w-5 border-2 rounded flex items-center justify-center transition-all ${
                        isChecked 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground"
                      }`}>
                        {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className={`text-sm font-medium ${
                        isChecked ? "text-primary" : ""
                      }`}>
                        {getPermissionLabel(permission)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
