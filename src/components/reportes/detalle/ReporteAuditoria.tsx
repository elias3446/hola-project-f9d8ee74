import { AuditLogs } from "@/components/ui/audit-logs";

interface ReporteAuditoriaProps {
  reportId: string;
  reportName: string;
}

export const ReporteAuditoria = ({ reportId, reportName }: ReporteAuditoriaProps) => {
  return (
    <AuditLogs
      recordId={reportId}
      title="Auditoría del Reporte"
      description={`Monitoreo completo de actividades y cambios realizados en el reporte "${reportName}"`}
      activitiesTitle="Actividades del Reporte"
      changesTitle="Historial de Cambios del Reporte"
      filterType="on_record"
    />
  );
};
