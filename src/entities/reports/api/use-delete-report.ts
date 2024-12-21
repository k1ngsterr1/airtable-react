import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReport } from "./delete-report";

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportsData"] });
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    },
  });
};
