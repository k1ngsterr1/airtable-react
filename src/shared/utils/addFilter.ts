import { Filter } from "./types";

export const addFilter = (
  setFiltersByTable: React.Dispatch<
    React.SetStateAction<Record<string, Filter[]>>
  >,
  filtersByTable: Record<string, Filter[]>,
  tableName: string
): void => {
  const newFilter: Filter = {
    id: Math.random().toString(36).substr(2, 9),
    column: "",
    table: tableName,
    values: [],
  };

  setFiltersByTable({
    ...filtersByTable,
    [tableName]: [...(filtersByTable[tableName] || []), newFilter], // Add the new filter to the selected table
  });
};
