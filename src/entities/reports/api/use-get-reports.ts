import { useQuery } from "@tanstack/react-query";
import { GetReportRdo } from "./rdo/get-reports.rdo";
import { getReports } from "./get-reports";

export const useGetReports = () => {
  return useQuery<GetReportRdo[], Error>({
    queryKey: ["reportsData"],
    queryFn: getReports,
    staleTime: 5 * 60 * 1000,
  });
};
