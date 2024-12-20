import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabase } from "./create-database";

export const useCreateDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databasesData"] });
    },
    onError: (error) => {
      console.error("Failed to add db:", error);
    },
  });
};
