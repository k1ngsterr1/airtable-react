import { Filter, SetFilters } from "./types";

export const removeValueFromFilter = (
  setFilters: SetFilters,
  filters: Filter[],
  filterId: string,
  valueIndex: number
): void => {
  setFilters(
    filters.map((filter) => {
      if (filter.id === filterId) {
        const newValues = [...filter.values];
        newValues.splice(valueIndex, 1);
        return { ...filter, values: newValues };
      }
      return filter;
    })
  );
};
