import { Filter, SetFilters } from "./types";

export const updateFilterColumn = (
  setFilters: SetFilters,
  filters: Filter[],
  id: string,
  column: string
): void => {
  setFilters(
    filters.map((filter) => (filter.id === id ? { ...filter, column } : filter))
  );
};
