import { useQuery } from "@tanstack/react-query";
import { GetDatabasesRDO } from "./rdo/get-databases.rdo";
import { getSpecificDatabase } from "./get-specific-database";

export const useSpecificDatabaseData = (id: number) => {
  return useQuery<GetDatabasesRDO, Error>({
    queryKey: ["databasesData", id],
    queryFn: () => getSpecificDatabase(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
