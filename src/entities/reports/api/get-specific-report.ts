import { apiClient } from "@/shared/config/apiClient";
import { GetReportRdo, FilterRdo, ResultRdo } from "./rdo/get-reports.rdo";

export const getSpecificReport = async (id: string): Promise<GetReportRdo> => {
  const response = await apiClient.get(`/reports/${id}`);

  const report = response.data;

  return {
    ...report,
    filters: JSON.parse(report.filters) as FilterRdo[],
    results: JSON.parse(report.results) as ResultRdo[],
  };
};
