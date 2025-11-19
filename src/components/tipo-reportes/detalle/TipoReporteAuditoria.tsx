import { AuditLogs } from "@/components/ui/audit-logs";

interface TipoReporteAuditoriaProps {
  tipoReporteId: string;
  tipoReporteNombre: string;
}

export const TipoReporteAuditoria = ({ 
  tipoReporteId, 
  tipoReporteNombre 
}: TipoReporteAuditoriaProps) => {
  return (
    <AuditLogs
      recordId={tipoReporteId}
      title="Auditoría del Tipo de Reporte"
      description={`Monitoreo completo de actividades y cambios realizados en el tipo de reporte "${tipoReporteNombre}"`}
      activitiesTitle="Actividades del Tipo de Reporte"
      changesTitle="Historial de Cambios del Tipo de Reporte"
      filterType="on_record"
    />
  );
};
