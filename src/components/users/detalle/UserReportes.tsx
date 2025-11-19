import { ReportsList } from "@/components/ui/reports-list";

interface UserReportesProps {
  reportes: any[];
  loadingReportes: boolean;
  userName: string;
}

export const UserReportes = ({ reportes, loadingReportes, userName }: UserReportesProps) => {
  return (
    <ReportsList
      reportes={reportes}
      loading={loadingReportes}
      title="Reportes Asignados"
      description={`Reportes actualmente asignados a ${userName}`}
      emptyMessage="Este usuario no tiene reportes asignados"
      showPagination={true}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
    />
  );
};
