import { ReportsList } from "@/components/ui/reports-list";

interface TipoReporteReportesProps {
  reportes: any[];
  loadingReportes: boolean;
  tipoReporteNombre: string;
}

export const TipoReporteReportes = ({ 
  reportes, 
  loadingReportes, 
  tipoReporteNombre 
}: TipoReporteReportesProps) => {
  return (
    <ReportsList
      reportes={reportes}
      loading={loadingReportes}
      title="Reportes Asociados"
      description={`Reportes del tipo "${tipoReporteNombre}"`}
      emptyMessage={`No hay reportes asociados a "${tipoReporteNombre}"`}
      showPagination={true}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
    />
  );
};
