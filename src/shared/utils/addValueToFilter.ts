import { Filter } from "./types";

export const addValueToFilter = (
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>,
  filters: Filter[],
  id: string,
  currentValue: boolean | string,
  setCurrentValue: React.Dispatch<React.SetStateAction<string>>,
  columnName?: string // Pass the column name to format the value
): void => {
  if (typeof currentValue === "string" && !currentValue.trim()) return;

  const formattedValue =
    typeof currentValue === "boolean"
      ? `${columnName}(${currentValue ? "true" : "false"})`
      : currentValue;

  setFilters(
    filters.map((filter) => {
      if (filter.id === id) {
        return {
          ...filter,
          values: [...filter.values, formattedValue], // Save formatted value
        };
      }
      return filter;
    })
  );

  setCurrentValue("");
};
