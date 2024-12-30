import { Filter } from "./types";

export const addValueToFilter = (
  setFiltersByTable: React.Dispatch<
    React.SetStateAction<Record<string, Filter[]>>
  >, // Now operates on the entire filtersByTable object
  filtersByTable: Record<string, Filter[]>,
  tableName: string, // Add tableName to specify which table's filters to update
  id: string,
  currentValue: boolean | string,
  setCurrentValue: React.Dispatch<React.SetStateAction<string>>,
  columnName?: string // Optional column name for formatting
): void => {
  if (typeof currentValue === "string" && !currentValue.trim()) return;

  const formattedValue =
    typeof currentValue === "boolean"
      ? `${columnName}(${currentValue ? "true" : "false"})`
      : currentValue;

  // Ensure filtersByTable[tableName] exists
  const currentFilters = filtersByTable[tableName] || [];

  setFiltersByTable({
    ...filtersByTable,
    [tableName]: currentFilters.map((filter) => {
      if (filter.id === id) {
        return {
          ...filter,
          values: [...filter.values, formattedValue], // Update values for the matching filter
        };
      }
      return filter;
    }),
  });

  setCurrentValue("");
};
