import { apiClient } from "@/shared/config/apiClient";
import { GetReportRdo, FilterRdo, ResultRdo } from "./rdo/get-reports.rdo";

export const getReports = async (): Promise<GetReportRdo[]> => {
  const response = await apiClient.get("/reports");

  return response.data.map((report: any) => ({
    ...report,
    filters: JSON.parse(report.filters) as FilterRdo[],
    results: JSON.parse(report.results) as ResultRdo[],
  }));
};
