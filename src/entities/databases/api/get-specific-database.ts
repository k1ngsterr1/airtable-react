import { apiClient } from "@/shared/config/apiClient";
import { GetDatabasesRDO } from "./rdo/get-databases.rdo";

export const getSpecificDatabase = async (
  id: number
): Promise<GetDatabasesRDO> => {
  try {
    const { data } = await apiClient.get<GetDatabasesRDO>(`/databases/${id}`);

    return data;
  } catch (error) {
    console.log("There was an error with fetching database", error);
    throw new Error("Failed to fetch databases data");
  }
};
