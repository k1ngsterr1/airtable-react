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
  tableName: string;
  filters: Filter[];
  results: any;
  author?: string;
  createdAt?: Date;
}
