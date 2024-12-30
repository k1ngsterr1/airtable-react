export interface Filter {
  column: string;
  values: string[];
  booleanValue?: boolean;
  range?: { min: number; max: number };
}

export interface Result {
  requirement: string;
  filter: string;
  fields: string;
}

export interface CreateReportDto {
  tableNames: string[]; // This must match the key in `reportData`
  filters: {
    column: string;
    values: string[];
    booleanValue?: boolean;
    range?: { min: number; max: number };
  }[];
  results: { id: string; fields: any }[];
  author: string;
  createdAt: Date;
}
