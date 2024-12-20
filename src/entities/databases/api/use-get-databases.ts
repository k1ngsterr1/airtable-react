import { useQuery } from "@tanstack/react-query";
import { GetDatabasesRDO } from "./rdo/get-databases.rdo";
import { getDatabases } from "./get-databases";

export const useDatabasesData = () => {
  return useQuery<GetDatabasesRDO[], Error>({
    queryKey: ["databasesData"],
    queryFn: getDatabases,
    staleTime: 5 * 60 * 1000,
  });
};
