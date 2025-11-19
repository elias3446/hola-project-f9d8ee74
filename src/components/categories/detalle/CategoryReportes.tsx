import { ReportsList } from "@/components/ui/reports-list";

interface CategoryReportesProps {
  reportes: any[];
  loadingReportes: boolean;
  categoryName: string;
}

export const CategoryReportes = ({ 
  reportes, 
  loadingReportes, 
  categoryName 
}: CategoryReportesProps) => {
  return (
    <ReportsList
      reportes={reportes}
      loading={loadingReportes}
      title="Reportes Asociados"
      description={`Reportes con la categoría "${categoryName}"`}
      emptyMessage={`No hay reportes asociados a "${categoryName}"`}
      showPagination={true}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
    />
  );
};
