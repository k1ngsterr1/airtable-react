import { Filter, SetFilters } from "./types";

export const removeFilter = (
  setFilters: SetFilters,
  filters: Filter[],
  id: string
): void => {
  setFilters(filters.filter((filter) => filter.id !== id));
};
