export type Filter = {
  id: string;
  column: string;
  table: string;
  values: string[];
};

export type SetFilters = React.Dispatch<React.SetStateAction<Filter[]>>;

export type AirtableBase = {
  select: (params: { filterByFormula: string }) => {
    all: () => Promise<{ fields: Record<string, any> }[]>;
  };
};
