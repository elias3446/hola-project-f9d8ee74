import { AuditLogs } from "@/components/ui/audit-logs";

interface UserAuditoriaProps {
  userId: string;
  userEmail?: string;
}

export const UserAuditoria = ({ userId, userEmail }: UserAuditoriaProps) => {
  return (
    <AuditLogs
      userId={userId}
      userEmail={userEmail}
      title="Auditoría del Usuario"
      description={`Monitoreo completo de actividades y cambios realizados por ${userEmail || 'este usuario'} en el sistema`}
      activitiesTitle="Actividades Realizadas en el Sistema"
      changesTitle="Historial de Cambios Realizados"
      filterType="by_user"
    />
  );
};