import { Filter, SetFilters } from "./types";

export const addFilter = (setFilters: SetFilters, filters: Filter[]): void => {
  const newFilter: Filter = {
    id: Math.random().toString(36).substr(2, 9),
    column: "",
    values: [],
  };
  setFilters([...filters, newFilter]);
};
