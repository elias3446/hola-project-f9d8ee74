import { AuditLogs } from "@/components/ui/audit-logs";

interface CategoryAuditoriaProps {
  categoryId: string;
  categoryName: string;
}

export const CategoryAuditoria = ({ categoryId, categoryName }: CategoryAuditoriaProps) => {
  return (
    <AuditLogs
      recordId={categoryId}
      title="Auditoría de la Categoría"
      description={`Monitoreo completo de actividades y cambios realizados en la categoría "${categoryName}"`}
      activitiesTitle="Actividades de la Categoría"
      changesTitle="Historial de Cambios de la Categoría"
      filterType="on_record"
    />
  );
};
