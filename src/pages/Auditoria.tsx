import { Layout } from "@/components/Layout";
import { Eye } from "lucide-react";
import { AuditLogs } from "@/components/ui/audit-logs";

const Auditoria = () => {
  return (
    <Layout title="Auditoría" icon={Eye}>
      <div className="max-w-7xl mx-auto">
        <AuditLogs
          title="Auditoría del Sistema"
          description="Monitoreo completo de actividades y cambios realizados en el sistema"
          activitiesTitle="Todas las Actividades del Sistema"
          changesTitle="Historial Completo de Cambios"
          filterType="all"
        />
      </div>
    </Layout>
  );
};

export default Auditoria;
