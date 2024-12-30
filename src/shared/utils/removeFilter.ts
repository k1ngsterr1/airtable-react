import { Filter } from "./types";

export const removeFilter = (
  setFiltersByTable: React.Dispatch<
    React.SetStateAction<Record<string, Filter[]>>
  >,
  tableName: string,
  filterId: string
) => {
  setFiltersByTable((prevFiltersByTable) => ({
    ...prevFiltersByTable,
    [tableName]: prevFiltersByTable[tableName]?.filter(
      (filter) => filter.id !== filterId
    ),
  }));
};
