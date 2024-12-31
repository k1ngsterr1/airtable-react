import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAllReports } from "./delete-all-reports";

export const useDeleteAllReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllReports(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportsData"] });
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    },
  });
};
