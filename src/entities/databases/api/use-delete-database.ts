import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDatabase } from "./delete-database";

export const useDeleteDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databasesData"] });
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    },
  });
};
