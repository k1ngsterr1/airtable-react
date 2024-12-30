import { Filter } from "./types";

export const removeFilter = (
  setFiltersByTable: React.Dispatch<
    React.SetStateAction<Record<string, Filter[]>>
  >,
  filtersByTable: Record<string, Filter[]>,
  tableName: string,
  filterId: string
): void => {
  setFiltersByTable({
    ...filtersByTable,
    [tableName]: filtersByTable[tableName]?.filter(
      (filter) => filter.id !== filterId
    ),
  });
};
