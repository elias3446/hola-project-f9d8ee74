import { AuditLogs } from "@/components/ui/audit-logs";

interface UserCambiosProps {
  userId: string;
  userEmail?: string;
}

export const UserCambios = ({ userId, userEmail }: UserCambiosProps) => {
  return (
    <AuditLogs
      recordId={userId}
      userEmail={userEmail}
      title="Historial de Cambios en la Cuenta"
      description={`Monitoreo completo de actividades y cambios realizados en la cuenta de ${userEmail || 'este usuario'}`}
      activitiesTitle="Actividades Realizadas en la Cuenta"
      changesTitle="Historial de Cambios en la Cuenta"
      filterType="on_record"
    />
  );
};