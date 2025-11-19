import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, RefreshCw, Activity, FileText, Shield, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ActivitiesTable } from "./activities-table";
import { ChangesHistoryTable } from "./changes-history-table";

interface AuditLogsProps {
  userId?: string;
  recordId?: string;
  userEmail?: string;
  title: string;
  description: string;
  activitiesTitle: string;
  changesTitle: string;
  filterType: "by_user" | "on_record" | "all";
}

type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'LOGIN' | 'LOGOUT';

interface AuditLog {
  id: string;
  action: OperationType;
  tabla_afectada: string | null;
  campos_modificados: string[] | null;
  valores_anteriores: any;
  valores_nuevos: any;
  metadata: any;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  user_id: string;
}

export const AuditLogs = ({ 
  userId, 
  recordId,
  userEmail, 
  title, 
  description,
  activitiesTitle,
  changesTitle,
  filterType 
}: AuditLogsProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilters, setActionFilters] = useState<string[]>(["all"]);
  const [activeTab, setActiveTab] = useState("activities");

  const actionTypes = [
    { value: "all", label: "Todos" },
    { value: "CREATE", label: "Crear" },
    { value: "UPDATE", label: "Actualizar" },
    { value: "DELETE", label: "Eliminar" },
    { value: "LOGIN", label: "Inicio de sesión" },
    { value: "LOGOUT", label: "Cierre de sesión" },
  ];

  useEffect(() => {
    loadAuditLogs();
  }, [userId, recordId, filterType]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      if (filterType === 'by_user') {
        // Acciones realizadas POR el usuario
        if (!userId) {
          toast.error('ID de usuario no proporcionado');
          return;
        }
        
        const { data, error } = await supabase
          .from('user_audit')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setAuditLogs(data || []);
      } else if (filterType === 'on_record') {
        // Acciones realizadas EN un registro específico (cambios EN el elemento)
        if (!recordId) {
          toast.error('ID de registro no proporcionado');
          return;
        }
        
        const { data, error } = await supabase
          .from('user_audit')
          .select('*')
          .eq('registro_id', recordId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setAuditLogs(data || []);
      } else if (filterType === 'all') {
        // Todas las acciones del sistema
        const { data, error } = await supabase
          .from('user_audit')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar el historial de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActionFilter = (value: string) => {
    if (value === "all") {
      setActionFilters(["all"]);
      return;
    }

    setActionFilters(prev => {
      const filtered = prev.filter(v => v !== "all");
      
      if (filtered.includes(value)) {
        const newFilters = filtered.filter(v => v !== value);
        return newFilters.length === 0 ? ["all"] : newFilters;
      } else {
        return [...filtered, value];
      }
    });
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = searchTerm === "" || 
        log.tabla_afectada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilters.includes("all") || actionFilters.includes(log.action);

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, actionFilters]);

  const activitiesLogs = useMemo(() => {
    // Mostrar TODAS las actividades del registro específico
    return filteredLogs;
  }, [filteredLogs]);

  const changesLogs = useMemo(() => {
    // Mostrar los mismos datos que actividades, solo cambian las columnas mostradas
    return filteredLogs;
  }, [filteredLogs]);

  const getActionDescription = (log: AuditLog): string => {
    switch (log.action) {
      case 'CREATE': return `Registro creado en ${log.tabla_afectada}`;
      case 'UPDATE': return `Registro actualizado en ${log.tabla_afectada}`;
      case 'DELETE': return `Registro eliminado de ${log.tabla_afectada}`;
      case 'SOFT_DELETE': return `Registro marcado como eliminado en ${log.tabla_afectada}`;
      case 'LOGIN': return 'Inicio de sesión en el sistema';
      case 'LOGOUT': return 'Cierre de sesión del sistema';
      default: return log.action;
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['Tipo', 'Descripción', 'Tabla', 'Fecha y Hora', 'IP'],
      ...filteredLogs.map(log => [
        log.action,
        getActionDescription(log),
        log.tabla_afectada || '-',
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.ip_address || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${userId || recordId}_${Date.now()}.csv`;
    a.click();
    toast.success('Resultados exportados correctamente');
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filtros de Búsqueda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="search-input" className="block min-h-[1.25rem]">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    placeholder="Buscar en descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-filter" className="block min-h-[1.25rem]">Tipo de Actividad/Operación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-10 justify-between font-normal"
                      id="activity-filter"
                    >
                      <span className="truncate">
                        {actionFilters.includes("all") 
                          ? "Todos los tipos" 
                          : `${actionFilters.length} seleccionado${actionFilters.length > 1 ? 's' : ''}`
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-4" align="start">
                    <div className="space-y-3">
                      {actionTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`action-${type.value}`}
                            checked={actionFilters.includes(type.value)}
                            onCheckedChange={() => handleToggleActionFilter(type.value)}
                          />
                          <Label
                            htmlFor={`action-${type.value}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end gap-2">
                <Button className="w-full" onClick={() => {
                  setSearchTerm("");
                  setActionFilters(["all"]);
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
                <Button variant="outline" size="icon" onClick={loadAuditLogs}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Export Button */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 sm:inline-flex">
              <TabsTrigger value="activities" className="gap-2">
                <Activity className="h-4 w-4" />
                Actividades
              </TabsTrigger>
              <TabsTrigger value="changes" className="gap-2">
                <FileText className="h-4 w-4" />
                Cambios
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={exportResults} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar Resultados
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "activities" ? (
        <ActivitiesTable logs={activitiesLogs} loading={loading} />
      ) : (
        <ChangesHistoryTable logs={changesLogs} loading={loading} userEmail={userEmail} />
      )}
    </div>
  );
};