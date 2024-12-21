import { useQuery } from "@tanstack/react-query";
import { GetReportRdo } from "./rdo/get-reports.rdo";
import { getSpecificReport } from "./get-specific-report";

export const useGetSpecificReport = (id: string | undefined) => {
  return useQuery<GetReportRdo, Error>({
    queryKey: ["reportsData", id], // Include `id` in the query key
    queryFn: ({ queryKey }) => {
      const [, reportId] = queryKey; // Extract `id` from the query key
      return getSpecificReport(reportId as string); // Ensure `id` is a string
    },
    staleTime: 5 * 60 * 1000,
  });
};
