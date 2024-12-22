import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateReportDto } from "./dto/create-report.dto";
import { createReport } from "./create-report";

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportData: CreateReportDto) => createReport(reportData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reportsData"] });
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    },
  });
};
